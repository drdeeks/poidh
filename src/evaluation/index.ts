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

    return {
      isValid: validationResult.isValid,
      submission,
      rationale: validationResult.isValid
        ? 'First valid submission'
        : `Validation failed: ${validationResult.summary}`,
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

    const ranked = await aiJudge.evaluateAndRank(submissions, bounty.config);
    const validRanked = ranked.filter((r) => r.evaluation.isValid);

    if (validRanked.length === 0) {
      log.warn('No valid submissions found', { bountyId: bounty.config.id });
      return null;
    }

    const winner = validRanked[0];
    const runnerUps = validRanked.slice(1).map((r) => r.submission);

    const selection: WinnerSelection = {
      winner: winner.submission,
      runnerUps,
      method: SelectionMode.AI_JUDGED,
      rationale: `Winner selected by AI. Score: ${winner.evaluation.score}/100`,
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
