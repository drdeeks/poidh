import {
  Submission,
  WinnerSelection,
  SelectionMode,
  BountyConfig,
  ActiveBounty,
} from '../bounty/types';
import { submissionValidator } from './validator';
import { aiJudge } from './ai-judge';
import { log } from '../utils/logger';
import { auditTrail } from '../utils/audit-trail';

export class EvaluationEngine {
  async evaluateForFirstValid(
    submission: Submission,
    bountyConfig: BountyConfig
  ): Promise<{ isValid: boolean; submission: Submission; rationale: string }> {
    log.info('Evaluating submission (first-valid mode)', {
      submissionId: submission.id,
      bountyId: bountyConfig.id,
    });

    const validationResult = await submissionValidator.validate(
      submission,
      bountyConfig.validation
    );
    submission.validationResult = validationResult;

    if (validationResult.isValid && bountyConfig.validation.aiValidationPrompt) {
      const aiEval = await aiJudge.evaluate(submission, bountyConfig);
      submission.aiEvaluation = aiEval;

      if (!aiEval.isValid) {
        return {
          isValid: false,
          submission,
          rationale: `AI check failed: ${aiEval.reasoning}`,
        };
      }

      return {
        isValid: true,
        submission,
        rationale: `First valid submission. Score: ${aiEval.score}`,
      };
    }

    // Build detailed rationale with scoring breakdown
    const checksBreakdown = validationResult.checks
      .map(c => `${c.passed ? '✓' : '✗'} ${c.name}: ${c.details}`)
      .join('\n  ');

    const detailedRationale = validationResult.isValid
      ? `First valid submission (Score: ${validationResult.score}/100)\n` +
        `Validation Checks:\n  ${checksBreakdown}`
      : `Validation failed (Score: ${validationResult.score}/100)\n` +
        `${validationResult.summary}\n` +
        `Validation Checks:\n  ${checksBreakdown}`;

    return {
      isValid: validationResult.isValid,
      submission,
      rationale: detailedRationale,
    };
  }

  async selectWinnerAIJudged(
    bounty: ActiveBounty
  ): Promise<WinnerSelection | null> {
    const submissions = bounty.submissions;

    if (submissions.length === 0) {
      log.warn('No submissions to evaluate', { bountyId: bounty.config.id });
      return null;
    }

    log.info('Running AI-judged selection', {
      bountyId: bounty.config.id,
      submissionCount: submissions.length,
    });

    auditTrail.log('AI_EVALUATION_STARTED', {
      bountyId: bounty.config.id,
      bountyName: bounty.config.name,
      submissionCount: submissions.length,
      model: aiJudge['model'],
      selectionMode: SelectionMode.AI_JUDGED,
      aiValidationPrompt: bounty.config.validation.aiValidationPrompt || 'Default evaluation prompt',
    });

    const ranked = await aiJudge.evaluateAndRank(submissions, bounty.config);
    const validRanked = ranked.filter((r) => r.evaluation.isValid);

    for (const entry of ranked) {
      auditTrail.log('SCORING_BREAKDOWN', {
        bountyId: bounty.config.id,
        phase: 'AI Judged Evaluation',
        submitter: entry.submission.submitter,
        claimId: entry.submission.claimId,
        finalScore: entry.evaluation.score,
        isValid: entry.evaluation.isValid,
        confidence: entry.evaluation.confidence,
        componentScores: {
          'AI Score': entry.evaluation.score + '/100',
          'Confidence': ((entry.evaluation.confidence * 100).toFixed(0)) + '%',
          'Valid': entry.evaluation.isValid ? 'Yes' : 'No',
        },
        formula: 'GPT-4 Vision evaluation with structured scoring prompt',
        reasoning: entry.evaluation.reasoning?.substring(0, 300),
      });
    }

    auditTrail.log('AI_EVALUATION_COMPLETED', {
      bountyId: bounty.config.id,
      bountyName: bounty.config.name,
      model: aiJudge['model'],
      totalEvaluated: ranked.length,
      validCount: validRanked.length,
      invalidCount: ranked.length - validRanked.length,
      topScore: ranked[0]?.evaluation.score,
      topSubmitter: ranked[0]?.submission.submitter,
      scores: ranked.map(r => ({
        submitter: r.submission.submitter,
        score: r.evaluation.score,
        isValid: r.evaluation.isValid,
        confidence: r.evaluation.confidence,
      })),
    });

    if (validRanked.length === 0) {
      log.warn('No valid submissions found', { bountyId: bounty.config.id });
      return null;
    }

    const winner = validRanked[0];
    const runnerUps = validRanked.slice(1).map((r) => r.submission);

    // Build detailed rationale with AI scoring breakdown
    const aiRationale = 
      `Winner selected by AI (Score: ${winner.evaluation.score}/100, Confidence: ${(winner.evaluation.confidence * 100).toFixed(0)}%)\n` +
      `Model: ${winner.evaluation.model}\n` +
      `AI Reasoning: ${winner.evaluation.reasoning}\n` +
      `Validation Score: ${winner.submission.validationResult?.score || 'N/A'}/100\n` +
      `Competitors: ${runnerUps.length} other valid submission(s)` +
      (runnerUps.length > 0 
        ? `\nRunner-up scores: ${runnerUps.slice(0, 3).map(s => s.aiEvaluation?.score || 'N/A').join(', ')}`
        : '');

    const selection: WinnerSelection = {
      winner: winner.submission,
      runnerUps,
      method: SelectionMode.AI_JUDGED,
      rationale: aiRationale,
      selectedAt: Date.now(),
      autonomous: true,
    };

    log.winner(bounty.config.id, winner.submission.submitter, selection.rationale);

    return selection;
  }
}

export const evaluationEngine = new EvaluationEngine();
export { submissionValidator } from './validator';
export { aiJudge } from './ai-judge';
