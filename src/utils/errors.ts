/**
 * Custom Error Classes and Error Handling Utilities
 *
 * Provides structured error handling for the autonomous bounty bot.
 */

import { log } from './logger';

/**
 * Base error class for all bounty bot errors
 */
export class BountyBotError extends Error {
  public readonly code: string;
  public readonly recoverable: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    recoverable: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'BountyBotError';
    this.code = code;
    this.recoverable = recoverable;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Wallet-related errors
 */
export class WalletError extends BountyBotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'WALLET_ERROR', true, context);
    this.name = 'WalletError';
  }
}

export class InsufficientBalanceError extends WalletError {
  public readonly required: string;
  public readonly available: string;

  constructor(required: string, available: string) {
    super(`Insufficient balance: need ${required} ETH, have ${available} ETH`, {
      required,
      available,
    });
    this.name = 'InsufficientBalanceError';
    this.required = required;
    this.available = available;
  }
}

/**
 * Contract interaction errors
 */
export class ContractError extends BountyBotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'CONTRACT_ERROR', true, context);
    this.name = 'ContractError';
  }
}

export class TransactionError extends ContractError {
  public readonly txHash?: string;

  constructor(message: string, txHash?: string, context?: Record<string, any>) {
    super(message, { txHash, ...context });
    this.name = 'TransactionError';
    this.txHash = txHash;
  }
}

export class GasPriceError extends ContractError {
  constructor(currentGwei: number, maxGwei: number) {
    super(`Gas price too high: ${currentGwei} gwei (max: ${maxGwei} gwei)`, {
      currentGwei,
      maxGwei,
    });
    this.name = 'GasPriceError';
  }
}

/**
 * Bounty-related errors
 */
export class BountyError extends BountyBotError {
  public readonly bountyId?: string;

  constructor(message: string, bountyId?: string, context?: Record<string, any>) {
    super(message, 'BOUNTY_ERROR', true, { bountyId, ...context });
    this.name = 'BountyError';
    this.bountyId = bountyId;
  }
}

export class BountyNotFoundError extends BountyError {
  constructor(bountyId: string) {
    super(`Bounty not found: ${bountyId}`, bountyId);
    this.name = 'BountyNotFoundError';
  }
}

export class BountyExpiredError extends BountyError {
  constructor(bountyId: string, deadline: Date) {
    super(`Bounty ${bountyId} expired at ${deadline.toISOString()}`, bountyId, {
      deadline,
    });
    this.name = 'BountyExpiredError';
  }
}

/**
 * Validation errors
 */
export class ValidationError extends BountyBotError {
  public readonly submissionId?: string;

  constructor(message: string, submissionId?: string, context?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', true, { submissionId, ...context });
    this.name = 'ValidationError';
    this.submissionId = submissionId;
  }
}

/**
 * AI/OpenAI errors
 */
export class AIError extends BountyBotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'AI_ERROR', true, context);
    this.name = 'AIError';
  }
}

export class AIRateLimitError extends AIError {
  public readonly retryAfter?: number;

  constructor(retryAfter?: number) {
    super(`AI rate limit exceeded. Retry after ${retryAfter || 'unknown'} seconds`, {
      retryAfter,
    });
    this.name = 'AIRateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class AIResponseError extends AIError {
  constructor(message: string, response?: string) {
    super(message, { response: response?.substring(0, 500) });
    this.name = 'AIResponseError';
  }
}

/**
 * Network/RPC errors
 */
export class NetworkError extends BountyBotError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', true, context);
    this.name = 'NetworkError';
  }
}

export class RPCError extends NetworkError {
  public readonly rpcUrl?: string;

  constructor(message: string, rpcUrl?: string) {
    super(message, { rpcUrl });
    this.name = 'RPCError';
    this.rpcUrl = rpcUrl;
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends BountyBotError {
  constructor(message: string, missingKeys?: string[]) {
    super(message, 'CONFIG_ERROR', false, { missingKeys });
    this.name = 'ConfigurationError';
  }
}

/**
 * Retry utility with exponential backoff
 */
export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  retryOn?: (error: Error) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  exponentialBase: 2,
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (opts.retryOn && !opts.retryOn(lastError)) {
        throw lastError;
      }

      // Don't retry non-recoverable errors
      if (error instanceof BountyBotError && !error.recoverable) {
        throw error;
      }

      if (attempt < opts.maxRetries) {
        const delay = Math.min(
          opts.baseDelayMs * Math.pow(opts.exponentialBase, attempt),
          opts.maxDelayMs
        );

        log.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          attempt: attempt + 1,
          maxRetries: opts.maxRetries,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wrap async function with error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      log.error(`Error in ${context}`, {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      throw error;
    }
  }) as T;
}

/**
 * Safe execution - catches errors and returns result or error
 */
export type SafeResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

export async function safeExecute<T>(fn: () => Promise<T>): Promise<SafeResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}

/**
 * Error serialization for logging/storage
 */
export function serializeError(error: Error): Record<string, any> {
  const serialized: Record<string, any> = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  if (error instanceof BountyBotError) {
    serialized.code = error.code;
    serialized.recoverable = error.recoverable;
    serialized.context = error.context;
  }

  return serialized;
}
