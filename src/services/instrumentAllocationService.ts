import { instrumentAllocationRepository } from '../repositories/instrumentAllocationRepository';
import { instrumentRepository } from '../repositories/instrumentRepository';
import { learnerRepository } from '../repositories/learnerRepository';
import { auditService } from './auditService';
import type { InstrumentAllocation, InstrumentCondition } from '../types';

export const instrumentAllocationService = {
  async allocateInstrument(
    orgId: string, 
    actorId: string, 
    instrumentId: string, 
    learnerId: string, 
    conditionOut: InstrumentCondition,
    allocatedDate: string,
    returnDueDate?: string,
    notes?: string
  ): Promise<InstrumentAllocation> {
    // Validate org isolation
    const instrument = await instrumentRepository.getById(orgId, instrumentId);
    if (!instrument) throw new Error('Instrument not found');
    
    const learner = await learnerRepository.getById(orgId, learnerId);
    if (!learner) throw new Error('Learner not found');

    // Check existing active allocation
    const existing = await instrumentAllocationRepository.getActiveByInstrumentId(orgId, instrumentId);
    if (existing) throw new Error('Instrument is already allocated');

    // Create allocation
    const allocation = await instrumentAllocationRepository.create(orgId, actorId, {
      instrumentId,
      learnerId,
      allocatedDate,
      returnDueDate,
      conditionOut,
      allocationStatus: 'active',
      notes: notes || ''
    });

    // Update instrument status
    const beforeInst = { ...instrument };
    await instrumentRepository.update(orgId, actorId, instrumentId, {
      instrumentStatus: 'allocated'
    });
    const afterInst = await instrumentRepository.getById(orgId, instrumentId);

    // Audit logs
    await auditService.log(orgId, actorId, 'ALLOCATE_INSTRUMENT', 'instrumentAllocation', allocation.id, null, allocation);
    await auditService.log(orgId, actorId, 'UPDATE', 'instrument', instrumentId, beforeInst, afterInst);

    return allocation;
  },

  async returnInstrument(
    orgId: string,
    actorId: string,
    allocationId: string,
    returnedDate: string,
    conditionReturned: InstrumentCondition,
    needsRepair: boolean,
    notes?: string
  ): Promise<void> {
    const allocation = await instrumentAllocationRepository.getById(orgId, allocationId);
    if (!allocation) throw new Error('Allocation not found');
    if (allocation.allocationStatus !== 'active' && allocation.allocationStatus !== 'overdue') {
      throw new Error('Allocation is not active');
    }

    const instrument = await instrumentRepository.getById(orgId, allocation.instrumentId);
    if (!instrument) throw new Error('Instrument not found');

    // Close allocation
    const beforeAlloc = { ...allocation };
    const updatedNotes = notes ? (allocation.notes ? `${allocation.notes}\nReturned: ${notes}` : `Returned: ${notes}`) : allocation.notes;
    
    await instrumentAllocationRepository.update(orgId, actorId, allocationId, {
      allocationStatus: 'returned',
      returnedDate,
      conditionReturned,
      notes: updatedNotes
    });
    const afterAlloc = await instrumentAllocationRepository.getById(orgId, allocationId);

    // Update instrument
    const beforeInst = { ...instrument };
    await instrumentRepository.update(orgId, actorId, instrument.id, {
      instrumentStatus: needsRepair ? 'repair' : 'available',
      condition: conditionReturned
    });
    const afterInst = await instrumentRepository.getById(orgId, instrument.id);

    // Audit logs
    await auditService.log(orgId, actorId, 'RETURN_INSTRUMENT', 'instrumentAllocation', allocationId, beforeAlloc, afterAlloc);
    await auditService.log(orgId, actorId, 'UPDATE', 'instrument', instrument.id, beforeInst, afterInst);
  }
};
