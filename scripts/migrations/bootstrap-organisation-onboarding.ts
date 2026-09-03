/**
 * ArtsFlow OS v1.1 — Migration Script: Bootstrap Organisation Onboarding
 * 
 * Safely marks all existing operational v1.0 and SaaS 1A/2A/2B organisations as
 * onboardingStatus = 'completed' so they remain operational and are never forced
 * through onboarding.
 * 
 * Usage:
 *   npx ts-node scripts/migrations/bootstrap-organisation-onboarding.ts [--dry-run]
 */

import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import type { Organisation, OrganisationOnboarding } from '../../src/types';

interface MigrationSummary {
  scanned: number;
  migrated: number;
  skipped: number;
  dryRun: boolean;
}

export async function bootstrapOrganisationOnboarding(isDryRun: boolean = false): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    scanned: 0,
    migrated: 0,
    skipped: 0,
    dryRun: isDryRun
  };

  const orgsSnap = await getDocs(collection(db, 'organisations'));
  summary.scanned = orgsSnap.size;

  for (const orgDoc of orgsSnap.docs) {
    const org = orgDoc.data() as Organisation;

    // Skip organisations that are still in provisioning state
    if (org.tenantStatus === 'provisioning') {
      summary.skipped++;
      continue;
    }

    const onboardingId = `onboarding_${org.id}`;
    const now = new Date().toISOString();

    const completedOnboarding: OrganisationOnboarding = {
      id: onboardingId,
      organisationId: org.id,
      onboardingStatus: 'completed',
      currentStep: 'go_live',
      completedSteps: [
        'welcome',
        'organisation_profile',
        'branding',
        'programme_types',
        'calendar',
        'attendance',
        'finance',
        'staff',
        'programmes_groups',
        'learner_import',
        'guardian_setup',
        'review',
        'go_live'
      ],
      skippedSteps: [],
      startedAt: org.createdAt || now,
      lastProgressAt: now,
      completedAt: org.createdAt || now,
      createdAt: now,
      updatedAt: now,
      createdBy: 'migration_bootstrap',
      updatedBy: 'migration_bootstrap',
      status: 'active'
    };

    if (!isDryRun) {
      await setDoc(doc(db, 'organisationOnboarding', onboardingId), completedOnboarding, { merge: true });
    }

    summary.migrated++;
  }

  return summary;
}
