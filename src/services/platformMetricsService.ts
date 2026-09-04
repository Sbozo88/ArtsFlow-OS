import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Organisation, OrganisationMembership, TenantStatus } from '../types';

export interface PlatformKPIs {
  totalOrganisations: number;
  customerOrganisations: number;
  demoOrganisations: number;
  activeOrganisations: number;
  trialOrganisations: number;
  restrictedOrganisations: number;
  suspendedOrganisations: number;
  cancelledOrganisations: number;
  archivedOrganisations: number;
  provisioningOrganisations: number;
  totalPlatformUsers: number;
  activeMemberships: number;
  newOrganisationsThisMonth: number;
  recentOrganisations: Organisation[];
}

export const platformMetricsService = {
  /**
   * Computes platform-wide aggregated metrics in a privacy-preserving manner.
   * Does NOT query or load individual learner profiles, private messages, or school invoices.
   */
  async getPlatformKPIs(): Promise<PlatformKPIs> {
    const orgsSnap = await getDocs(collection(db, 'organisations'));
    const membershipsSnap = await getDocs(collection(db, 'organisationMemberships'));
    const usersSnap = await getDocs(collection(db, 'users'));

    const orgs: Organisation[] = [];
    orgsSnap.forEach((d) => orgs.push(d.data() as Organisation));

    const memberships: OrganisationMembership[] = [];
    membershipsSnap.forEach((d) => memberships.push(d.data() as OrganisationMembership));

    return this.computeKPIs(orgs, memberships, usersSnap.size);
  },

  computeKPIs(
    orgs: Organisation[],
    memberships: OrganisationMembership[] = [],
    totalUsers: number = 0
  ): PlatformKPIs {
    let activeCount = 0;
    let trialCount = 0;
    let restrictedCount = 0;
    let suspendedCount = 0;
    let cancelledCount = 0;
    let archivedCount = 0;
    let provisioningCount = 0;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfMonthIso = startOfMonth.toISOString();

    let newThisMonth = 0;
    let demoCount = 0;
    let customerCount = 0;

    for (const org of orgs) {
      if (org.isDemoTenant || org.id === 'org_demo_artsflow' || org.id === 'org_demo_tkm') {
        demoCount++;
      } else {
        customerCount++;
      }

      const status: TenantStatus = org.tenantStatus || 'active';
      switch (status) {
        case 'active':
          activeCount++;
          break;
        case 'trial':
          trialCount++;
          break;
        case 'restricted':
          restrictedCount++;
          break;
        case 'suspended':
          suspendedCount++;
          break;
        case 'cancelled':
          cancelledCount++;
          break;
        case 'archived':
          archivedCount++;
          break;
        case 'provisioning':
          provisioningCount++;
          break;
      }

      if (org.createdAt && org.createdAt >= startOfMonthIso) {
        newThisMonth++;
      }
    }

    const activeMembershipsCount = memberships.filter(
      (m) => m.membershipStatus === 'active'
    ).length;

    // Sort recent organisations by createdAt descending
    const recentOrganisations = [...orgs]
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
      .slice(0, 5);

    return {
      totalOrganisations: orgs.length,
      customerOrganisations: customerCount,
      demoOrganisations: demoCount,
      activeOrganisations: activeCount,
      trialOrganisations: trialCount,
      restrictedOrganisations: restrictedCount,
      suspendedOrganisations: suspendedCount,
      cancelledOrganisations: cancelledCount,
      archivedOrganisations: archivedCount,
      provisioningOrganisations: provisioningCount,
      totalPlatformUsers: totalUsers,
      activeMemberships: activeMembershipsCount,
      newOrganisationsThisMonth: newThisMonth,
      recentOrganisations
    };
  }
};
