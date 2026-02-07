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
import { config, getTxExplorerUrl, getContractExplorerLink } from '../config';
import { getChainConfig, getChainName } from '../config/chains';

const app: Express = express();
const PORT = parseInt(process.env.STREAMING_PORT || '3001', 10);

// Store for tracking changes
let lastAuditChecksum = '';
let connectedClients: WebSocket[] = [];
let sseClients: Response[] = [];

function getChainContext() {
  const chainId = config.chainId;
  try {
    const chainCfg = getChainConfig(chainId);
    return {
      chainId,
      chainName: chainCfg.name,
      nativeCurrency: chainCfg.nativeCurrency,
      explorerBaseUrl: chainCfg.blockExplorerUrls[0],
      contractAddress: config.poidhContractAddress,
      contractExplorerUrl: getContractExplorerLink(config.poidhContractAddress, chainId),
    };
  } catch {
    return {
      chainId,
      chainName: `Chain ${chainId}`,
      nativeCurrency: 'ETH',
      explorerBaseUrl: '',
      contractAddress: config.poidhContractAddress,
      contractExplorerUrl: '',
    };
  }
}

function enrichEntry(entry: any) {
  return {
    ...entry,
    txExplorerUrl: entry.txHash ? getTxExplorerUrl(entry.txHash, config.chainId) : undefined,
  };
}

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
  const chain = getChainContext();
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    chain,
  });
});

/**
 * Debug endpoint
 */
app.get('/api/debug-summary', (req: Request, res: Response) => {
  try {
    const summary = auditTrail.getSummary();
    log.info('DEBUG Summary object', summary);
    res.json({
      summary,
      keys: Object.keys(summary),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

/**
 * Get current audit trail state
 */
app.get('/api/audit-state', (req: Request, res: Response) => {
  try {
    const state = auditTrail.getState();
    const summary = auditTrail.getSummary();
    
    res.json({
      state: {
        ...state,
        chainId: summary.chainId,
        chainName: summary.chainName,
        contractAddress: summary.contractAddress,
      },
      summary,
      chain: getChainContext(),
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
    const recent = state.entries.slice(-limit).reverse().map(enrichEntry);
    
    res.json({
      entries: recent,
      total: state.entries.length,
      chain: getChainContext(),
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
      .map(e => enrichEntry({
        ...e,
        timestamp: new Date(e.timestamp).toISOString(),
      }))
      .reverse();
    
    res.json({
      winners,
      total: winners.length,
      chain: getChainContext(),
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
      .map(e => enrichEntry({
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
        txHash: e.txHash,
      }))
      .reverse();
    
    res.json({
      rejections,
      total: rejections.length,
      chain: getChainContext(),
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
        return enrichEntry({
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
          txHash: e.txHash,
        });
      })
      .reverse();
    
    res.json({
      decisions,
      total: decisions.length,
      accepted: decisions.filter(d => d.decision === 'ACCEPTED').length,
      rejected: decisions.filter(d => d.decision === 'REJECTED').length,
      chain: getChainContext(),
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
      chain: getChainContext(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: msg });
  }
});

/**
 * Get all bounties (created + auto-indexed) with chain-aware fields
 */
app.get('/api/bounties', (req: Request, res: Response) => {
  try {
    const state = auditTrail.getState();
    const chain = getChainContext();
    const bounties: any[] = [];

    // From BOUNTY_CREATED entries
    state.entries
      .filter(e => e.action === 'BOUNTY_CREATED')
      .forEach(e => {
        bounties.push({
          id: e.details.onChainId || e.details.configId,
          name: e.details.name,
          reward: e.details.rewardAmount || e.details.rewardEth,
          currency: e.details.rewardCurrency || chain.nativeCurrency,
          chainId: e.details.chainId || chain.chainId,
          chainName: e.details.chainName || chain.chainName,
          selectionMode: e.details.selectionMode,
          proofType: e.details.proofType,
          deadline: e.details.deadline,
          txHash: e.txHash,
          txExplorerUrl: e.txHash ? getTxExplorerUrl(e.txHash, e.details.chainId || chain.chainId) : undefined,
          source: 'created',
          createdAt: e.timestamp,
        });
      });

    // From auto-indexed entries
    state.entries
      .filter(e => e.action === 'BOUNTIES_AUTO_INDEXED')
      .forEach(e => {
        if (e.details.discoveredBounties) {
          e.details.discoveredBounties.forEach((b: any) => {
            if (!bounties.find(x => x.id === b.id)) {
              bounties.push({
                id: b.id,
                name: b.name,
                reward: b.rewardAmount,
                currency: b.rewardCurrency || e.details.nativeCurrency || chain.nativeCurrency,
                chainId: e.details.chainId || chain.chainId,
                chainName: b.chainName || e.details.chainName || chain.chainName,
                selectionMode: 'auto-indexed',
                source: 'auto-indexed',
                createdAt: e.timestamp,
              });
            }
          });
        }
      });

    res.json({
      bounties,
      total: bounties.length,
      chain,
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
  const summary = auditTrail.getSummary();
  res.write(`data: ${JSON.stringify({
    type: 'INIT',
    state: {
      ...state,
      chainId: summary.chainId,
      chainName: summary.chainName,
      contractAddress: summary.contractAddress,
    },
    summary,
    chain: getChainContext(),
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
    const summary = auditTrail.getSummary();
    const latestEntry = state.entries[state.entries.length - 1];
    
    if (latestEntry && latestEntry.entryHash !== lastAuditChecksum) {
      lastAuditChecksum = latestEntry.entryHash;
      
      const recentEntries = state.entries.slice(-30).map(enrichEntry);
      
      broadcastUpdate({
        action: latestEntry.action,
        details: latestEntry.details,
        timestamp: latestEntry.timestamp,
        latestEntry: enrichEntry(latestEntry),
        recentEntries,
        summary,
        chain: getChainContext(),
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
  const summary = auditTrail.getSummary();
  const initMessage = JSON.stringify({
    type: 'INIT',
    state: {
      ...state,
      chainId: summary.chainId,
      chainName: summary.chainName,
      contractAddress: summary.contractAddress,
    },
    summary,
    chain: getChainContext(),
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
  log.info(`║   GET /api/bounties      - All bounties (chain-aware)`);
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
