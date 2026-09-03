import { organisationEntitlementOverrideRepository } from '../repositories/organisationEntitlementOverrideRepository';
import { auditService } from './auditService';
import { entitlementResolverService } from './entitlementResolverService';
import type { OrganisationEntitlementOverride, OverrideType } from '../types';

export const entitlementOverrideService = {
  async listOverrides(organisationId: string): Promise<OrganisationEntitlementOverride[]> {
    return organisationEntitlementOverrideRepository.getByOrganisation(organisationId);
  },

  async getActiveOverrides(organisationId: string): Promise<OrganisationEntitlementOverride[]> {
    return organisationEntitlementOverrideRepository.getActiveByOrganisation(organisationId);
  },

  async createOverride(
    actorId: string,
    organisationId: string,
    data: {
      featureKey: string;
      overrideType: OverrideType;
      enabled?: boolean;
      limitValue?: number | null;
      configuration?: Record<string, unknown>;
      reason: string;
      startsAt?: string;
      expiresAt?: string;
    }
  ): Promise<OrganisationEntitlementOverride> {
    if (!data.reason || !data.reason.trim()) {
      throw new Error('Mandatory justification reason is required for creating an entitlement override.');
    }

    if (data.startsAt && data.expiresAt && data.startsAt >= data.expiresAt) {
      throw new Error('Override startsAt must be before expiresAt.');
    }

    const now = new Date().toISOString();
    const overrideId = `ovr_${organisationId}_${data.featureKey.replace(/\./g, '_')}_${Date.now()}`;

    const override: OrganisationEntitlementOverride = {
      id: overrideId,
      organisationId,
      featureKey: data.featureKey,
      overrideType: data.overrideType,
      enabled: data.overrideType === 'enable' ? true : data.overrideType === 'disable' ? false : data.enabled,
      limitValue: data.limitValue !== undefined ? data.limitValue : null,
      configuration: data.configuration,
      reason: data.reason.trim(),
      startsAt: data.startsAt,
      expiresAt: data.expiresAt,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
      status: 'active'
    };

    await organisationEntitlementOverrideRepository.save(override);

    await auditService.log({
      organisationId,
      actorId,
      action: 'PLATFORM_CREATE_ENTITLEMENT_OVERRIDE',
      entityType: 'organisationEntitlementOverride',
      entityId: override.id,
      scopeType: 'platform',
      reason: data.reason,
      after: override
    });

    entitlementResolverService.invalidateCache(organisationId);

    return override;
  },

  async updateOverride(
    actorId: string,
    id: string,
    updates: {
      reason: string;
      enabled?: boolean;
      limitValue?: number | null;
      configuration?: Record<string, unknown>;
      startsAt?: string;
      expiresAt?: string;
    }
  ): Promise<OrganisationEntitlementOverride> {
    if (!updates.reason || !updates.reason.trim()) {
      throw new Error('Mandatory justification reason is required for updating an entitlement override.');
    }

    const current = await organisationEntitlementOverrideRepository.getById(id);
    if (!current) throw new Error(`Override '${id}' not found.`);

    const now = new Date().toISOString();
    const updated: OrganisationEntitlementOverride = {
      ...current,
      enabled: updates.enabled !== undefined ? updates.enabled : current.enabled,
      limitValue: updates.limitValue !== undefined ? updates.limitValue : current.limitValue,
      configuration: updates.configuration !== undefined ? updates.configuration : current.configuration,
      reason: updates.reason.trim(),
      startsAt: updates.startsAt !== undefined ? updates.startsAt : current.startsAt,
      expiresAt: updates.expiresAt !== undefined ? updates.expiresAt : current.expiresAt,
      updatedAt: now
    };

    await organisationEntitlementOverrideRepository.save(updated);

    await auditService.log({
      organisationId: current.organisationId,
      actorId,
      action: 'PLATFORM_UPDATE_ENTITLEMENT_OVERRIDE',
      entityType: 'organisationEntitlementOverride',
      entityId: id,
      scopeType: 'platform',
      reason: updates.reason,
      before: current,
      after: updated
    });

    entitlementResolverService.invalidateCache(current.organisationId);

    return updated;
  },

  async endOverride(
    actorId: string,
    id: string,
    reason: string
  ): Promise<OrganisationEntitlementOverride> {
    if (!reason || !reason.trim()) {
      throw new Error('Mandatory justification reason is required for ending an entitlement override.');
    }

    const current = await organisationEntitlementOverrideRepository.getById(id);
    if (!current) throw new Error(`Override '${id}' not found.`);

    const now = new Date().toISOString();
    const ended: OrganisationEntitlementOverride = {
      ...current,
      expiresAt: now,
      status: 'inactive',
      updatedAt: now
    };

    await organisationEntitlementOverrideRepository.save(ended);

    await auditService.log({
      organisationId: current.organisationId,
      actorId,
      action: 'PLATFORM_END_ENTITLEMENT_OVERRIDE',
      entityType: 'organisationEntitlementOverride',
      entityId: id,
      scopeType: 'platform',
      reason: reason.trim(),
      before: current,
      after: ended
    });

    entitlementResolverService.invalidateCache(current.organisationId);

    return ended;
  }
};
