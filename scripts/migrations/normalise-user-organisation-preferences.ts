/**
 * ArtsFlow OS v1.1 — Migration Script: Normalise User Organisation Preferences
 * 
 * Inspects all user organisation memberships, repairs conflicting duplicate
 * default organisations deterministically, and bootstraps user preferences
 * with their initial lastActiveOrganisationId.
 * 
 * Usage:
 *   npx ts-node scripts/migrations/normalise-user-organisation-preferences.ts [--dry-run]
 */

import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import type { OrganisationMembership, UserPreferences } from '../../src/types';

export interface PreferencesMigrationSummary {
  scannedUsers: number;
  duplicateDefaultsRepaired: number;
  defaultsBootstrapped: number;
  preferencesBootstrapped: number;
  conflictsReported: Array<{ userId: string; conflictingOrgs: string[]; chosenDefault: string }>;
  dryRun: boolean;
}

export async function normaliseUserOrganisationPreferences(isDryRun: boolean = false): Promise<PreferencesMigrationSummary> {
  const summary: PreferencesMigrationSummary = {
    scannedUsers: 0,
    duplicateDefaultsRepaired: 0,
    defaultsBootstrapped: 0,
    preferencesBootstrapped: 0,
    conflictsReported: [],
    dryRun: isDryRun
  };

  const membershipsSnap = await getDocs(collection(db, 'organisationMemberships'));
  const userMembershipsMap = new Map<string, OrganisationMembership[]>();

  for (const docSnap of membershipsSnap.docs) {
    const mem = docSnap.data() as OrganisationMembership;
    if (!mem.userId) continue;
    const list = userMembershipsMap.get(mem.userId) || [];
    list.push(mem);
    userMembershipsMap.set(mem.userId, list);
  }

  summary.scannedUsers = userMembershipsMap.size;

  for (const [userId, memberships] of userMembershipsMap.entries()) {
    const active = memberships.filter((m) => m.membershipStatus === 'active');
    if (active.length === 0) continue;

    const defaults = active.filter((m) => m.isDefaultOrganisation);
    let chosenDefaultOrgId: string | null = null;

    if (defaults.length > 1) {
      // Conflict: Multiple defaults!
      // Resolve deterministically: pick the one with most recent lastActiveAt or joinedAt
      const sorted = [...defaults].sort((a, b) => {
        const timeA = new Date(a.lastActiveAt || a.joinedAt || 0).getTime();
        const timeB = new Date(b.lastActiveAt || b.joinedAt || 0).getTime();
        return timeB - timeA;
      });

      const primary = sorted[0];
      chosenDefaultOrgId = primary.organisationId;

      summary.conflictsReported.push({
        userId,
        conflictingOrgs: defaults.map((d) => d.organisationId),
        chosenDefault: chosenDefaultOrgId
      });

      if (!isDryRun) {
        // Demote other defaults
        for (const extra of sorted.slice(1)) {
          const memRef = doc(db, 'organisationMemberships', extra.id);
          await setDoc(memRef, { isDefaultOrganisation: false, updatedAt: new Date().toISOString() }, { merge: true });
        }
      }
      summary.duplicateDefaultsRepaired++;
    } else if (defaults.length === 1) {
      chosenDefaultOrgId = defaults[0].organisationId;
    } else if (active.length > 0) {
      // No default set: bootstrap first active as default
      const primary = active[0];
      chosenDefaultOrgId = primary.organisationId;
      if (!isDryRun) {
        const memRef = doc(db, 'organisationMemberships', primary.id);
        await setDoc(memRef, { isDefaultOrganisation: true, updatedAt: new Date().toISOString() }, { merge: true });
      }
      summary.defaultsBootstrapped++;
    }

    // Bootstrap userPreferences if not set
    if (chosenDefaultOrgId && !isDryRun) {
      const prefRef = doc(db, 'userPreferences', userId);
      const prefData: UserPreferences = {
        id: userId,
        userId,
        lastActiveOrganisationId: chosenDefaultOrgId,
        updatedAt: new Date().toISOString()
      };
      await setDoc(prefRef, prefData, { merge: true });
      summary.preferencesBootstrapped++;
    }
  }

  return summary;
}
