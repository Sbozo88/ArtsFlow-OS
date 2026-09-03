import { organisationRepository } from '../../repositories/organisationRepository';
import { subscriptionResolverService } from '../billing/subscriptionResolverService';
import { subscriptionRepository } from '../../repositories/subscriptionRepository';
import { saasSubscriptionService } from '../billing/saasSubscriptionService';
import { auditService } from '../auditService';
import type {
  Organisation,
  Subscription,
  FoundingPartnerStats,
  FoundingPartnerStatus
} from '../../types';

export class FoundingPartnerService {
  public static readonly MAX_FOUNDING_PARTNERS = 10;
  public static readonly FOUNDING_PRICE_STARTER = 39900; // R399.00 / mo
  public static readonly FOUNDING_PRICE_PROFESSIONAL = 79900; // R799.00 / mo
  public static readonly STANDARD_PRICE_STARTER = 49900; // R499.00 / mo
  public static readonly STANDARD_PRICE_PROFESSIONAL = 99900; // R999.00 / mo
  public static readonly PRICE_LOCK_MONTHS = 12;

  /**
   * Retrieves current Founding Partner quota statistics.
   */
  async getFoundingPartnerStats(): Promise<FoundingPartnerStats> {
    const allOrgs = await organisationRepository.getAll();
    const foundingPartners = allOrgs.filter(
      (o) => o.isFoundingPartner && o.foundingPartnerStatus !== 'declined' && o.foundingPartnerStatus !== 'withdrawn'
    );

    const activePartnersCount = foundingPartners.filter(
      (o) => o.foundingPartnerStatus === 'active' || o.foundingPartnerStatus === 'converted'
    ).length;

    const trialPartnersCount = foundingPartners.filter(
      (o) => o.foundingPartnerStatus === 'trial' || o.foundingPartnerStatus === 'candidate'
    ).length;

    const convertedPartnersCount = foundingPartners.filter(
      (o) => o.foundingPartnerStatus === 'converted'
    ).length;

    const allocatedSlots = foundingPartners.length;
    const maxSlots = FoundingPartnerService.MAX_FOUNDING_PARTNERS;
    const remainingSlots = Math.max(0, maxSlots - allocatedSlots);
    const isFull = allocatedSlots >= maxSlots;

    return {
      allocatedSlots,
      maxSlots,
      remainingSlots,
      isFull,
      activePartnersCount,
      trialPartnersCount,
      convertedPartnersCount
    };
  }

  /**
   * Assigns an organisation to the Founding Partner Programme (Max 10 slots).
   * Automatically calculates 12-month price lock expiry and allocates the next slot number.
   */
  async assignFoundingPartner(
    actorId: string,
    organisationId: string,
    options?: {
      partnerNumber?: number;
      status?: FoundingPartnerStatus;
      notes?: string;
    }
  ): Promise<Organisation> {
    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      throw new Error(`Organisation '${organisationId}' not found.`);
    }

    const allOrgs = await organisationRepository.getAll();
    const currentPartners = allOrgs.filter(
      (o) => o.isFoundingPartner && o.foundingPartnerStatus !== 'declined' && o.foundingPartnerStatus !== 'withdrawn'
    );

    // If org is not already an active founding partner, verify slot capacity
    const isAlreadyPartner = org.isFoundingPartner && org.foundingPartnerStatus !== 'declined' && org.foundingPartnerStatus !== 'withdrawn';
    if (!isAlreadyPartner && currentPartners.length >= FoundingPartnerService.MAX_FOUNDING_PARTNERS) {
      throw new Error('Founding Partner Programme is full (maximum 10 slots allocated).');
    }

    // Allocate next available partner number if not supplied
    let partnerNumber = options?.partnerNumber || org.foundingPartnerNumber;
    if (!partnerNumber) {
      const takenNumbers = new Set(
        currentPartners.map((p) => p.foundingPartnerNumber).filter(Boolean)
      );
      for (let i = 1; i <= FoundingPartnerService.MAX_FOUNDING_PARTNERS; i++) {
        if (!takenNumbers.has(i)) {
          partnerNumber = i;
          break;
        }
      }
      partnerNumber = partnerNumber || currentPartners.length + 1;
    }

    const now = new Date();
    const lockExpiry = new Date(now);
    lockExpiry.setFullYear(lockExpiry.getFullYear() + 1); // 12-month price protection

    await organisationRepository.update(organisationId, actorId, {
      isFoundingPartner: true,
      foundingPartnerNumber: partnerNumber,
      foundingPartnerStartedAt: org.foundingPartnerStartedAt || now.toISOString(),
      foundingPriceLockEndsAt: lockExpiry.toISOString(),
      foundingPartnerStatus: options?.status || (org.tenantStatus === 'trial' ? 'trial' : 'active')
    });

    await auditService.log({
      organisationId,
      actorId,
      action: 'PLATFORM_ASSIGN_FOUNDING_PARTNER',
      entityType: 'organisation',
      entityId: organisationId,
      scopeType: 'platform',
      reason: `Assigned Founding Partner #${partnerNumber} with 12-month price lock`,
      after: {
        partnerNumber,
        priceLockEndsAt: lockExpiry.toISOString()
      }
    });

    return (await organisationRepository.getById(organisationId))!;
  }

  /**
   * Removes an organisation from the Founding Partner Programme.
   */
  async removeFoundingPartner(
    actorId: string,
    organisationId: string,
    reason: string
  ): Promise<Organisation> {
    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      throw new Error(`Organisation '${organisationId}' not found.`);
    }

    const previousNumber = org.foundingPartnerNumber;

    await organisationRepository.update(organisationId, actorId, {
      isFoundingPartner: false,
      foundingPartnerStatus: 'withdrawn'
    });

    await auditService.log({
      organisationId,
      actorId,
      action: 'PLATFORM_REMOVE_FOUNDING_PARTNER',
      entityType: 'organisation',
      entityId: organisationId,
      scopeType: 'platform',
      reason: `Removed from Founding Partner Programme: ${reason}`,
      before: { foundingPartnerNumber: previousNumber }
    });

    return (await organisationRepository.getById(organisationId))!;
  }

  /**
   * Converts a Founding Partner trial to an active paid subscription with locked founding pricing.
   */
  async convertFoundingPartnerSubscription(
    actorId: string,
    organisationId: string,
    planId: 'plan_starter' | 'plan_professional',
    billingInterval: 'monthly' | 'annual' = 'monthly'
  ): Promise<Subscription> {
    const org = await organisationRepository.getById(organisationId);
    if (!org) {
      throw new Error(`Organisation '${organisationId}' not found.`);
    }

    // Determine applicable monthly price (cents)
    const monthlyCents =
      planId === 'plan_starter'
        ? FoundingPartnerService.FOUNDING_PRICE_STARTER
        : FoundingPartnerService.FOUNDING_PRICE_PROFESSIONAL;

    let priceAmount = monthlyCents;
    if (billingInterval === 'annual') {
      priceAmount = monthlyCents * 10; // ~17% annual discount on founding price
    }

    const sub = await subscriptionResolverService.getCurrentSubscription(organisationId);
    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + (billingInterval === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString();

    let convertedSub: Subscription;

    if (sub) {
      await subscriptionRepository.update(sub.id, {
        planId,
        priceAmount,
        currency: 'ZAR',
        billingInterval,
        subscriptionStatus: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        notes: `Founding Partner #${org.foundingPartnerNumber || 'X'} converted with 12-month price protection (R${monthlyCents / 100}/mo)`
      });
      convertedSub = (await subscriptionRepository.getById(sub.id))!;
    } else {
      convertedSub = await saasSubscriptionService.createManualSubscription(actorId, organisationId, {
        planId,
        billingInterval,
        priceAmount,
        currency: 'ZAR',
        reason: `Founding Partner #${org.foundingPartnerNumber || 'X'} conversion`
      });
      await saasSubscriptionService.activateSubscription(actorId, convertedSub.id);
    }

    // Mark organisation foundingPartnerStatus as converted and update tenantStatus
    await organisationRepository.update(organisationId, actorId, {
      tenantStatus: 'active',
      assignedPlanId: planId,
      foundingPartnerStatus: 'converted',
      foundingPlanPrice: priceAmount
    });

    await auditService.log({
      organisationId,
      actorId,
      action: 'PLATFORM_ACTIVATE_SUBSCRIPTION',
      entityType: 'subscription',
      entityId: convertedSub.id,
      scopeType: 'platform',
      reason: `Converted Founding Partner to active ${planId} at locked price R${priceAmount / 100} (${billingInterval})`
    });

    return convertedSub;
  }
}

export const foundingPartnerService = new FoundingPartnerService();
