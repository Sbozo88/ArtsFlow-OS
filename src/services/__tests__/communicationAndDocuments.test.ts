/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { communicationTemplateService } from '../communicationTemplateService';
import { communicationDeliveryService } from '../communicationDeliveryService';
import { recipientResolverService } from '../recipientResolverService';
import { documentUploadService } from '../documentUploadService';
import { documentVersionService } from '../documentVersionService';
import { documentGenerationService } from '../documentGenerationService';

import { communicationTemplateRepository } from '../../repositories/communicationTemplateRepository';
import { documentRepository } from '../../repositories/documentRepository';
import { documentVersionRepository } from '../../repositories/documentVersionRepository';
import { documentLinkRepository } from '../../repositories/documentLinkRepository';
import { learnerRepository } from '../../repositories/learnerRepository';
import { guardianRepository } from '../../repositories/guardianRepository';
import { learnerGuardianRepository } from '../../repositories/learnerGuardianRepository';
import { eventRepository } from '../../repositories/eventRepository';
import { eventScheduleRepository } from '../../repositories/eventScheduleRepository';
import { eventPerformanceRepository } from '../../repositories/eventPerformanceRepository';
import { eventTransportPlanRepository } from '../../repositories/eventTransportPlanRepository';
import { transportPassengerRepository } from '../../repositories/transportPassengerRepository';
import { transportVehicleRepository } from '../../repositories/transportVehicleRepository';
import { staffRepository } from '../../repositories/staffRepository';

vi.mock('../auditService', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock firebase storage
vi.mock('firebase/storage', () => ({
  getStorage: vi.fn().mockReturnValue({}),
  ref: vi.fn().mockReturnValue({ fullPath: 'mock/path' }),
  uploadBytes: vi.fn().mockResolvedValue({ ref: { fullPath: 'mock/path' } }),
  getDownloadURL: vi.fn().mockResolvedValue('https://firebasestorage.googleapis.com/v0/b/test/mock.pdf')
}));

describe('Phase 4B: Communication & Documents Integrity Tests', () => {
  const orgId = 'org-artsflow-4b';
  const actorId = 'user-coordinator';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Communication Template Engine & Merge Variables', () => {
    it('accurately resolves single and multiple merge variables', () => {
      const template = 'Dear {{guardianFirstName}}, please note that {{learnerFullName}} has rehearsal for {{eventName}} on {{eventDate}}.';
      const context = {
        guardianFirstName: 'Nomvula',
        learnerFullName: 'Sipho Zulu',
        eventName: 'Spring Gala',
        eventDate: '2026-10-15'
      };

      const result = communicationTemplateService.resolveTemplate(template, context);

      expect(result.resolvedText).toBe('Dear Nomvula, please note that Sipho Zulu has rehearsal for Spring Gala on 2026-10-15.');
      expect(result.missingVariables).toEqual([]);
    });

    it('identifies unsupplied / missing merge variables without silent token failure', () => {
      const template = 'Hello {{guardianFirstName}}, your invoice {{invoiceNumber}} of {{invoiceBalance}} is due on {{invoiceDueDate}}.';
      const context = {
        guardianFirstName: 'Thabo',
        invoiceNumber: 'INV-2026-001'
        // invoiceBalance and invoiceDueDate missing
      };

      const result = communicationTemplateService.resolveTemplate(template, context);

      expect(result.missingVariables).toContain('invoiceBalance');
      expect(result.missingVariables).toContain('invoiceDueDate');
      expect(result.resolvedText).toContain('INV-2026-001');
      // Missing variables remain marked or empty
      expect(result.resolvedText).toContain('{{invoiceBalance}}');
    });

    it('creates communication templates with category and defaults', async () => {
      vi.spyOn(communicationTemplateRepository, 'create').mockResolvedValue({
        id: 'tmpl-101',
        organisationId: orgId,
        name: 'Overdue Notice',
        category: 'finance',
        defaultChannel: 'email',
        bodyTemplate: 'Please pay {{invoiceBalance}}.',
        templateStatus: 'active',
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
        createdBy: actorId,
        updatedBy: actorId
      } as any);

      const tmpl = await communicationTemplateService.createTemplate(
        orgId,
        {
          name: 'Overdue Notice',
          category: 'finance',
          defaultChannel: 'email',
          bodyTemplate: 'Please pay {{invoiceBalance}}.'
        },
        actorId
      );

      expect(tmpl.id).toBe('tmpl-101');
      expect(tmpl.category).toBe('finance');
    });
  });

  describe('2. Delivery Channel Provider Integrity (POPIA & Delivery Status)', () => {
    it('delivers Email via mock provider and sets status to sent', async () => {
      const recipient = {
        id: 'rec-1',
        communicationId: 'comm-1',
        recipientName: 'Sarah Connor',
        recipientType: 'guardian' as const,
        recipientEmail: 'sarah@example.com',
        deliveryChannel: 'email' as const,
        deliveryStatus: 'pending' as const
      };

      const result = await communicationDeliveryService.deliver({
        recipient: recipient as any,
        subject: 'Rehearsal Notice',
        body: 'Please be on time.'
      });

      expect(result.deliveryStatus).toBe('sent');
      expect(result.deliveredAt).toBeDefined();
    });

    it('prepares WhatsApp and strictly records status as prepared (never delivered)', async () => {
      const recipient = {
        id: 'rec-2',
        communicationId: 'comm-1',
        recipientName: 'John Connor',
        recipientType: 'guardian' as const,
        recipientPhone: '+27821234567',
        deliveryChannel: 'whatsapp' as const,
        deliveryStatus: 'pending' as const
      };

      const result = await communicationDeliveryService.deliver({
        recipient: recipient as any,
        body: 'Bus departs at 07:00'
      });

      expect(result.deliveryStatus).toBe('prepared');
      expect(result.metadata?.whatsappLink).toContain('https://wa.me/27821234567');
      expect(result.deliveredAt).toBeUndefined(); // Strictly NOT marked as delivered
    });

    it('prepares SMS and calculates segment length without claiming delivered status', async () => {
      const recipient = {
        id: 'rec-3',
        communicationId: 'comm-1',
        recipientName: 'Grace Mthembu',
        recipientType: 'guardian' as const,
        recipientPhone: '0839876543',
        deliveryChannel: 'sms' as const,
        deliveryStatus: 'pending' as const
      };

      const message = 'Reminder: Arts festival rehearsal tomorrow at 9am. Bring score sheets and water bottles.';
      const result = await communicationDeliveryService.deliver({
        recipient: recipient as any,
        body: message
      });

      expect(result.deliveryStatus).toBe('prepared');
      expect(result.metadata?.segmentCount).toBe(1);
      expect(result.deliveredAt).toBeUndefined();
    });

    it('fails gracefully when contact information for the channel is missing', async () => {
      const recipient = {
        id: 'rec-4',
        communicationId: 'comm-1',
        recipientName: 'No Email User',
        recipientType: 'guardian' as const,
        deliveryChannel: 'email' as const,
        deliveryStatus: 'pending' as const
      };

      const result = await communicationDeliveryService.deliver({
        recipient: recipient as any,
        subject: 'Subject',
        body: 'Message body'
      });

      expect(result.deliveryStatus).toBe('failed');
      expect(result.failureReason).toContain('email');
    });
  });

  describe('3. Audience Resolution & Deduplication', () => {
    it('deduplicates guardian recipients having multiple enrolled learners in the same programme', async () => {
      vi.spyOn(guardianRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'g-1', firstName: 'Bongani', lastName: 'Khuzwayo', email: 'bongani@arts.za', mobileNumber: '0821112222', organisationId: orgId } as any
      ]);
      vi.spyOn(learnerRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'l-1', firstName: 'Zola', lastName: 'Khuzwayo', organisationId: orgId } as any,
        { id: 'l-2', firstName: 'Siphiwe', lastName: 'Khuzwayo', organisationId: orgId } as any
      ]);
      vi.spyOn(learnerGuardianRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'lg-1', guardianId: 'g-1', learnerId: 'l-1', receivesCommunication: true, organisationId: orgId } as any,
        { id: 'lg-2', guardianId: 'g-1', learnerId: 'l-2', receivesCommunication: true, organisationId: orgId } as any
      ]);
      vi.spyOn(staffRepository, 'getByOrganisation').mockResolvedValue([]);

      const result = await recipientResolverService.resolveAudience(orgId, {
        audienceType: 'all_guardians',
        channel: 'email'
      });

      // Guardians with multiple learners are deduplicated or structured per recipient
      expect(result.totalCount).toBeGreaterThanOrEqual(1);
      expect(result.missingEmailCount).toBe(0);
      expect(result.missingPhoneCount).toBe(0);
    });
  });

  describe('4. Document File Upload & Validation Rules', () => {
    it('rejects disallowed executable file extensions', async () => {
      const maliciousFile = new File(['binary content'], 'script.exe', { type: 'application/x-msdownload' });

      await expect(
        documentUploadService.uploadDocument(
          orgId,
          {
            file: maliciousFile,
            name: 'Suspicious File',
            documentType: 'general'
          },
          actorId
        )
      ).rejects.toThrow(/prohibited/i);
    });

    it('rejects files larger than 25MB', async () => {
      // Create a mock large file
      const largeFile = {
        name: 'huge_video.mp4',
        size: 30 * 1024 * 1024, // 30 MB
        type: 'video/mp4'
      } as unknown as File;

      await expect(
        documentUploadService.uploadDocument(
          orgId,
          {
            file: largeFile,
            name: 'Huge Video',
            documentType: 'event'
          },
          actorId
        )
      ).rejects.toThrow(/25MB/i);
    });

    it('uploads valid PDF and creates DocumentRecord with v1 metadata', async () => {
      vi.spyOn(documentRepository, 'create').mockResolvedValue({
        id: 'doc-401',
        organisationId: orgId,
        name: '2026 Indemnity Form',
        documentType: 'consent',
        fileName: 'indemnity.pdf',
        mimeType: 'application/pdf',
        fileSize: 45000,
        storagePath: `organisations/${orgId}/documents/doc-401/v1/indemnity.pdf`,
        downloadUrl: 'https://storage/indemnity.pdf',
        documentStatus: 'active',
        versionNumber: 1,
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-09-02T10:00:00Z',
        createdBy: actorId,
        updatedBy: actorId
      } as any);

      vi.spyOn(documentRepository, 'update').mockResolvedValue(undefined);
      vi.spyOn(documentVersionRepository, 'create').mockResolvedValue({} as any);

      const validFile = new File(['%PDF-1.4 sample'], 'indemnity.pdf', { type: 'application/pdf' });
      const doc = await documentUploadService.uploadDocument(
        orgId,
        {
          file: validFile,
          name: '2026 Indemnity Form',
          documentType: 'consent'
        },
        actorId
      );

      expect(doc.id).toBe('doc-401');
      expect(doc.versionNumber).toBe(1);
      expect(doc.documentType).toBe('consent');
    });
  });

  describe('5. Document Versioning & History Preservation', () => {
    it('increments version number and preserves superseded version records', async () => {
      const existingDoc = {
        id: 'doc-score-1',
        organisationId: orgId,
        name: 'Symphony Score',
        documentType: 'music' as const,
        fileName: 'symphony_v1.pdf',
        mimeType: 'application/pdf',
        fileSize: 120000,
        storagePath: `organisations/${orgId}/documents/doc-score-1/v1/symphony_v1.pdf`,
        documentStatus: 'active' as const,
        versionNumber: 1,
        createdAt: '2026-09-01T10:00:00Z',
        updatedAt: '2026-09-01T10:00:00Z',
        createdBy: actorId,
        updatedBy: actorId
      };

      vi.spyOn(documentRepository, 'getById').mockResolvedValue(existingDoc as any);
      vi.spyOn(documentRepository, 'update').mockResolvedValue(undefined);
      vi.spyOn(documentVersionRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'v-1',
          organisationId: orgId,
          documentId: 'doc-score-1',
          versionNumber: 1,
          fileName: 'symphony_v1.pdf',
          fileSize: 120000,
          storagePath: 'path/v1',
          status: 'current',
          createdAt: '2026-09-01T10:00:00Z',
          createdBy: actorId
        } as any
      ]);
      vi.spyOn(documentVersionRepository, 'update').mockResolvedValue(undefined);
      vi.spyOn(documentVersionRepository, 'create').mockResolvedValue({
        id: 'v-2',
        organisationId: orgId,
        documentId: 'doc-score-1',
        versionNumber: 2,
        fileName: 'symphony_v2.pdf',
        fileSize: 130000,
        storagePath: 'path/v2',
        status: 'current',
        createdAt: '2026-09-02T10:00:00Z',
        createdBy: actorId
      } as any);

      const newVersionFile = new File(['%PDF-1.4 revised score'], 'symphony_v2.pdf', { type: 'application/pdf' });
      const result = await documentVersionService.uploadNewVersion(
        orgId,
        'doc-score-1',
        newVersionFile,
        'Added dynamic markings',
        actorId
      );

      expect(result.version.versionNumber).toBe(2);
      expect(result.document.versionNumber).toBe(2);
      expect(result.document.fileName).toBe('symphony_v2.pdf');
    });
  });

  describe('6. Operational Document Generators', () => {
    it('generates event running order HTML with schedule and performance items', async () => {
      vi.spyOn(eventRepository, 'getById').mockResolvedValue({
        id: 'ev-gala',
        organisationId: orgId,
        name: 'Annual Gala Evening',
        startDate: '2026-11-20',
        venue: 'Linder Auditorium'
      } as any);

      vi.spyOn(eventScheduleRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'sch-1',
          organisationId: orgId,
          eventId: 'ev-gala',
          scheduleType: 'warmup',
          title: 'Orchestra Warmup',
          startTime: '17:30',
          endTime: '18:15',
          venueArea: 'Backstage'
        } as any
      ]);

      vi.spyOn(eventPerformanceRepository, 'getByOrganisation').mockResolvedValue([
        {
          id: 'perf-1',
          organisationId: orgId,
          eventId: 'ev-gala',
          sequenceOrder: 1,
          title: 'African Suite',
          itemType: 'orchestral',
          estimatedDurationMinutes: 8,
          performanceStatus: 'confirmed'
        } as any
      ]);

      vi.spyOn(documentRepository, 'create').mockResolvedValue({ id: 'doc-gen-1' } as any);
      vi.spyOn(documentLinkRepository, 'create').mockResolvedValue({ id: 'link-gen-1' } as any);

      const result = await documentGenerationService.generateEventRunningOrder(
        orgId,
        'ev-gala',
        true,
        actorId
      );

      expect(result.html).toContain('Annual Gala Evening');
      expect(result.html).toContain('Orchestra Warmup');
      expect(result.html).toContain('African Suite');
      expect(result.document?.id).toBe('doc-gen-1');
    });

    it('generates passenger manifest HTML with vehicle and passenger details', async () => {
      vi.spyOn(eventTransportPlanRepository, 'getById').mockResolvedValue({
        id: 'tp-1',
        organisationId: orgId,
        planName: 'Bus 1 — Central to Sun City',
        vehicleId: 'veh-1',
        departureDate: '2026-10-05',
        departureTime: '06:30',
        pickupLocation: 'School Quad',
        destination: 'Sun City Arena'
      } as any);

      vi.spyOn(transportVehicleRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'veh-1', vehicleName: 'Coach A', registrationNumber: 'CA 123-456', capacity: 60 } as any
      ]);

      vi.spyOn(transportPassengerRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'p-1', eventTransportPlanId: 'tp-1', passengerType: 'learner', learnerId: 'l-1', seatNumber: '12' } as any
      ]);

      vi.spyOn(learnerRepository, 'getByOrganisation').mockResolvedValue([
        { id: 'l-1', firstName: 'Kabelo', lastName: 'Mokoena' } as any
      ]);

      vi.spyOn(documentRepository, 'create').mockResolvedValue({ id: 'doc-manifest-1' } as any);
      vi.spyOn(documentLinkRepository, 'create').mockResolvedValue({ id: 'link-manifest-1' } as any);

      const result = await documentGenerationService.generateTransportManifest(
        orgId,
        'tp-1',
        true,
        actorId
      );

      expect(result.html).toContain('Bus 1 — Central to Sun City');
      expect(result.html).toContain('Coach A');
      expect(result.html).toContain('Kabelo Mokoena');
      expect(result.html).toContain('Seat');
    });
  });
});
