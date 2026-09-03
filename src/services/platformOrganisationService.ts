import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { auditService } from './auditService';
import { organisationMembershipRepository } from '../repositories/organisationMembershipRepository';
import type { Organisation, OrganisationMembership, TenantStatus } from '../types';

export interface CreateOrganisationInput {
  name: string;
  organisationType: string;
  primaryAdminEmail?: string;
  primaryAdminName?: string;
  phone?: string;
  address?: string;
  initialStatus?: TenantStatus;
  actorId: string;
}

export interface CreateOrganisationResult {
  organisation: Organisation;
  adminMembership?: OrganisationMembership;
}

export interface OrganisationFilter {
  status?: TenantStatus | 'all';
  type?: string | 'all';
  search?: string;
}

export const platformOrganisationService = {
  /**
   * Generates a safe URL slug from the organisation name.
   */
  generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'org';
  },

  /**
   * Checks for similar/duplicate organisation names or primary admins.
   */
  async checkDuplicate(name: string, email?: string): Promise<{ isDuplicateName: boolean; isDuplicateEmail: boolean }> {
    const normalisedName = name.trim().toLowerCase();
    const normalisedEmail = email?.trim().toLowerCase();

    try {
      const orgsSnap = await getDocs(collection(db, 'organisations'));
      let isDuplicateName = false;
      let isDuplicateEmail = false;

      orgsSnap.forEach((d) => {
        const data = d.data() as Organisation;
        if (data.name?.trim().toLowerCase() === normalisedName) {
          isDuplicateName = true;
        }
        if (normalisedEmail && data.primaryAdminEmail?.trim().toLowerCase() === normalisedEmail) {
          isDuplicateEmail = true;
        }
      });

      return { isDuplicateName, isDuplicateEmail };
    } catch {
      return { isDuplicateName: false, isDuplicateEmail: false };
    }
  },

  /**
   * Manually provisions a new tenant organisation with optional initial admin membership.
   */
  async createOrganisation(input: CreateOrganisationInput): Promise<CreateOrganisationResult> {
    const {
      name,
      organisationType,
      primaryAdminEmail,
      primaryAdminName,
      phone,
      address,
      initialStatus = 'active',
      actorId
    } = input;

    if (!name?.trim()) {
      throw new Error('Organisation name is required.');
    }

    const orgId = `org_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`;
    const slug = this.generateSlug(name);
    const now = new Date().toISOString();

    const newOrg: Organisation = {
      id: orgId,
      organisationId: orgId,
      name: name.trim(),
      organisationType: organisationType.trim() || 'performing_arts',
      slug,
      email: primaryAdminEmail?.trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined,
      tenantStatus: initialStatus,
      primaryAdminEmail: primaryAdminEmail?.trim() || undefined,
      primaryAdminName: primaryAdminName?.trim() || undefined,
      lastActiveAt: now,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId
    };

    const orgRef = doc(db, 'organisations', orgId);
    await setDoc(orgRef, newOrg);

    let adminMembership: OrganisationMembership | undefined;

    if (primaryAdminEmail?.trim()) {
      const invitedUserId = `invited_${Math.random().toString(36).substring(2, 9)}`;
      const membershipData: OrganisationMembership = {
        id: `mem_${invitedUserId}_${orgId}`,
        organisationId: orgId,
        userId: invitedUserId,
        email: primaryAdminEmail.trim().toLowerCase(),
        displayName: primaryAdminName?.trim() || undefined,
        role: 'organisation_admin',
        membershipStatus: 'invited',
        isDefaultOrganisation: true,
        joinedAt: now,
        createdAt: now,
        updatedAt: now,
        createdBy: actorId,
        updatedBy: actorId,
        status: 'active'
      };

      try {
        await organisationMembershipRepository.createMembership(orgId, actorId, membershipData);
        adminMembership = membershipData;
      } catch (err) {
        console.warn('Could not automatically create initial admin membership', err);
      }
    }

    // Platform audit
    await auditService.log(
      orgId,
      actorId,
      'PLATFORM_CREATE_ORGANISATION',
      'organisation',
      orgId,
      undefined,
      {
        name: newOrg.name,
        tenantStatus: newOrg.tenantStatus,
        primaryAdminEmail: newOrg.primaryAdminEmail
      }
    );

    return { organisation: newOrg, adminMembership };
  },

  /**
   * Retrieves single organisation details.
   */
  async getOrganisation(organisationId: string): Promise<Organisation | null> {
    const orgRef = doc(db, 'organisations', organisationId);
    const snap = await getDoc(orgRef);
    if (!snap.exists()) return null;
    return snap.data() as Organisation;
  },

  /**
   * Lists all organisations across the platform for Super Admin with search and filtering.
   */
  async listOrganisations(filter?: OrganisationFilter): Promise<Organisation[]> {
    const orgsRef = collection(db, 'organisations');
    const q = query(orgsRef, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);

    let list: Organisation[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Organisation);
    });

    if (filter) {
      if (filter.status && filter.status !== 'all') {
        list = list.filter((o) => (o.tenantStatus || 'active') === filter.status);
      }
      if (filter.type && filter.type !== 'all') {
        list = list.filter((o) => o.organisationType === filter.type);
      }
      if (filter.search && filter.search.trim()) {
        const term = filter.search.trim().toLowerCase();
        list = list.filter(
          (o) =>
            o.name.toLowerCase().includes(term) ||
            o.id.toLowerCase().includes(term) ||
            (o.primaryAdminEmail && o.primaryAdminEmail.toLowerCase().includes(term)) ||
            (o.slug && o.slug.toLowerCase().includes(term))
        );
      }
    }

    return list;
  }
};
