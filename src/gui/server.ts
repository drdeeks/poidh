#!/usr/bin/env ts-node
/**
 * GUI Server for Autonomous Bounty Bot
 *
 * Express server that provides:
 * - Static file serving for the frontend GUI
 * - REST API endpoints for configuration, bounty management, and status
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import apiRoutes from './api';
import { log } from '../utils/logger';
import { agent } from '../agent';

const PORT = parseInt(process.env.GUI_PORT || '3847', 10);

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  log.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined,
  });
  next();
});

// API routes
app.use('/api', apiRoutes);

// Serve static files from gui/dist
const guiDistPath = path.resolve(process.cwd(), 'gui', 'dist');
app.use(express.static(guiDistPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req: Request, res: Response) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint not found' });
  }

  const indexPath = path.join(guiDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Autonomous Bounty Bot</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
            h1 { color: #333; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            .status { padding: 10px; background: #e8f5e9; border-radius: 5px; margin: 20px 0; }
            a { color: #1976d2; }
          </style>
        </head>
        <body>
          <h1>🤖 Autonomous Bounty Bot</h1>
          <div class="status">
            <strong>API Server Running</strong> on port ${PORT}
          </div>
          <p>The GUI frontend is not built yet. Run:</p>
          <pre>cd gui && npm install && npm run build</pre>
          <p>Or access the API directly:</p>
          <ul>
            <li><a href="/api/status">GET /api/status</a> - Agent status</li>
            <li><a href="/api/config">GET /api/config</a> - Configuration</li>
            <li><a href="/api/bounties">GET /api/bounties</a> - List bounties</li>
            <li><a href="/api/templates">GET /api/templates</a> - Bounty templates</li>
            <li><a href="/api/wallet">GET /api/wallet</a> - Wallet info</li>
            <li><a href="/api/logs">GET /api/logs</a> - Recent logs</li>
          </ul>
        </body>
        </html>
      `);
    }
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  log.error('Server error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

async function startServer(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║           🖥️  AUTONOMOUS BOUNTY BOT - GUI SERVER 🖥️                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

  try {
    // Initialize the agent (wallet, contracts, etc.)
    log.info('Initializing agent...');
    await agent.initialize();
    log.info('Agent initialized successfully');
  } catch (error) {
    log.warn('Agent initialization failed - API will work with limited functionality', {
      error: (error as Error).message,
    });
  }

  app.listen(PORT, () => {
    log.info(`🚀 GUI Server running on http://localhost:${PORT}`);
    console.log(`
┌─────────────────────────────────────────────────────────────────────────────┐
│  Server started successfully!                                               │
│                                                                             │
│  GUI:     http://localhost:${PORT}                                           │
│  API:     http://localhost:${PORT}/api                                       │
│                                                                             │
│  API Endpoints:                                                             │
│    GET  /api/status          - Agent status                                 │
│    GET  /api/config          - Current configuration                        │
│    POST /api/config          - Update configuration                         │
│    GET  /api/bounties        - List all bounties                            │
│    POST /api/bounties        - Create a new bounty                          │
│    GET  /api/bounties/:id    - Get bounty details                           │
│    POST /api/agent/start     - Start the agent                              │
│    POST /api/agent/stop      - Stop the agent                               │
│    GET  /api/templates       - Get bounty templates                         │
│    POST /api/bounties/launch/:type - Launch production bounty               │
│    GET  /api/wallet          - Get wallet info                              │
│    GET  /api/logs            - Get recent logs                              │
│                                                                             │
│  Press Ctrl+C to stop                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
`);
  });
}

// Start server if run directly
if (require.main === module) {
  startServer().catch((error) => {
    log.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  });
}

export { app, startServer };
