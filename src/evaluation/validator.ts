import {
  Submission,
  ValidationResult,
  ValidationCriteria,
  ProofType,
} from '../bounty/types';
import { log } from '../utils/logger';

/**
 * SubmissionValidator - Validates submissions against bounty criteria
 *
 * Performs deterministic validation checks:
 * - Location verification (if required)
 * - Time window verification (if required)
 * - Required keywords check
 * - Basic image validation
 * - EXIF freshness validation (for real-world proof)
 * - Screenshot detection
 */
export class SubmissionValidator {
  /**
   * Validate a submission against criteria
   */
  async validate(
    submission: Submission,
    criteria: ValidationCriteria
  ): Promise<ValidationResult> {
    const checks: ValidationResult['checks'] = [];
    let totalScore = 0;
    let maxScore = 0;

    // Check 1: Proof content exists
    maxScore += 20;
    if (submission.proofContent) {
      checks.push({
        name: 'Proof Content',
        passed: true,
        details: `Content type: ${submission.proofContent.type}`,
      });
      totalScore += 20;
    } else {
      checks.push({
        name: 'Proof Content',
        passed: false,
        details: 'No proof content could be retrieved',
      });
    }

    // Check 2: Media URL present (for photo/video bounties)
    if (submission.proofContent?.type === ProofType.PHOTO ||
        submission.proofContent?.type === ProofType.VIDEO) {
      maxScore += 20;
      if (submission.proofContent.mediaUrl) {
        checks.push({
          name: 'Media URL',
          passed: true,
          details: `Media found: ${submission.proofContent.mediaUrl.substring(0, 50)}...`,
        });
        totalScore += 20;
      } else {
        checks.push({
          name: 'Media URL',
          passed: false,
          details: 'No media URL found in submission',
        });
      }
    }

    // Check 3: Location verification (if required)
    if (criteria.location) {
      maxScore += 30;
      const locationCheck = this.checkLocation(submission, criteria.location);
      checks.push(locationCheck);
      if (locationCheck.passed) totalScore += 30;
    }

    // Check 4: Time window verification (if required)
    if (criteria.timeWindow) {
      maxScore += 20;
      const timeCheck = this.checkTimeWindow(submission, criteria.timeWindow);
      checks.push(timeCheck);
      if (timeCheck.passed) totalScore += 20;
    }

    // Check 5: Required keywords (if specified)
    if (criteria.requiredKeywords && criteria.requiredKeywords.length > 0) {
      maxScore += 10;
      const keywordCheck = this.checkKeywords(submission, criteria.requiredKeywords);
      checks.push(keywordCheck);
      if (keywordCheck.passed) totalScore += 10;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ENHANCED REAL-WORLD PROOF CHECKS
    // ═══════════════════════════════════════════════════════════════════════════

    // Check 6: EXIF data required (for real-world proof)
    if (criteria.requireExif) {
      maxScore += 15;
      const exifCheck = this.checkExifPresent(submission);
      checks.push(exifCheck);
      if (exifCheck.passed) totalScore += 15;
    }

    // Check 7: Photo freshness (max age in minutes)
    if (criteria.maxAgeMinutes !== undefined) {
      maxScore += 20;
      const freshnessCheck = this.checkPhotoFreshness(submission, criteria.maxAgeMinutes);
      checks.push(freshnessCheck);
      if (freshnessCheck.passed) totalScore += 20;
    }

    // Check 8: Screenshot detection
    if (criteria.rejectScreenshots) {
      maxScore += 15;
      const screenshotCheck = this.checkNotScreenshot(submission);
      checks.push(screenshotCheck);
      if (screenshotCheck.passed) totalScore += 15;
    }

    // Calculate normalized score
    const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    // Determine overall validity
    const criticalFailed = checks.some(
      (c) => !c.passed && (
        c.name === 'Proof Content' ||
        c.name === 'Media URL' ||
        c.name === 'EXIF Data' ||
        c.name === 'Photo Freshness' ||
        c.name === 'Screenshot Check'
      )
    );
    const isValid = !criticalFailed && score >= 50;

    const result: ValidationResult = {
      isValid,
      score,
      checks,
      summary: this.generateSummary(checks, score, isValid),
    };

    log.info('Validation completed', {
      submissionId: submission.id,
      score,
      isValid,
      checksRun: checks.length,
    });

    return result;
  }

  /**
   * Check if submission has valid EXIF data
   */
  private checkExifPresent(submission: Submission): ValidationResult['checks'][0] {
    const exif = submission.proofContent?.exif;

    if (!exif) {
      return {
        name: 'EXIF Data',
        passed: false,
        details: 'No EXIF metadata found - photo may not be original',
      };
    }

    const hasTimestamp = !!exif.timestamp;
    const hasDevice = !!exif.device;

    if (!hasTimestamp) {
      return {
        name: 'EXIF Data',
        passed: false,
        details: 'EXIF present but no timestamp - cannot verify when photo was taken',
      };
    }

    return {
      name: 'EXIF Data',
      passed: true,
      details: `EXIF verified: ${exif.timestamp?.toISOString()}${hasDevice ? ` (${exif.device})` : ''}`,
    };
  }

  /**
   * Check if photo was taken recently (within maxAgeMinutes)
   */
  private checkPhotoFreshness(
    submission: Submission,
    maxAgeMinutes: number
  ): ValidationResult['checks'][0] {
    const exif = submission.proofContent?.exif;

    if (!exif?.timestamp) {
      // Fall back to submission timestamp if no EXIF
      const submissionAge = (Date.now() - submission.timestamp) / 1000 / 60;
      const passed = submissionAge <= maxAgeMinutes;

      return {
        name: 'Photo Freshness',
        passed,
        details: passed
          ? `Submission received ${Math.round(submissionAge)} minutes ago (no EXIF timestamp)`
          : `Submission is ${Math.round(submissionAge)} minutes old - exceeds ${maxAgeMinutes} minute limit`,
      };
    }

    const photoAge = (Date.now() - exif.timestamp.getTime()) / 1000 / 60;
    const passed = photoAge <= maxAgeMinutes;

    return {
      name: 'Photo Freshness',
      passed,
      details: passed
        ? `Photo taken ${Math.round(photoAge)} minutes ago - within ${maxAgeMinutes} minute limit ✓`
        : `Photo is ${Math.round(photoAge)} minutes old - exceeds ${maxAgeMinutes} minute limit`,
    };
  }

  /**
   * Check if submission appears to be a screenshot (basic heuristics)
   */
  private checkNotScreenshot(submission: Submission): ValidationResult['checks'][0] {
    const exif = submission.proofContent?.exif;
    const metadata = submission.proofContent?.metadata;

    // Indicators of screenshots
    const screenshotIndicators: string[] = [];

    // Check device name for screenshot-like patterns
    if (exif?.device) {
      const device = exif.device.toLowerCase();
      if (device.includes('screenshot') ||
          device.includes('screen capture') ||
          device.includes('snipping')) {
        screenshotIndicators.push(`Device name indicates screenshot: ${exif.device}`);
      }
    }

    // Check for typical screenshot dimensions (exact screen sizes)
    if (metadata?.width && metadata?.height) {
      const commonScreenWidths = [1920, 2560, 1440, 1366, 1280, 828, 1170, 1284];
      const isExactScreenWidth = commonScreenWidths.includes(metadata.width);

      // Screenshots often have exact screen dimensions
      // Real photos usually have camera sensor dimensions (4:3, 16:9 but not exact screen sizes)
      if (isExactScreenWidth && metadata.height < metadata.width) {
        // Could be screenshot but not definitive
      }
    }

    // Check for missing camera-specific EXIF
    if (exif && !exif.device && !exif.latitude && !exif.longitude) {
      // No device info and no GPS might indicate screenshot
      // But this alone isn't conclusive
    }

    const passed = screenshotIndicators.length === 0;

    return {
      name: 'Screenshot Check',
      passed,
      details: passed
        ? 'Photo does not appear to be a screenshot'
        : `Possible screenshot detected: ${screenshotIndicators.join(', ')}`,
    };
  }

  /**
   * Check if submission location matches required location
   */
  private checkLocation(
    submission: Submission,
    required: NonNullable<ValidationCriteria['location']>
  ): ValidationResult['checks'][0] {
    const exif = submission.proofContent?.exif;

    if (!exif?.latitude || !exif?.longitude) {
      return {
        name: 'Location',
        passed: false,
        details: `Location required near ${required.description} but no GPS data found in submission`,
      };
    }

    // Calculate distance using Haversine formula
    const distance = this.calculateDistance(
      exif.latitude,
      exif.longitude,
      required.latitude,
      required.longitude
    );

    const passed = distance <= required.radiusMeters;

    return {
      name: 'Location',
      passed,
      details: passed
        ? `Within ${Math.round(distance)}m of ${required.description} (required: ${required.radiusMeters}m)`
        : `${Math.round(distance)}m from ${required.description} - too far (max: ${required.radiusMeters}m)`,
    };
  }

  /**
   * Calculate distance between two GPS coordinates (meters)
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Check if submission is within time window
   */
  private checkTimeWindow(
    submission: Submission,
    window: NonNullable<ValidationCriteria['timeWindow']>
  ): ValidationResult['checks'][0] {
    const timestamp = submission.proofContent?.exif?.timestamp;

    if (!timestamp) {
      // Fall back to submission timestamp
      const subTimestamp = submission.timestamp / 1000;
      const inWindow =
        subTimestamp >= window.startTimestamp &&
        subTimestamp <= window.endTimestamp;

      return {
        name: 'Time Window',
        passed: inWindow,
        details: inWindow
          ? 'Submission received within time window'
          : `Submission outside time window (${new Date(window.startTimestamp * 1000).toISOString()} - ${new Date(window.endTimestamp * 1000).toISOString()})`,
      };
    }

    const photoTimestamp = timestamp.getTime() / 1000;
    const inWindow =
      photoTimestamp >= window.startTimestamp &&
      photoTimestamp <= window.endTimestamp;

    return {
      name: 'Time Window',
      passed: inWindow,
      details: inWindow
        ? `Photo taken within time window: ${timestamp.toISOString()}`
        : `Photo taken at ${timestamp.toISOString()} - outside required window`,
    };
  }

  /**
   * Check for required keywords in submission
   */
  private checkKeywords(
    submission: Submission,
    keywords: string[]
  ): ValidationResult['checks'][0] {
    const content = [
      submission.proofContent?.description || '',
      JSON.stringify(submission.proofContent?.metadata || {}),
    ]
      .join(' ')
      .toLowerCase();

    const found = keywords.filter((kw) => content.includes(kw.toLowerCase()));
    const passed = found.length === keywords.length;

    return {
      name: 'Required Keywords',
      passed,
      details: passed
        ? `All required keywords found: ${keywords.join(', ')}`
        : `Missing keywords: ${keywords.filter((kw) => !content.includes(kw.toLowerCase())).join(', ')}`,
    };
  }

  /**
   * Generate human-readable summary
   */
  private generateSummary(
    checks: ValidationResult['checks'],
    score: number,
    isValid: boolean
  ): string {
    const passed = checks.filter((c) => c.passed).length;
    const total = checks.length;

    if (isValid) {
      return `✅ VALID: Passed ${passed}/${total} checks (score: ${score}/100)`;
    } else {
      const failed = checks.filter((c) => !c.passed).map((c) => c.name);
      return `❌ INVALID: Failed checks: ${failed.join(', ')} (score: ${score}/100)`;
    }
  }
}

export const submissionValidator = new SubmissionValidator();

