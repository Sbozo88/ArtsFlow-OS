import { costumeAllocationRepository } from '../repositories/costumeAllocationRepository';
import { costumeRepository } from '../repositories/costumeRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { auditService } from './auditService';
import type { CostumeAllocation, CostumeCondition } from '../types';

export const costumeAllocationService = {
  async allocateCostume(
    orgId: string,
    actorId: string,
    costumeId: string,
    learnerId: string,
    conditionOut: CostumeCondition,
    groupId?: string,
    returnDueDate?: string,
    notes?: string
  ): Promise<CostumeAllocation> {
    const costume = await costumeRepository.getById(orgId, costumeId);
    if (!costume) throw new Error('Costume not found');
    if (costume.costumeStatus === 'repair' || costume.costumeStatus === 'lost' || costume.costumeStatus === 'retired') {
      throw new Error(`Cannot allocate costume in status: ${costume.costumeStatus}`);
    }

    const learner = await learnerRepository.getById(orgId, learnerId);
    if (!learner) throw new Error('Learner not found');

    // Prevent double allocation of the same single asset costume (assuming no quantities are used or it's just 1 asset per allocation)
    // We will ensure that if the costume is tracked individually, it cannot be allocated twice.
    const allocations = await costumeAllocationRepository.getByOrganisation(orgId);
    const activeAllocations = allocations.filter(a => a.costumeId === costumeId && a.allocationStatus === 'active');
    
    // Check if quantity based, but for Phase 2B, simple 1-allocation logic unless quantity > active
    const maxQuantity = costume.quantity || 1;
    if (activeAllocations.length >= maxQuantity) {
      throw new Error('Costume is already fully allocated');
    }

    const allocation = await costumeAllocationRepository.create(orgId, actorId, {
      costumeId,
      learnerId,
      groupId,
      allocatedDate: new Date().toISOString(),
      returnDueDate,
      conditionOut,
      allocationStatus: 'active',
      notes
    });

    // Update costume status if fully allocated
    if (activeAllocations.length + 1 >= maxQuantity) {
      await costumeRepository.update(orgId, actorId, costumeId, { costumeStatus: 'allocated' });
    }

    await auditService.log(orgId, actorId, 'ALLOCATE_COSTUME', 'costumeAllocation', allocation.id, null, allocation);
    return allocation;
  },

  async returnCostume(
    orgId: string,
    actorId: string,
    allocationId: string,
    conditionReturned: CostumeCondition,
    notes?: string
  ): Promise<void> {
    const before = await costumeAllocationRepository.getById(orgId, allocationId);
    if (!before) throw new Error('Costume allocation not found');
    if (before.allocationStatus !== 'active' && before.allocationStatus !== 'overdue') {
      throw new Error('Costume allocation is not active');
    }

    await costumeAllocationRepository.update(orgId, actorId, allocationId, {
      returnedDate: new Date().toISOString(),
      conditionReturned,
      allocationStatus: 'returned',
      notes: notes !== undefined ? notes : before.notes
    });

    const costume = await costumeRepository.getById(orgId, before.costumeId);
    if (costume) {
      // Check if it's the last one returned to make it available
      await costumeRepository.update(orgId, actorId, before.costumeId, {
        condition: conditionReturned,
        costumeStatus: 'available'
      });
    }

    const after = await costumeAllocationRepository.getById(orgId, allocationId);
    await auditService.log(orgId, actorId, 'RETURN_COSTUME', 'costumeAllocation', allocationId, before, after);
  },

  async markCostumeLost(
    orgId: string,
    actorId: string,
    allocationId: string,
    notes?: string
  ): Promise<void> {
    const before = await costumeAllocationRepository.getById(orgId, allocationId);
    if (!before) throw new Error('Costume allocation not found');

    await costumeAllocationRepository.update(orgId, actorId, allocationId, {
      allocationStatus: 'lost',
      notes: notes !== undefined ? notes : before.notes
    });

    await costumeRepository.update(orgId, actorId, before.costumeId, { costumeStatus: 'lost' });

    const after = await costumeAllocationRepository.getById(orgId, allocationId);
    await auditService.log(orgId, actorId, 'MARK_COSTUME_LOST', 'costumeAllocation', allocationId, before, after);
  },

  async getCostumeAllocations(orgId: string): Promise<CostumeAllocation[]> {
    return costumeAllocationRepository.getByOrganisation(orgId);
  }
};
