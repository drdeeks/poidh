/**
 * Fallback and Resilience Utilities
 *
 * Provides robust fallback mechanisms for critical operations.
 */

import { JsonRpcProvider } from 'ethers';
import { log } from './logger';
import { RPCError, withRetry } from './errors';

/**
 * RPC Provider with automatic failover
 */
export class FallbackProvider {
  private providers: JsonRpcProvider[] = [];
  private currentIndex = 0;
  private healthStatus: Map<string, boolean> = new Map();

  constructor(rpcUrls: string[], chainId: number) {
    for (const url of rpcUrls) {
      if (url && url.trim()) {
        this.providers.push(
          new JsonRpcProvider(url.trim(), {
            chainId,
            name: `chain-${chainId}`,
          })
        );
        this.healthStatus.set(url.trim(), true);
      }
    }

    if (this.providers.length === 0) {
      throw new Error('At least one RPC URL is required');
    }

    log.info(`FallbackProvider initialized with ${this.providers.length} endpoints`);
  }

  /**
   * Get current healthy provider
   */
  getProvider(): JsonRpcProvider {
    return this.providers[this.currentIndex];
  }

  /**
   * Execute with automatic failover
   */
  async execute<T>(fn: (provider: JsonRpcProvider) => Promise<T>): Promise<T> {
    const startIndex = this.currentIndex;
    let lastError: Error | undefined;

    // Try each provider
    for (let i = 0; i < this.providers.length; i++) {
      const index = (startIndex + i) % this.providers.length;
      const provider = this.providers[index];

      try {
        const result = await withRetry(() => fn(provider), {
          maxRetries: 2,
          baseDelayMs: 500,
        });

        // Success - update current index if we switched
        if (index !== this.currentIndex) {
          log.info(`Switched to RPC provider ${index}`);
          this.currentIndex = index;
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        log.warn(`RPC provider ${index} failed`, {
          error: (error as Error).message,
        });

        // Mark as unhealthy temporarily
        this.healthStatus.set(
          this.providers[index]._getConnection().url,
          false
        );
      }
    }

    throw new RPCError(
      `All ${this.providers.length} RPC providers failed`,
      this.providers[this.currentIndex]._getConnection().url
    );
  }

  /**
   * Health check all providers
   */
  async healthCheck(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      const url = provider._getConnection().url;

      try {
        await provider.getBlockNumber();
        results.set(url, true);
        this.healthStatus.set(url, true);
      } catch {
        results.set(url, false);
        this.healthStatus.set(url, false);
      }
    }

    return results;
  }

  /**
   * Get count of healthy providers
   */
  getHealthyCount(): number {
    return Array.from(this.healthStatus.values()).filter(Boolean).length;
  }
}

/**
 * Circuit Breaker Pattern
 *
 * Prevents repeated calls to failing services.
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailure: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should reset
    if (
      this.state === 'open' &&
      Date.now() - this.lastFailure > this.resetTimeMs
    ) {
      this.state = 'half-open';
      log.info('Circuit breaker: half-open, testing...');
    }

    // Reject if circuit is open
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open - service unavailable');
    }

    try {
      const result = await fn();

      // Success - reset if we were in half-open
      if (this.state === 'half-open') {
        this.reset();
        log.info('Circuit breaker: closed (service recovered)');
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      log.warn(`Circuit breaker: open (${this.failures} failures)`);
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Rate Limiter
 *
 * Prevents exceeding API rate limits.
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number = 10,
    private readonly refillRatePerSecond: number = 1
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRatePerSecond * 1000;
      log.debug(`Rate limited, waiting ${Math.round(waitTime)}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.refill();
    }

    this.tokens--;
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.maxTokens,
      this.tokens + elapsed * this.refillRatePerSecond
    );
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

/**
 * Graceful Shutdown Handler
 */
export class GracefulShutdown {
  private shutdownCallbacks: (() => Promise<void>)[] = [];
  private isShuttingDown = false;

  constructor() {
    this.setupSignalHandlers();
  }

  private setupSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

    for (const signal of signals) {
      process.on(signal, () => this.shutdown(signal));
    }

    process.on('uncaughtException', (error) => {
      log.error('Uncaught exception', { error: error.message, stack: error.stack });
      this.shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      log.error('Unhandled rejection', { reason: String(reason) });
    });
  }

  onShutdown(callback: () => Promise<void>): void {
    this.shutdownCallbacks.push(callback);
  }

  private async shutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    log.info(`Received ${signal}, starting graceful shutdown...`);

    const timeout = setTimeout(() => {
      log.error('Shutdown timeout, forcing exit');
      process.exit(1);
    }, 30000);

    try {
      for (const callback of this.shutdownCallbacks) {
        await callback();
      }
      log.info('Graceful shutdown complete');
      clearTimeout(timeout);
      process.exit(0);
    } catch (error) {
      log.error('Error during shutdown', { error: (error as Error).message });
      clearTimeout(timeout);
      process.exit(1);
    }
  }
}

/**
 * Global shutdown handler instance
 */
export const gracefulShutdown = new GracefulShutdown();
