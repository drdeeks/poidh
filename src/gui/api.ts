import { Router, Request, Response } from 'express';
import { agent } from '../agent';
import { config, loadConfig, Config } from '../config';
import { bountyManager } from '../bounty/manager';
import { walletManager } from '../wallet';
import { PRODUCTION_BOUNTIES, createFreshBounty } from '../bounty/configs/production-bounties';
import { BountyConfig, BountyStatus, ActiveBounty } from '../bounty/types';
import { log } from '../utils/logger';
import fs from 'fs';
import path from 'path';

const router = Router();

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AgentStatus {
  isRunning: boolean;
  activeBounties: number;
  completedBounties: number;
  totalPayouts: number;
  network: string;
  walletAddress?: string;
  walletBalance?: string;
}

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: Record<string, unknown>;
}

interface BountyTemplate {
  id: string;
  name: string;
  description: string;
  selectionMode: string;
  rewardEth: string;
  deadlineHours: number;
  tags: string[];
}

function sendSuccess<T>(res: Response, data: T): void {
  res.json({ success: true, data } as ApiResponse<T>);
}

function sendError(res: Response, error: string, status = 400): void {
  res.status(status).json({ success: false, error } as ApiResponse);
}

// GET /api/status - Get agent status
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const status = agent.getStatus();
    let walletInfo: { address: string; balance: string } | null = null;

    try {
      walletInfo = await agent.getWalletInfo();
    } catch {
      // Wallet may not be initialized
    }

    const response: AgentStatus = {
      ...status,
      walletAddress: walletInfo?.address,
      walletBalance: walletInfo?.balance,
    };

    sendSuccess(res, response);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// GET /api/config - Get current configuration
router.get('/config', (_req: Request, res: Response) => {
  try {
    const safeConfig = {
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      poidhContractAddress: config.poidhContractAddress,
      pollingInterval: config.pollingInterval,
      maxGasPriceGwei: config.maxGasPriceGwei,
      autoApproveGas: config.autoApproveGas,
      logLevel: config.logLevel,
      demoMode: config.demoMode,
      openaiVisionModel: config.openaiVisionModel,
    };
    sendSuccess(res, safeConfig);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// POST /api/config - Update configuration
router.post('/config', (req: Request, res: Response) => {
  try {
    const updates = req.body as Partial<Config>;

    // Only allow updating certain fields
    const allowedFields = [
      'pollingInterval',
      'maxGasPriceGwei',
      'autoApproveGas',
      'logLevel',
      'demoMode',
    ];

    const invalidFields = Object.keys(updates).filter(
      (k) => !allowedFields.includes(k)
    );

    if (invalidFields.length > 0) {
      return sendError(
        res,
        `Cannot update fields: ${invalidFields.join(', ')}. Allowed: ${allowedFields.join(', ')}`
      );
    }

    // Note: Config updates would need to be persisted to .env or a config file
    // For now, we just acknowledge the request
    log.info('Config update requested', { updates });

    sendSuccess(res, {
      message: 'Config update acknowledged. Restart required for some changes.',
      updates,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// GET /api/bounties - List all bounties
router.get('/bounties', (_req: Request, res: Response) => {
  try {
    const bounties = bountyManager.getAllBounties();
    const serialized = bounties.map((b) => ({
      id: b.config.id,
      name: b.config.name,
      description: b.config.description,
      status: b.status,
      onChainId: b.onChainId,
      rewardEth: b.config.rewardEth,
      selectionMode: b.config.selectionMode,
      deadline: b.config.deadline,
      deadlineFormatted: new Date(b.config.deadline * 1000).toISOString(),
      submissionCount: b.submissions.length,
      createdAt: b.createdAt,
      createTxHash: b.createTxHash,
      payoutTxHash: b.payoutTxHash,
      winner: b.winnerSelection?.winner?.submitter,
    }));
    sendSuccess(res, serialized);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// POST /api/bounties - Create a new bounty
router.post('/bounties', async (req: Request, res: Response) => {
  try {
    const bountyConfig = req.body as BountyConfig;

    // Validate required fields
    if (!bountyConfig.name || !bountyConfig.description || !bountyConfig.rewardEth) {
      return sendError(res, 'Missing required fields: name, description, rewardEth');
    }

    const bounty = await agent.createBounty(bountyConfig);

    sendSuccess(res, {
      id: bounty.config.id,
      onChainId: bounty.onChainId,
      txHash: bounty.createTxHash,
      status: bounty.status,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// GET /api/bounties/:id - Get bounty details
router.get('/bounties/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try by config ID first
    let bounty = bountyManager.getBounty(id);
    
    // Try by on-chain ID if not found
    if (!bounty) {
      bounty = bountyManager.getBountyByChainId(id);
    }

    if (!bounty) {
      return sendError(res, `Bounty not found: ${id}`, 404);
    }

    const response = {
      id: bounty.config.id,
      name: bounty.config.name,
      description: bounty.config.description,
      requirements: bounty.config.requirements,
      status: bounty.status,
      onChainId: bounty.onChainId,
      rewardEth: bounty.config.rewardEth,
      selectionMode: bounty.config.selectionMode,
      proofType: bounty.config.proofType,
      deadline: bounty.config.deadline,
      deadlineFormatted: new Date(bounty.config.deadline * 1000).toISOString(),
      isExpired: bountyManager.isExpired(bounty.config.id),
      tags: bounty.config.tags,
      validation: bounty.config.validation,
      submissions: bounty.submissions.map((s) => ({
        id: s.id,
        submitter: s.submitter,
        claimId: s.claimId,
        proofUri: s.proofUri,
        timestamp: s.timestamp,
        proofContent: s.proofContent,
        validationResult: s.validationResult,
        aiEvaluation: s.aiEvaluation,
      })),
      createdAt: bounty.createdAt,
      updatedAt: bounty.updatedAt,
      createTxHash: bounty.createTxHash,
      payoutTxHash: bounty.payoutTxHash,
      winnerSelection: bounty.winnerSelection
        ? {
            winner: bounty.winnerSelection.winner.submitter,
            method: bounty.winnerSelection.method,
            rationale: bounty.winnerSelection.rationale,
            selectedAt: bounty.winnerSelection.selectedAt,
            autonomous: bounty.winnerSelection.autonomous,
          }
        : null,
    };

    sendSuccess(res, response);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// POST /api/agent/start - Start the agent
router.post('/agent/start', async (req: Request, res: Response) => {
  try {
    const status = agent.getStatus();
    
    if (status.isRunning) {
      return sendSuccess(res, { message: 'Agent is already running' });
    }

    // Initialize if needed
    try {
      await agent.initialize();
    } catch {
      // May already be initialized
    }

    agent.start();
    
    sendSuccess(res, { message: 'Agent started successfully' });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// POST /api/agent/stop - Stop the agent
router.post('/agent/stop', (_req: Request, res: Response) => {
  try {
    const status = agent.getStatus();
    
    if (!status.isRunning) {
      return sendSuccess(res, { message: 'Agent is not running' });
    }

    agent.stop();
    
    sendSuccess(res, { message: 'Agent stopped successfully' });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// GET /api/templates - Get available bounty templates
router.get('/templates', (_req: Request, res: Response) => {
  try {
    const defaultHours: Record<string, number> = {
      proveOutside: 6,
      handwrittenDate: 24,
      mealPhoto: 4,
      objectTower: 48,
      shadowArt: 72,
      animalPhoto: 48,
    };

    const templates: BountyTemplate[] = Object.entries(PRODUCTION_BOUNTIES).map(
      ([id, bounty]) => ({
        id,
        name: bounty.name,
        description: bounty.description,
        selectionMode: bounty.selectionMode,
        rewardEth: bounty.rewardEth,
        deadlineHours: defaultHours[id] || 24,
        tags: bounty.tags || [],
      })
    );

    sendSuccess(res, templates);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// POST /api/bounties/launch/:type - Launch a production bounty template
router.post('/bounties/launch/:type', async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const overrides = req.body as Partial<BountyConfig>;

    if (!(type in PRODUCTION_BOUNTIES)) {
      return sendError(
        res,
        `Unknown bounty type: ${type}. Available: ${Object.keys(PRODUCTION_BOUNTIES).join(', ')}`
      );
    }

    const bountyType = type as keyof typeof PRODUCTION_BOUNTIES;
    const bounty = await agent.launchProductionBounty(bountyType, overrides);

    sendSuccess(res, {
      id: bounty.config.id,
      onChainId: bounty.onChainId,
      txHash: bounty.createTxHash,
      status: bounty.status,
      name: bounty.config.name,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// GET /api/wallet - Get wallet info
router.get('/wallet', async (_req: Request, res: Response) => {
  try {
    const address = await walletManager.getAddress();
    const balance = await walletManager.getBalance();
    const networkInfo = await walletManager.getNetworkInfo();

    const response: WalletInfo = {
      address,
      balance: `${balance} ETH`,
      network: networkInfo.name || `Chain ${networkInfo.chainId}`,
    };

    sendSuccess(res, response);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

// GET /api/logs - Get recent logs (last 50 entries)
router.get('/logs', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const logFile = config.logFile || './logs/bot.log';
    const logPath = path.resolve(process.cwd(), logFile);

    if (!fs.existsSync(logPath)) {
      return sendSuccess(res, []);
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    const recentLines = lines.slice(-limit);

    const logs: LogEntry[] = recentLines.map((line) => {
      try {
        const parsed = JSON.parse(line);
        return {
          timestamp: parsed.timestamp || new Date().toISOString(),
          level: parsed.level || 'info',
          message: parsed.message || line,
          meta: parsed,
        };
      } catch {
        return {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line,
        };
      }
    });

    sendSuccess(res, logs);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

export default router;
