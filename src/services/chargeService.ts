import { chargeRepository } from '../repositories/chargeRepository';
import { chargeTypeRepository } from '../repositories/chargeTypeRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { auditService } from './auditService';
import { learnerGuardianRepository } from '../repositories/learnerGuardianRepository';
import type { Charge, ChargeStatus } from '../types';

export interface CreateChargeInput {
  learnerId: string;
  guardianId?: string;
  chargeTypeId: string;
  programmeId?: string;
  groupId?: string;
  eventId?: string;
  transportPlanId?: string;
  description: string;
  quantity: number;
  unitAmount: number; // In cents
  currency?: string;
  chargeDate: string;
  dueDate?: string;
  notes?: string;
}

export interface BulkChargeInput {
  learnerIds: string[];
  chargeTypeId: string;
  programmeId?: string;
  groupId?: string;
  eventId?: string;
  transportPlanId?: string;
  description: string;
  quantity: number;
  unitAmount: number; // In cents
  currency?: string;
  chargeDate: string;
  dueDate?: string;
  notes?: string;
}

export const chargeService = {
  async getCharges(
    organisationId: string,
    filters?: {
      learnerId?: string;
      chargeStatus?: ChargeStatus;
      programmeId?: string;
      eventId?: string;
    }
  ): Promise<Charge[]> {
    const all = await chargeRepository.getByOrganisation(organisationId);
    return all.filter(c => {
      if (filters?.learnerId && c.learnerId !== filters.learnerId) return false;
      if (filters?.chargeStatus && c.chargeStatus !== filters.chargeStatus) return false;
      if (filters?.programmeId && c.programmeId !== filters.programmeId) return false;
      if (filters?.eventId && c.eventId !== filters.eventId) return false;
      return true;
    });
  },

  async getChargeById(organisationId: string, id: string): Promise<Charge | null> {
    return chargeRepository.getById(organisationId, id);
  },

  async createCharge(
    organisationId: string,
    input: CreateChargeInput,
    actorId: string
  ): Promise<Charge> {
    // 1. Validation
    if (input.quantity <= 0) {
      throw new Error('Quantity must be greater than 0.');
    }
    if (input.unitAmount < 0) {
      throw new Error('Unit amount cannot be negative.');
    }

    const learner = await learnerRepository.getById(organisationId, input.learnerId);
    if (!learner) {
      throw new Error('Learner not found or does not belong to this organisation.');
    }

    const chargeType = await chargeTypeRepository.getById(organisationId, input.chargeTypeId);
    if (!chargeType) {
      throw new Error('Charge type not found.');
    }

    // Determine guardianId if not supplied
    let guardianId = input.guardianId;
    if (!guardianId) {
      const links = await learnerGuardianRepository.getByOrganisation(organisationId);
      const learnerLinks = links.filter(l => l.learnerId === input.learnerId);
      const financialLink = learnerLinks.find(l => l.financialContact) || learnerLinks.find(l => l.primaryContact) || learnerLinks[0];
      guardianId = financialLink?.guardianId;
    }

    const amount = Math.round(input.quantity * input.unitAmount);

    const charge = await chargeRepository.create(organisationId, actorId, {
      ...input,
      guardianId,
      amount,
      currency: input.currency || chargeType.currency || 'ZAR',
      chargeStatus: 'active',
      discountAmount: 0,
      waivedAmount: 0
    } as never);

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_CHARGE',
      'charge',
      charge.id,
      undefined,
      charge
    );

    return charge;
  },

  async createBulkCharges(
    organisationId: string,
    input: BulkChargeInput,
    actorId: string
  ): Promise<{ created: Charge[]; skipped: number }> {
    if (input.quantity <= 0) {
      throw new Error('Quantity must be greater than 0.');
    }
    if (input.unitAmount < 0) {
      throw new Error('Unit amount cannot be negative.');
    }
    if (!input.learnerIds || input.learnerIds.length === 0) {
      throw new Error('No learners selected for bulk charge.');
    }

    const chargeType = await chargeTypeRepository.getById(organisationId, input.chargeTypeId);
    if (!chargeType) {
      throw new Error('Charge type not found.');
    }

    const existingCharges = await chargeRepository.getByOrganisation(organisationId);
    const created: Charge[] = [];
    let skipped = 0;

    for (const learnerId of input.learnerIds) {
      // Check duplicate warning: same learner, chargeType, chargeDate, and related entity
      const isDuplicate = existingCharges.some(
        c =>
          c.learnerId === learnerId &&
          c.chargeTypeId === input.chargeTypeId &&
          c.chargeDate === input.chargeDate &&
          c.eventId === input.eventId &&
          c.programmeId === input.programmeId &&
          c.chargeStatus !== 'cancelled' &&
          c.chargeStatus !== 'waived'
      );

      if (isDuplicate) {
        skipped++;
        continue;
      }

      const charge = await this.createCharge(
        organisationId,
        {
          learnerId,
          chargeTypeId: input.chargeTypeId,
          programmeId: input.programmeId,
          groupId: input.groupId,
          eventId: input.eventId,
          transportPlanId: input.transportPlanId,
          description: input.description,
          quantity: input.quantity,
          unitAmount: input.unitAmount,
          currency: input.currency || chargeType.currency,
          chargeDate: input.chargeDate,
          dueDate: input.dueDate,
          notes: input.notes
        },
        actorId
      );

      created.push(charge);
    }

    await auditService.log(
      organisationId,
      actorId,
      'CREATE_BULK_CHARGES',
      'charge',
      'bulk',
      undefined,
      { count: created.length, skipped, chargeTypeId: input.chargeTypeId }
    );

    return { created, skipped };
  },

  async waiveCharge(
    organisationId: string,
    chargeId: string,
    waivedAmount: number, // in cents
    reason: string,
    approvedBy: string,
    actorId: string
  ): Promise<void> {
    if (!reason?.trim()) {
      throw new Error('A valid reason is required to waive a charge.');
    }
    if (!approvedBy?.trim()) {
      throw new Error('Authorised approver name is required to waive a charge.');
    }
    if (waivedAmount <= 0) {
      throw new Error('Waived amount must be greater than zero.');
    }

    const existing = await chargeRepository.getById(organisationId, chargeId);
    if (!existing) throw new Error('Charge not found.');

    if (existing.chargeStatus === 'cancelled') {
      throw new Error('Cannot waive a cancelled charge.');
    }
    if (waivedAmount > existing.amount) {
      throw new Error('Waived amount cannot exceed charge amount.');
    }

    const newStatus: ChargeStatus = waivedAmount === existing.amount ? 'waived' : 'partially_waived';

    const updates = {
      waivedAmount,
      waiverReason: reason.trim(),
      waiverApprovedBy: approvedBy.trim(),
      chargeStatus: newStatus
    };

    await chargeRepository.update(organisationId, actorId, chargeId, updates as never);

    await auditService.log(
      organisationId,
      actorId,
      'APPROVE_WAIVER',
      'charge',
      chargeId,
      existing,
      { ...existing, ...updates }
    );
  },

  async cancelCharge(
    organisationId: string,
    chargeId: string,
    reason: string,
    actorId: string
  ): Promise<void> {
    const existing = await chargeRepository.getById(organisationId, chargeId);
    if (!existing) throw new Error('Charge not found.');

    if (existing.chargeStatus === 'invoiced') {
      throw new Error('Cannot cancel an invoiced charge directly. The associated invoice must be modified or cancelled.');
    }

    const updates = {
      chargeStatus: 'cancelled' as const,
      notes: existing.notes ? `${existing.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`
    };

    await chargeRepository.update(organisationId, actorId, chargeId, updates as never);

    await auditService.log(
      organisationId,
      actorId,
      'CANCEL_CHARGE',
      'charge',
      chargeId,
      existing,
      { ...existing, ...updates }
    );
  }
};
