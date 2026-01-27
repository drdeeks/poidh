/**
 * Health Check and Monitoring
 *
 * Provides health check endpoints and system monitoring.
 */

import http from 'http';
import { log } from './logger';
import { walletManager } from '../wallet';
import { config } from '../config';

/**
 * Health status interface
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    duration?: number;
  }[];
}

/**
 * System metrics interface
 */
export interface SystemMetrics {
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpuUsage: NodeJS.CpuUsage;
  uptime: number;
  bounties: {
    active: number;
    completed: number;
    totalPayouts: string;
  };
}

/**
 * Health Check Service
 */
export class HealthCheckService {
  private server: http.Server | null = null;
  private startTime: number = Date.now();
  private customChecks: Map<string, () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>> = new Map();

  /**
   * Register a custom health check
   */
  registerCheck(
    name: string,
    check: () => Promise<{ status: 'pass' | 'fail' | 'warn'; message?: string }>
  ): void {
    this.customChecks.set(name, check);
  }

  /**
   * Run all health checks
   */
  async runChecks(): Promise<HealthStatus> {
    const checks: HealthStatus['checks'] = [];

    // Wallet check
    try {
      const start = Date.now();
      const balance = await walletManager.getBalance();
      const balanceNum = parseFloat(balance);

      checks.push({
        name: 'wallet',
        status: balanceNum >= 0.001 ? 'pass' : balanceNum > 0 ? 'warn' : 'fail',
        message: `Balance: ${balance} ETH`,
        duration: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: 'wallet',
        status: 'fail',
        message: (error as Error).message,
      });
    }

    // RPC connectivity check
    try {
      const start = Date.now();
      const network = await walletManager.getNetworkInfo();
      checks.push({
        name: 'rpc',
        status: 'pass',
        message: `Connected to ${network.name} at block ${network.blockNumber}`,
        duration: Date.now() - start,
      });
    } catch (error) {
      checks.push({
        name: 'rpc',
        status: 'fail',
        message: (error as Error).message,
      });
    }

    // Memory check
    const memory = process.memoryUsage();
    const heapUsedMB = memory.heapUsed / 1024 / 1024;
    checks.push({
      name: 'memory',
      status: heapUsedMB < 500 ? 'pass' : heapUsedMB < 1000 ? 'warn' : 'fail',
      message: `Heap: ${heapUsedMB.toFixed(2)} MB`,
    });

    // Run custom checks
    for (const [name, checkFn] of this.customChecks) {
      try {
        const start = Date.now();
        const result = await checkFn();
        checks.push({
          name,
          status: result.status,
          message: result.message,
          duration: Date.now() - start,
        });
      } catch (error) {
        checks.push({
          name,
          status: 'fail',
          message: (error as Error).message,
        });
      }
    }

    // Determine overall status
    const hasFailure = checks.some((c) => c.status === 'fail');
    const hasWarning = checks.some((c) => c.status === 'warn');

    return {
      status: hasFailure ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: process.env.npm_package_version || '1.0.0',
      checks,
    };
  }

  /**
   * Get system metrics
   */
  getMetrics(): SystemMetrics {
    const memory = process.memoryUsage();

    return {
      memoryUsage: {
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external,
        rss: memory.rss,
      },
      cpuUsage: process.cpuUsage(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      bounties: {
        active: 0, // Would be populated from bountyManager
        completed: 0,
        totalPayouts: '0',
      },
    };
  }

  /**
   * Start health check HTTP server
   */
  start(port: number = 3000): void {
    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`);

      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Content-Type', 'application/json');

      try {
        if (url.pathname === '/health' || url.pathname === '/healthz') {
          const health = await this.runChecks();
          const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;
          res.writeHead(statusCode);
          res.end(JSON.stringify(health, null, 2));
        } else if (url.pathname === '/ready' || url.pathname === '/readyz') {
          // Readiness check - simpler version
          const health = await this.runChecks();
          res.writeHead(health.status === 'unhealthy' ? 503 : 200);
          res.end(JSON.stringify({ ready: health.status !== 'unhealthy' }));
        } else if (url.pathname === '/live' || url.pathname === '/livez') {
          // Liveness check - always pass if server is running
          res.writeHead(200);
          res.end(JSON.stringify({ alive: true }));
        } else if (url.pathname === '/metrics') {
          const metrics = this.getMetrics();
          res.writeHead(200);
          res.end(JSON.stringify(metrics, null, 2));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      } catch (error) {
        log.error('Health check error', { error: (error as Error).message });
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal error' }));
      }
    });

    this.server.listen(port, () => {
      log.info(`Health check server listening on port ${port}`);
    });
  }

  /**
   * Stop health check server
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server!.close((err) => {
          if (err) reject(err);
          else {
            log.info('Health check server stopped');
            resolve();
          }
        });
      });
    }
  }
}

// Export singleton
export const healthCheck = new HealthCheckService();

/**
 * Format metrics for Prometheus
 */
export function formatPrometheusMetrics(metrics: SystemMetrics): string {
  const lines: string[] = [
    '# HELP bounty_bot_memory_heap_bytes Heap memory usage in bytes',
    '# TYPE bounty_bot_memory_heap_bytes gauge',
    `bounty_bot_memory_heap_bytes{type="used"} ${metrics.memoryUsage.heapUsed}`,
    `bounty_bot_memory_heap_bytes{type="total"} ${metrics.memoryUsage.heapTotal}`,
    '',
    '# HELP bounty_bot_uptime_seconds Bot uptime in seconds',
    '# TYPE bounty_bot_uptime_seconds counter',
    `bounty_bot_uptime_seconds ${metrics.uptime}`,
    '',
    '# HELP bounty_bot_bounties_total Total bounties by status',
    '# TYPE bounty_bot_bounties_total gauge',
    `bounty_bot_bounties_total{status="active"} ${metrics.bounties.active}`,
    `bounty_bot_bounties_total{status="completed"} ${metrics.bounties.completed}`,
  ];

  return lines.join('\n');
}
