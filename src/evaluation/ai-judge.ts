import OpenAI from 'openai';
import { Submission, AIEvaluation, BountyConfig } from '../bounty/types';
import { config } from '../config';
import { log } from '../utils/logger';
import axios from 'axios';
import { withRetry } from '../utils/errors';
import { CircuitBreaker, RateLimiter } from '../utils/fallback';

/**
 * AIJudge - GPT-4 Vision powered submission evaluator
 *
 * Uses GPT-4o (with vision capabilities) to:
 * - Analyze images/videos for compliance
 * - Score submissions on creativity, execution, etc.
 * - Detect AI-generated or manipulated content
 * - Provide detailed reasoning for judgments
 */
export class AIJudge {
  private openai: OpenAI;
  private model: string;
  private circuitBreaker: CircuitBreaker;
  private rateLimiter: RateLimiter;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openaiApiKey,
    });
    this.model = config.openaiVisionModel || 'gpt-4o';
    this.circuitBreaker = new CircuitBreaker(5, 60000); // 5 failures, 1 minute reset
    this.rateLimiter = new RateLimiter(10, 1); // 10 tokens, 1 token/sec refill
  }

  /**
   * Evaluate a single submission
   */
  async evaluate(
    submission: Submission,
    bountyConfig: BountyConfig
  ): Promise<AIEvaluation> {
    log.info('🤖 AI evaluation starting', {
      submissionId: submission.id,
      model: this.model,
    });

    const imageUrl = await this.getImageUrl(submission);

    if (!imageUrl) {
      return this.createInvalidEvaluation(
        'No image could be retrieved from submission',
        submission.id
      );
    }

    const prompt = this.buildPrompt(bountyConfig);

    try {
      return await withRetry(async () => {
        await this.rateLimiter.acquire();
        const response = await this.circuitBreaker.execute(() => 
          this.openai.chat.completions.create({
            model: this.model,
            messages: [
              {
                role: 'system',
                content: `You are an autonomous bounty judge evaluating real-world proof submissions.
You must be fair, objective, and thorough in your evaluation.
Your judgments will automatically trigger payouts, so accuracy is critical.

Key responsibilities:
1. Verify the image appears to be a real photograph (not AI-generated)
2. Check if the submission meets all stated requirements
3. Score the submission objectively
4. Provide clear reasoning that could be audited

IMPORTANT: If you detect signs of AI generation (unusual artifacts, impossible lighting,
anatomical errors, text inconsistencies), mark the submission as INVALID with score 0.`,
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: prompt,
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageUrl,
                      detail: 'high',
                    },
                  },
                ],
              },
            ],
            max_tokens: 1500,
            temperature: 0.3, // Lower temperature for more consistent judging
          })
        );

        const content = response.choices[0]?.message?.content || '';
        return this.parseResponse(content, submission.id);
      }, {
        maxRetries: 3,
        baseDelayMs: 2000,
        retryOn: (error: Error) => error.message.includes('rate limit') || error.message.includes('timed out'),
      });
    } catch (error) {
      log.error('AI evaluation failed after multiple retries', {
        submissionId: submission.id,
        error: (error as Error).message,
      });

      return this.createInvalidEvaluation(
        `AI evaluation error: ${(error as Error).message}`,
        submission.id
      );
    }
  }

  /**
   * Get image URL from submission
   */
  private async getImageUrl(submission: Submission): Promise<string | null> {
    // Direct media URL
    if (submission.proofContent?.mediaUrl) {
      let url = submission.proofContent.mediaUrl;

      // Convert IPFS to HTTP
      if (url.startsWith('ipfs://')) {
        url = `https://ipfs.io/ipfs/${url.slice(7)}`;
      }

      return url;
    }

    // Try to extract from proof URI
    if (submission.proofUri) {
      let uri = submission.proofUri;

      if (uri.startsWith('ipfs://')) {
        uri = `https://ipfs.io/ipfs/${uri.slice(7)}`;
      }

      try {
        const response = await axios.get(uri, { timeout: 10000 });
        const data = response.data;

        if (typeof data === 'object') {
          return data.image || data.imageUrl || data.mediaUrl || null;
        }

        // Maybe it's a direct image URL
        if (typeof data === 'string' && data.startsWith('http')) {
          return data;
        }
      } catch {
        // URI might be the image itself
        return uri;
      }
    }

    return null;
  }

  /**
   * Build evaluation prompt from bounty config
   */
  private buildPrompt(bountyConfig: BountyConfig): string {
    const customPrompt = bountyConfig.validation.aiValidationPrompt;

    return `
# Bounty Evaluation Request

## Bounty Details
- **Name**: ${bountyConfig.name}
- **Description**: ${bountyConfig.description}
- **Requirements**: ${bountyConfig.requirements}

## Your Task
${customPrompt || 'Evaluate if this submission meets the bounty requirements.'}

## Required Response Format
Please respond with a JSON object in this EXACT format:
\`\`\`json
{
  "score": <number 0-100>,
  "isValid": <true/false>,
  "confidence": <number 0-1>,
  "reasoning": "<detailed explanation of your judgment>",
  "criteria_scores": {
    "<criterion1>": <score>,
    "<criterion2>": <score>
  },
  "ai_detection": {
    "appears_authentic": <true/false>,
    "concerns": "<any concerns about authenticity>"
  }
}
\`\`\`

Be thorough but concise in your reasoning. Your judgment will be used to automatically
determine the bounty winner and trigger payment.
`.trim();
  }

  /**
   * Parse AI response into structured evaluation
   */
  private parseResponse(content: string, submissionId: string): AIEvaluation {
    try {
      // Extract JSON from response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;

      // Try to parse as JSON
      let parsed: any;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        // Try to extract key fields with regex if JSON parsing fails
        const scoreMatch = content.match(/"score":\s*(\d+)/);
        const validMatch = content.match(/"isValid":\s*(true|false)/);
        const confidenceMatch = content.match(/"confidence":\s*([\d.]+)/);

        parsed = {
          score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
          isValid: validMatch ? validMatch[1] === 'true' : false,
          confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
          reasoning: content,
        };
      }

      const evaluation: AIEvaluation = {
        score: Math.min(100, Math.max(0, parsed.score || 0)),
        isValid: Boolean(parsed.isValid),
        confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
        reasoning: parsed.reasoning || content,
        model: this.model,
        evaluatedAt: Date.now(),
      };

      log.info('🤖 AI evaluation completed', {
        submissionId,
        score: evaluation.score,
        isValid: evaluation.isValid,
        confidence: evaluation.confidence,
      });

      return evaluation;
    } catch (error) {
      log.error('Failed to parse AI response', {
        submissionId,
        error: (error as Error).message,
        content: content.substring(0, 500),
      });

      return this.createInvalidEvaluation(
        `Failed to parse AI response: ${content.substring(0, 200)}`,
        submissionId
      );
    }
  }

  /**
   * Create an invalid evaluation result
   */
  private createInvalidEvaluation(reason: string, submissionId: string): AIEvaluation {
    log.warn('Creating invalid evaluation', { submissionId, reason });

    return {
      score: 0,
      isValid: false,
      confidence: 1.0,
      reasoning: reason,
      model: this.model,
      evaluatedAt: Date.now(),
    };
  }

  /**
   * Evaluate multiple submissions and rank them
   */
  async evaluateAndRank(
    submissions: Submission[],
    bountyConfig: BountyConfig
  ): Promise<{ submission: Submission; evaluation: AIEvaluation }[]> {
    log.info('🤖 Evaluating all submissions', {
      count: submissions.length,
      bountyId: bountyConfig.id,
    });

    const evaluations: { submission: Submission; evaluation: AIEvaluation }[] = [];

    // Evaluate each submission
    for (const submission of submissions) {
      const evaluation = await this.evaluate(submission, bountyConfig);
      submission.aiEvaluation = evaluation;
      evaluations.push({ submission, evaluation });

      // Small delay between API calls to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Sort by score (highest first)
    evaluations.sort((a, b) => b.evaluation.score - a.evaluation.score);

    log.info('🏆 Submissions ranked', {
      topScore: evaluations[0]?.evaluation.score,
      validCount: evaluations.filter((e) => e.evaluation.isValid).length,
    });

    return evaluations;
  }
}

export const aiJudge = new AIJudge();
