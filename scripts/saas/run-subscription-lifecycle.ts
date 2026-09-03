/**
 * ArtsFlow OS — Daily Subscription Lifecycle CLI Runner
 *
 * Autonomous cron execution script to evaluate subscription lifecycles:
 * 1. Expire overdue trialing subscriptions and restrict tenant access.
 * 2. Evaluate past-due grace period expiries and restrict non-compliant tenants.
 * 3. Process cancelAtPeriodEnd transitions for active subscriptions whose term concluded.
 *
 * Usage:
 *   npx tsx scripts/saas/run-subscription-lifecycle.ts [--dry-run | --live]
 */

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { subscriptionLifecycleRunner, type LifecycleRunResult } from '../../src/services/billing/subscriptionLifecycleRunner';

export async function executeLifecycleCheck(options: { dryRun?: boolean } = {}): Promise<LifecycleRunResult> {
  const isDryRun = !!options.dryRun;
  const modeLabel = isDryRun ? 'DRY-RUN (no database mutations)' : 'LIVE EXECUTION';

  console.log('========================================================');
  console.log(' ARTSFLOW OS — SUBSCRIPTION LIFECYCLE RUNNER');
  console.log(` Mode:        ${modeLabel}`);
  console.log(` Timestamp:   ${new Date().toISOString()}`);
  console.log('========================================================\n');

  // Authenticate if credentials are provided in environment
  const authEmail = process.env.CRON_AUTH_EMAIL || process.env.FOUNDER_EMAIL;
  const authPassword = process.env.CRON_AUTH_PASSWORD || process.env.FOUNDER_PASSWORD;

  if (authEmail && authPassword) {
    console.log(`[LifecycleRunner] Authenticating as ${authEmail}...`);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      console.log('[LifecycleRunner] Authentication successful.');
    } catch (authErr) {
      console.warn('[LifecycleRunner] Warning: Authentication failed, proceeding with current session:', authErr);
    }
  } else if (!auth.currentUser) {
    console.log('[LifecycleRunner] Note: Running without explicit auth credentials.');
  }

  try {
    const result = await subscriptionLifecycleRunner.runDailyLifecycleCheck({ dryRun: isDryRun });

    console.log('[LifecycleRunner] Execution Results:');
    console.log(`  - Expired Trials:            ${result.expiredTrials}`);
    console.log(`  - Past-Due Grace Restricted: ${result.pastDueRestricted}`);
    console.log(`  - Period-End Cancelled:      ${result.periodEndCancelled}`);
    console.log(`  - Processed At:              ${result.processedAt}`);
    console.log(`  - Dry Run:                   ${result.dryRun ? 'YES' : 'NO'}`);
    console.log('\n========================================================');
    console.log(' Status: SUCCESS');
    console.log('========================================================');

    return result;
  } catch (error) {
    console.error('[LifecycleRunner] Fatal execution error:', error);
    throw error;
  }
}

// Direct execution CLI harness
const isDirectRun = process.argv[1]?.endsWith('run-subscription-lifecycle.ts');

if (isDirectRun) {
  const isDryRun = process.argv.includes('--dry-run') || (!process.argv.includes('--live') && process.env.NODE_ENV !== 'production');
  
  executeLifecycleCheck({ dryRun: isDryRun })
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('[LifecycleRunner] Script terminated with error:', err);
      process.exit(1);
    });
}
