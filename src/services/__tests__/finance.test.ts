import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toCents, toMajor, formatMoney, addMoney, subtractMoney, calculateBalance } from '../../lib/money';
import { chargeService } from '../chargeService';
import { invoiceService } from '../invoiceService';
import { paymentService } from '../paymentService';
import { paymentAllocationService } from '../paymentAllocationService';
import { chargeRepository } from '../../repositories/chargeRepository';
import { chargeTypeRepository } from '../../repositories/chargeTypeRepository';
import { invoiceRepository } from '../../repositories/invoiceRepository';
import { invoiceLineItemRepository } from '../../repositories/invoiceLineItemRepository';
import { paymentRepository } from '../../repositories/paymentRepository';
import { paymentAllocationRepository } from '../../repositories/paymentAllocationRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { learnerGuardianRepository } from '../../repositories/learnerGuardianRepository';

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Phase 4A: Finance & Payments Integrity Tests', () => {
  const orgId = 'org-test-123';
  const actorId = 'user-admin';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Minor Unit Monetary Math & Formatting', () => {
    it('accurately converts major units to minor units without floating point inaccuracy', () => {
      expect(toCents(450.50)).toBe(45050);
      expect(toCents(10.05)).toBe(1005);
      expect(toCents(0.99)).toBe(99);
      expect(toMajor(45050)).toBe(450.5);
    });

    it('adds, subtracts, and calculates balances accurately', () => {
      expect(addMoney(1000, 2500)).toBe(3500);
      expect(subtractMoney(5000, 1500)).toBe(3500);
      expect(calculateBalance(10000, 6000)).toBe(4000);
      expect(calculateBalance(10000, 12000)).toBe(0); // Clamped at 0
    });

    it('formats South African Rand currency cleanly', () => {
      const formatted = formatMoney(45000, 'ZAR');
      expect(formatted).toContain('450');
      expect(formatted).toContain('R');

      const formattedZero = formatMoney(0, 'ZAR');
      expect(formattedZero).toContain('0');
      expect(formattedZero).toContain('R');
    });
  });

  describe('2. Charge Creation & Validation Rules', () => {
    it('rejects charges with quantity <= 0 or unitAmount < 0', async () => {
      await expect(
        chargeService.createCharge(
          orgId,
          {
            learnerId: 'learner-1',
            chargeTypeId: 'type-1',
            description: 'Test Charge',
            quantity: 0,
            unitAmount: 1000,
            chargeDate: '2026-03-01'
          },
          actorId
        )
      ).rejects.toThrow(/Quantity must be greater than 0/);

      await expect(
        chargeService.createCharge(
          orgId,
          {
            learnerId: 'learner-1',
            chargeTypeId: 'type-1',
            description: 'Test Charge',
            quantity: 1,
            unitAmount: -50,
            chargeDate: '2026-03-01'
          },
          actorId
        )
      ).rejects.toThrow(/Unit amount cannot be negative/);
    });

    it('creates charge with minor units calculation and assigns financial guardian if found', async () => {
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue({
        id: 'learner-1',
        organisationId: orgId,
        firstName: 'Lerato'
      } as never);

      vi.spyOn(chargeTypeRepository, 'getById').mockResolvedValue({
        id: 'type-1',
        organisationId: orgId,
        name: 'Tuition'
      } as never);

      vi.spyOn(learnerGuardianRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'lg-1',
          organisationId: orgId,
          learnerId: 'learner-1',
          guardianId: 'guardian-99',
          financialContact: true
        } as never
      ]);

      vi.spyOn(chargeRepository, 'getByOrganisation').mockResolvedValue([]);

      const mockCreate = vi.spyOn(chargeRepository, 'create').mockImplementation(async (_org, _actor, data) => ({
        id: 'charge-new',
        organisationId: orgId,
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        createdBy: actorId,
        ...data
      } as never));

      const charge = await chargeService.createCharge(
        orgId,
        {
          learnerId: 'learner-1',
          chargeTypeId: 'type-1',
          description: 'Term 1 Fee',
          quantity: 2,
          unitAmount: 25000, // R250.00
          chargeDate: '2026-03-01'
        },
        actorId
      );

      expect(mockCreate).toHaveBeenCalled();
      expect(charge.amount).toBe(50000); // R500.00 in cents
      expect(charge.guardianId).toBe('guardian-99');
      expect(charge.chargeStatus).toBe('active');
    });

    it('waives charge requiring reason and approver, updating waivedAmount and status', async () => {
      vi.spyOn(chargeRepository, 'getById').mockResolvedValue({
        id: 'charge-1',
        organisationId: orgId,
        amount: 50000,
        waivedAmount: 0,
        chargeStatus: 'active'
      } as never);

      const updateSpy = vi.spyOn(chargeRepository, 'update').mockResolvedValue(undefined as never);

      await chargeService.waiveCharge(orgId, 'charge-1', 50000, 'Hardship bursary', 'Principal Smith', actorId);

      expect(updateSpy).toHaveBeenCalledWith(
        orgId,
        actorId,
        'charge-1',
        expect.objectContaining({
          waivedAmount: 50000,
          chargeStatus: 'waived'
        })
      );
    });
  });

  describe('3. Invoice Drafting, Calculation & Cancellation', () => {
    it('creates an invoice from uninvoiced charges and calculates totals accurately', async () => {
      vi.spyOn(learnerRepository, 'getById').mockResolvedValue({
        id: 'learner-1',
        organisationId: orgId,
        firstName: 'Sipho'
      } as never);

      vi.spyOn(learnerGuardianRepository, 'getByOrganisation').mockResolvedValue([]);
      vi.spyOn(invoiceService, 'generateNextInvoiceNumber').mockResolvedValue('INV-2026-000001');

      const mockCharges = [
        {
          id: 'c1',
          organisationId: orgId,
          learnerId: 'learner-1',
          description: 'Lesson 1',
          quantity: 1,
          unitAmount: 20000,
          amount: 20000,
          chargeStatus: 'active'
        },
        {
          id: 'c2',
          organisationId: orgId,
          learnerId: 'learner-1',
          description: 'Sheet Music',
          quantity: 1,
          unitAmount: 5000,
          amount: 5000,
          chargeStatus: 'active'
        }
      ];

      vi.spyOn(chargeRepository, 'getByOrganisation').mockResolvedValue(mockCharges as never);
      vi.spyOn(chargeRepository, 'getById').mockImplementation(async (_org, id) => {
        return mockCharges.find(c => c.id === id) as never || null;
      });

      vi.spyOn(chargeRepository, 'update').mockResolvedValue(undefined as never);
      vi.spyOn(invoiceLineItemRepository, 'create').mockResolvedValue({} as never);

      const invoiceCreateSpy = vi.spyOn(invoiceRepository, 'create').mockImplementation(async (_org, _actor, data) => ({
        id: 'inv-123',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        createdBy: actorId,
        organisationId: orgId,
        ...data
      } as never));

      const { invoice } = await invoiceService.createInvoiceFromCharges(
        orgId,
        {
          learnerId: 'learner-1',
          chargeIds: ['c1', 'c2'],
          dueDate: '2026-03-15',
          autoIssue: true
        },
        actorId
      );

      expect(invoiceCreateSpy).toHaveBeenCalled();
      expect(invoice.subtotal).toBe(25000); // R250.00
      expect(invoice.total).toBe(25000);
      expect(invoice.balance).toBe(25000);
      expect(invoice.invoiceStatus).toBe('issued');
    });

    it('cancels invoice and restores linked charges back to active uninvoiced status', async () => {
      vi.spyOn(invoiceRepository, 'getById').mockResolvedValue({
        id: 'inv-123',
        organisationId: orgId,
        amountPaid: 0,
        invoiceStatus: 'draft'
      } as never);

      vi.spyOn(paymentAllocationRepository, 'getByOrganisation').mockResolvedValue([]);

      vi.spyOn(invoiceLineItemRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'li-1', invoiceId: 'inv-123', chargeId: 'c1' } as never,
        { id: 'li-2', invoiceId: 'inv-123', chargeId: 'c2' } as never
      ]);

      const chargeUpdateSpy = vi.spyOn(chargeRepository, 'update').mockResolvedValue(undefined as never);
      const invoiceUpdateSpy = vi.spyOn(invoiceRepository, 'update').mockResolvedValue(undefined as never);

      await invoiceService.cancelInvoice(orgId, 'inv-123', 'Created in error', actorId);

      expect(chargeUpdateSpy).toHaveBeenCalledWith(orgId, actorId, 'c1', {
        chargeStatus: 'active',
        invoiceId: undefined
      });
      expect(invoiceUpdateSpy).toHaveBeenCalledWith(
        orgId,
        actorId,
        'inv-123',
        expect.objectContaining({
          invoiceStatus: 'cancelled'
        })
      );
    });
  });

  describe('4. Payment Recording, Allocation & Reversal Rules', () => {
    it('prevents allocating more than the outstanding invoice balance', async () => {
      vi.spyOn(paymentRepository, 'getById').mockResolvedValue({
        id: 'pay-1',
        organisationId: orgId,
        amount: 100000,
        allocatedAmount: 0,
        paymentStatus: 'recorded'
      } as never);

      vi.spyOn(invoiceRepository, 'getById').mockResolvedValue({
        id: 'inv-1',
        organisationId: orgId,
        total: 50000,
        amountPaid: 0,
        balance: 50000,
        invoiceStatus: 'issued'
      } as never);

      await expect(
        paymentAllocationService.allocatePayment(orgId, 'pay-1', 'inv-1', 60000, actorId)
      ).rejects.toThrow(/cannot exceed invoice balance/);
    });

    it('prevents allocating more than the unallocated payment balance', async () => {
      vi.spyOn(paymentRepository, 'getById').mockResolvedValue({
        id: 'pay-1',
        organisationId: orgId,
        amount: 30000,
        allocatedAmount: 20000, // 10000 remaining
        paymentStatus: 'partially_allocated'
      } as never);

      vi.spyOn(invoiceRepository, 'getById').mockResolvedValue({
        id: 'inv-1',
        organisationId: orgId,
        total: 50000,
        amountPaid: 0,
        balance: 50000,
        invoiceStatus: 'issued'
      } as never);

      vi.spyOn(paymentAllocationRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'alloc-prior',
          organisationId: orgId,
          paymentId: 'pay-1',
          amount: 20000
        } as never
      ]);

      await expect(
        paymentAllocationService.allocatePayment(orgId, 'pay-1', 'inv-1', 15000, actorId)
      ).rejects.toThrow(/Allocation amount exceeds remaining unallocated payment balance/);
    });

    it('reverses payment and rolls back all allocations and affected invoice balances', async () => {
      vi.spyOn(paymentRepository, 'getById').mockResolvedValue({
        id: 'pay-1',
        organisationId: orgId,
        amount: 40000,
        allocatedAmount: 40000,
        paymentStatus: 'allocated'
      } as never);

      vi.spyOn(paymentAllocationRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'alloc-1',
          organisationId: orgId,
          paymentId: 'pay-1',
          invoiceId: 'inv-1',
          amount: 40000
        } as never
      ]);

      vi.spyOn(paymentAllocationRepository, 'softDelete').mockResolvedValue(undefined as never);
      const paymentUpdateSpy = vi.spyOn(paymentRepository, 'update').mockResolvedValue(undefined as never);
      const recalculateSpy = vi.spyOn(invoiceService, 'recalculateInvoiceBalance').mockResolvedValue(undefined as never);

      await paymentService.reversePayment(orgId, 'pay-1', 'Bounced check', actorId);

      expect(paymentUpdateSpy).toHaveBeenCalledWith(
        orgId,
        actorId,
        'pay-1',
        expect.objectContaining({
          paymentStatus: 'reversed',
          allocatedAmount: 0
        })
      );
      expect(recalculateSpy).toHaveBeenCalledWith(orgId, 'inv-1', actorId);
    });
  });
});
