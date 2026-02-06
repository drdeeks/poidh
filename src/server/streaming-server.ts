/**
 * Streaming Server - Real-time bot activity monitoring
 *
 * Provides WebSocket and Server-Sent Events (SSE) endpoints
 * to stream bot activity to web browsers in real-time.
 *
 * Usage:
 *   STREAMING_PORT=3001 npm run server:stream
 */

import express, { Express, Request, Response } from 'express';
import http from 'http';
import WebSocket from 'ws';
import path from 'path';
import { log } from '../utils/logger';
import { auditTrail } from '../utils/audit-trail';
import { config } from '../config';

const app: Express = express();
const PORT = parseInt(process.env.STREAMING_PORT || '3001', 10);

// Store for tracking changes
let lastAuditChecksum = '';
let connectedClients: WebSocket[] = [];
let sseClients: Response[] = [];

// Initialize audit trail
try {
  auditTrail.initialize(config.chainId, config.poidhContractAddress, config.botPrivateKey.substring(0, 42));
  log.info('Audit trail loaded for streaming server');
} catch (error) {
  log.warn('Audit trail not yet initialized, will load when available');
}

// Serve static files (dashboard)
app.use(express.static(path.join(__dirname, '../../web')));
app.use(express.json());

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get current audit trail state
 */
app.get('/api/audit-state', (req: Request, res: Response) => {
  try {
    const state = auditTrail.getState();
    const summary = auditTrail.getSummary();
    
    res.json({
      state,
      summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

/**
 * Get recent entries
 */
app.get('/api/recent-entries', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const state = auditTrail.getState();
    const recent = state.entries.slice(-limit).reverse();
    
    res.json({
      entries: recent,
      total: state.entries.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

/**
 * Get winner rationale details
 */
app.get('/api/winners', (req: Request, res: Response) => {
  try {
    const state = auditTrail.getState();
    const winners = state.entries
      .filter(e => e.action === 'WINNER_RATIONALE')
      .map(e => ({
        ...e,
        timestamp: new Date(e.timestamp).toISOString(),
      }))
      .reverse();
    
    res.json({
      winners,
      total: winners.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

/**
 * Get rejected submissions with detailed reasoning
 */
app.get('/api/rejections', (req: Request, res: Response) => {
  try {
    const state = auditTrail.getState();
    const rejections = state.entries
      .filter(e => e.action === 'SUBMISSION_REJECTED')
      .map(e => ({
        sequence: e.sequence,
        timestamp: new Date(e.timestamp).toISOString(),
        action: e.action,
        bountyId: e.details.bountyId,
        submitter: e.details.submitter,
        claimId: e.details.claimId,
        validationScore: e.details.validationScore,
        reason: e.details.reason,
        failedChecks: e.details.failedChecks || [],
        passedChecks: e.details.passedChecks || [],
        verificationMethod: 'Validation engine evaluated submission against bounty criteria',
        entryHash: e.entryHash,
      }))
      .reverse();
    
    res.json({
      rejections,
      total: rejections.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

/**
 * Get validation decisions (both accepted and rejected) with full reasoning
 */
app.get('/api/decisions', (req: Request, res: Response) => {
  try {
    const state = auditTrail.getState();
    const decisions = state.entries
      .filter(e => e.action === 'SUBMISSION_VALIDATED' || e.action === 'SUBMISSION_REJECTED')
      .map(e => {
        const isValidated = e.action === 'SUBMISSION_VALIDATED';
        return {
          sequence: e.sequence,
          timestamp: new Date(e.timestamp).toISOString(),
          action: e.action,
          decision: isValidated ? (e.details.isValid ? 'ACCEPTED' : 'REJECTED') : 'REJECTED',
          bountyId: e.details.bountyId,
          bountyName: e.details.bountyName,
          submitter: e.details.submitter,
          claimId: e.details.claimId,
          validationScore: e.details.validationScore,
          passingThreshold: e.details.passingThreshold || 50,
          
          // Reasoning and logic
          reason: e.details.reason || e.details.decisionReason,
          rationale: e.details.decisionRationale,
          
          // Detailed checks
          validationChecks: e.details.validationChecks || [],
          failedChecks: e.details.failedChecks || [],
          passedChecks: e.details.passedChecks || [],
          
          // AI evaluation if applicable
          aiScore: e.details.aiScore,
          aiConfidence: e.details.aiConfidence,
          aiReasoning: e.details.aiReasoning,
          aiModel: e.details.aiModel,
          
          // Verification info
          verificationMethod: isValidated 
            ? `Score ${e.details.validationScore}/100 evaluated against threshold ${e.details.passingThreshold || 50}`
            : 'Validation engine evaluated submission - failed to meet criteria',
          
          entryHash: e.entryHash,
        };
      })
      .reverse();
    
    res.json({
      decisions,
      total: decisions.length,
      accepted: decisions.filter(d => d.decision === 'ACCEPTED').length,
      rejected: decisions.filter(d => d.decision === 'REJECTED').length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

/**
 * Get auto-indexed bounties
 */
app.get('/api/indexed-bounties', (req: Request, res: Response) => {
  try {
    const state = auditTrail.getState();
    const indexed = state.entries
      .filter(e => e.action === 'BOUNTIES_AUTO_INDEXED')
      .map(e => ({
        sequence: e.sequence,
        timestamp: new Date(e.timestamp).toISOString(),
        botWalletAddress: e.details.botWalletAddress,
        chainId: e.details.chainId,
        chainName: e.details.chainName,
        nativeCurrency: e.details.nativeCurrency,
        totalBountiesScanned: e.details.totalBountiesScanned,
        botBountiesFound: e.details.botBountiesFound,
        filterCriteria: e.details.filterCriteria,
        verificationLogic: e.details.verificationLogic,
        discoveredBounties: e.details.discoveredBounties,
        entryHash: e.entryHash,
      }))
      .reverse();
    
    res.json({
      indexed,
      total: indexed.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

/**
 * Server-Sent Events (SSE) endpoint for streaming
 */
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial state
  const state = auditTrail.getState();
  res.write(`data: ${JSON.stringify({
    type: 'INIT',
    state,
    timestamp: new Date().toISOString(),
  })}\n\n`);

  // Add to clients list
  sseClients.push(res);
  log.info(`SSE client connected. Total: ${sseClients.length}`);

  // Handle client disconnect
  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
    log.info(`SSE client disconnected. Total: ${sseClients.length}`);
  });
});

/**
 * Broadcast to all connected clients
 */
export function broadcastUpdate(data: Record<string, any>): void {
  const message = JSON.stringify({
    type: 'UPDATE',
    data,
    timestamp: new Date().toISOString(),
  });

  // WebSocket clients
  connectedClients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  // SSE clients
  sseClients.forEach(res => {
    if (!res.destroyed) {
      res.write(`data: ${message}\n\n`);
    }
  });
}

/**
 * Check for audit trail changes and broadcast them
 */
function pollAuditTrail(): void {
  try {
    const state = auditTrail.getState();
    const latestEntry = state.entries[state.entries.length - 1];
    
    if (latestEntry && latestEntry.entryHash !== lastAuditChecksum) { // Use entryHash for robust change detection
      lastAuditChecksum = latestEntry.entryHash; // Update checksum with the new entryHash
      
      broadcastUpdate({
        action: latestEntry.action,
        details: latestEntry.details,
        timestamp: latestEntry.timestamp,
        summary: state.summary,
      });
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error(`Error polling audit trail: ${msg}`);
  }
}

/**
 * Setup polling
 */
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || '5', 10) * 1000;
setInterval(pollAuditTrail, POLL_INTERVAL);

/**
 * Setup WebSocket
 */
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
  connectedClients.push(ws);
  log.info(`WebSocket client connected. Total: ${connectedClients.length}`);

  // Send initial state
  const state = auditTrail.getState();
  const initMessage = JSON.stringify({
    type: 'INIT',
    state,
    timestamp: new Date().toISOString(),
  });
  ws.send(initMessage);

  ws.on('close', () => {
    connectedClients = connectedClients.filter(client => client !== ws);
    log.info(`WebSocket client disconnected. Total: ${connectedClients.length}`);
  });

  ws.on('error', (error: Error) => {
    log.error(`WebSocket error: ${error.message}`);
  });
});

/**
 * Start server
 */
server.listen(PORT, () => {
  log.info(`\n╔════════════════════════════════════════════════════════════════╗`);
  log.info(`║ 🚀 STREAMING SERVER STARTED                                   ║`);
  log.info(`╠════════════════════════════════════════════════════════════════╣`);
  log.info(`║ Listening on: http://localhost:${PORT}`);
  log.info(`║ Dashboard: http://localhost:${PORT}`);
  log.info(`║ WebSocket: ws://localhost:${PORT}`);
  log.info(`║ SSE Stream: http://localhost:${PORT}/api/stream`);
  log.info(`║ API Endpoints:`);
  log.info(`║   GET /health            - Health check`);
  log.info(`║   GET /api/audit-state   - Full audit state`);
  log.info(`║   GET /api/recent-entries - Recent activity`);
  log.info(`║   GET /api/winners       - Winner details with rationale`);
  log.info(`║   GET /api/rejections    - Rejected submissions with reasons`);
  log.info(`║   GET /api/decisions     - All validation decisions (accept/reject)`);
  log.info(`║   GET /api/indexed-bounties - Auto-indexed bounties`);
  log.info(`║   GET /api/stream        - Server-Sent Events stream`);
  log.info(`╠════════════════════════════════════════════════════════════════╣`);
  log.info(`║ Bot Activity is streaming in real-time`);
  log.info(`╚════════════════════════════════════════════════════════════════╝\n`);
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  log.info('\nShutting down streaming server...');
  
  // Close all client connections
  connectedClients.forEach(ws => ws.close());
  sseClients.forEach(res => res.end());
  
  server.close(() => {
    log.info('Streaming server closed.');
    process.exit(0);
  });
});

export default app;
