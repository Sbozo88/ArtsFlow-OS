import type { AuthRole, OrganisationMembership } from '../../src/types';

export interface MigrationUserRecord {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: AuthRole;
  organisationId?: string | null;
  status?: string;
  createdAt?: string;
}

export interface MembershipMigrationConflict {
  userId: string;
  email: string;
  organisationId: string;
  userRole: string;
  membershipRole: string;
}

export interface MembershipMigrationSkipped {
  userId: string;
  reason: string;
}

export interface MembershipMigrationFailure {
  userId: string;
  error: string;
}

export interface MigrationReport {
  usersScanned: number;
  membershipsToCreate: number;
  membershipsCreated: number;
  alreadyMigrated: number;
  conflicts: MembershipMigrationConflict[];
  skipped: MembershipMigrationSkipped[];
  failures: MembershipMigrationFailure[];
}

export interface RunMigrationOptions {
  users: MigrationUserRecord[];
  existingMemberships: OrganisationMembership[];
  isDryRun: boolean;
  saveMembership?: (membership: OrganisationMembership) => Promise<void>;
  logger?: (message: string) => void;
}

/**
 * Idempotent migration script that extracts organisation memberships from legacy user documents.
 * Never mutates original user documents.
 * Detects conflicts between user role and existing membership role without destructive overwrites.
 */
export async function migrateUsersToMemberships(options: RunMigrationOptions): Promise<MigrationReport> {
  const { users, existingMemberships, isDryRun, saveMembership, logger = console.log } = options;

  const report: MigrationReport = {
    usersScanned: users.length,
    membershipsToCreate: 0,
    membershipsCreated: 0,
    alreadyMigrated: 0,
    conflicts: [],
    skipped: [],
    failures: []
  };

  logger(`[MIGRATION] Starting user to membership migration (dryRun: ${isDryRun}). Total users: ${users.length}`);

  // Build lookup index for existing memberships: `${userId}:${organisationId}`
  const membershipIndex = new Map<string, OrganisationMembership>();
  for (const m of existingMemberships) {
    membershipIndex.set(`${m.userId}:${m.organisationId}`, m);
  }

  for (const user of users) {
    if (!user.organisationId || !user.role) {
      report.skipped.push({
        userId: user.uid,
        reason: 'Missing organisationId or role'
      });
      continue;
    }

    const key = `${user.uid}:${user.organisationId}`;
    const existing = membershipIndex.get(key);

    if (existing) {
      if (existing.role !== user.role) {
        report.conflicts.push({
          userId: user.uid,
          email: user.email || '',
          organisationId: user.organisationId,
          userRole: user.role,
          membershipRole: existing.role
        });
      } else {
        report.alreadyMigrated++;
      }
      continue;
    }

    report.membershipsToCreate++;

    const now = new Date().toISOString();
    const newMembership: OrganisationMembership = {
      id: `mem_${user.uid}_${user.organisationId}`,
      organisationId: user.organisationId,
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || undefined,
      role: user.role,
      membershipStatus: user.status === 'disabled' ? 'disabled' : 'active',
      isDefaultOrganisation: true,
      joinedAt: user.createdAt || now,
      createdAt: now,
      updatedAt: now,
      createdBy: 'system_migration',
      updatedBy: 'system_migration',
      status: 'active'
    };

    if (!isDryRun && saveMembership) {
      try {
        await saveMembership(newMembership);
        report.membershipsCreated++;
        membershipIndex.set(key, newMembership);
      } catch (err) {
        report.failures.push({
          userId: user.uid,
          error: (err as Error).message
        });
      }
    }
  }

  logger(`[MIGRATION REPORT]
Users scanned: ${report.usersScanned}
Memberships to create: ${report.membershipsToCreate}
Memberships created: ${report.membershipsCreated}
Already migrated: ${report.alreadyMigrated}
Conflicts detected: ${report.conflicts.length}
Skipped: ${report.skipped.length}
Failures: ${report.failures.length}`);

  return report;
}
