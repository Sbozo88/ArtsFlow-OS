import { readFile } from 'node:fs/promises';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'demo-artflow-os';
const NOW = '2026-09-03T10:00:00.000Z';

let testEnv: RulesTestEnvironment;

const OPERATIONAL_COLLECTIONS = [
  'learners', 'guardians', 'learnerGuardians', 'staff', 'programmes',
  'programmeGroups', 'enrolments', 'followUps', 'instruments',
  'instrumentAllocations', 'repertoire', 'sessionRepertoire', 'practiceLogs',
  'musicAssessments', 'danceLevels', 'choreography', 'sessionChoreography',
  'dancePracticeLogs', 'danceAssessments', 'costumes', 'costumeAllocations',
  'sessions', 'attendance', 'events', 'eventGroups', 'eventParticipants',
  'eventStaff', 'eventScheduleItems', 'eventPerformanceItems', 'eventAttendance',
  'consentTemplates', 'consentRequests', 'consentSubmissions',
  'transportProviders', 'transportVehicles', 'eventTransportPlans',
  'transportPassengers', 'chargeTypes', 'charges', 'invoices',
  'invoiceLineItems', 'payments', 'paymentAllocations', 'financeAdjustments',
  'communications', 'communicationRecipients', 'communicationTemplates',
  'communicationAttachments', 'documents', 'documentVersions',
  'documentTemplates', 'documentLinks', 'operationalAlerts', 'automationRules',
  'automationExecutions', 'notifications', 'notificationPreferences',
  'staffAssignments', 'staffAvailability', 'staffWorkRecords', 'timesheets',
  'timesheetEntries', 'staffSubstitutions', 'organisationCalendarPeriods',
  'organisationInvitations', 'organisationMemberships', 'guardianPortalAccess',
  'guardianInvitations', 'learnerPortalAccess', 'learnerInvitations',
  'portalChangeRequests',
] as const;

const user = (organisationId: string, role: string) => ({
  email: `${role}@example.test`,
  organisationId,
  role,
  status: 'active',
});

const record = (id: string, organisationId: string, actorId: string, extra = {}) => ({
  id,
  organisationId,
  createdAt: NOW,
  updatedAt: NOW,
  createdBy: actorId,
  updatedBy: actorId,
  status: 'active',
  ...extra,
});

async function seed() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      db.doc('users/super-admin').set({ email: 'super@test.org', role: 'super_admin', status: 'active' }),
      db.doc('users/admin-a').set(user('org-a', 'organisation_admin')),
      db.doc('users/admin-b').set(user('org-b', 'organisation_admin')),
      db.doc('users/teacher-a').set(user('org-a', 'teacher')),
      db.doc('users/finance-a').set(user('org-a', 'finance')),
      db.doc('users/viewer-a').set(user('org-a', 'viewer')),
      db.doc('users/guardian-a').set({ ...user('org-a', 'guardian'), guardianId: 'guardian-1' }),
      db.doc('users/disabled-a').set({ ...user('org-a', 'teacher'), status: 'disabled' }),
      db.doc('learners/learner-a').set(record('learner-a', 'org-a', 'admin-a', { firstName: 'A' })),
      db.doc('learners/learner-b').set(record('learner-b', 'org-b', 'admin-b', { firstName: 'B' })),
      db.doc('invoices/invoice-a').set(record('invoice-a', 'org-a', 'admin-a', { total: 100 })),
      db.doc('attendance/attendance-a').set(record('attendance-a', 'org-a', 'admin-a', { learnerId: 'learner-a' })),
      db.doc('events/event-a').set(record('event-a', 'org-a', 'admin-a', { name: 'Event A' })),
    ]);
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore tenant and authority boundaries', () => {
  it('denies unauthenticated reads', async () => {
    await seed();
    await assertFails(testEnv.unauthenticatedContext().firestore().doc('learners/learner-a').get());
  });

  it('allows an internal user to read only their organisation', async () => {
    await seed();
    const db = testEnv.authenticatedContext('admin-a').firestore();
    await assertSucceeds(db.doc('learners/learner-a').get());
    await assertFails(db.doc('learners/learner-b').get());
  });

  it('blocks cross-tenant reads across every operational collection', async () => {
    await seed();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await Promise.all(OPERATIONAL_COLLECTIONS.map((name) =>
        db.doc(`${name}/${name}-org-b`).set(record(`${name}-org-b`, 'org-b', 'admin-b')),
      ));
    });

    const db = testEnv.authenticatedContext('admin-a').firestore();
    for (const name of OPERATIONAL_COLLECTIONS) {
      await assertFails(db.doc(`${name}/${name}-org-b`).get());
    }
  });

  it('blocks disabled identities immediately', async () => {
    await seed();
    const db = testEnv.authenticatedContext('disabled-a').firestore();
    await assertFails(db.doc('learners/learner-a').get());
    await assertFails(db.doc('attendance/attendance-a').get());
  });

  it('requires tenant-scoped collection queries', async () => {
    await seed();
    const db = testEnv.authenticatedContext('viewer-a').firestore();
    await assertSucceeds(db.collection('learners').where('organisationId', '==', 'org-a').get());
    await assertFails(db.collection('learners').get());
    await assertFails(db.collection('learners').where('organisationId', '==', 'org-b').get());
  });

  it('prevents a user from escalating their role or changing tenant', async () => {
    await seed();
    const ownProfile = testEnv.authenticatedContext('teacher-a').firestore().doc('users/teacher-a');
    await assertFails(ownProfile.update({ role: 'organisation_admin' }));
    await assertFails(ownProfile.update({ organisationId: 'org-b' }));
    await assertSucceeds(ownProfile.update({ displayName: 'Updated Name' }));
  });

  it('allows tenant admins to manage safe roles but not cross-tenant or super-admin authority', async () => {
    await seed();
    const db = testEnv.authenticatedContext('admin-a').firestore();

    await assertSucceeds(db.doc('users/teacher-a').update({ role: 'viewer' }));
    await assertSucceeds(db.doc('users/teacher-a').update({ status: 'disabled' }));
    await assertFails(db.doc('users/teacher-a').update({ role: 'super_admin' }));
    await assertFails(db.doc('users/admin-b').update({ role: 'viewer' }));
    await assertFails(db.doc('users/teacher-a').update({ organisationId: 'org-b' }));
  });

  it('enforces permission groups for writes', async () => {
    await seed();
    const teacherDb = testEnv.authenticatedContext('teacher-a').firestore();
    const financeDb = testEnv.authenticatedContext('finance-a').firestore();

    await assertFails(teacherDb.doc('learners/new-learner').set(
      record('new-learner', 'org-a', 'teacher-a', { firstName: 'No' }),
    ));
    await assertSucceeds(teacherDb.doc('attendance/attendance-1').set(
      record('attendance-1', 'org-a', 'teacher-a', { learnerId: 'learner-a' }),
    ));
    await assertSucceeds(financeDb.doc('invoices/invoice-2').set(
      record('invoice-2', 'org-a', 'finance-a', { total: 250 }),
    ));
    await assertFails(financeDb.doc('attendance/attendance-2').set(
      record('attendance-2', 'org-a', 'finance-a', { learnerId: 'learner-a' }),
    ));
  });

  it('enforces permission groups for sensitive reads', async () => {
    await seed();
    const teacherDb = testEnv.authenticatedContext('teacher-a').firestore();
    const financeDb = testEnv.authenticatedContext('finance-a').firestore();

    await assertFails(teacherDb.doc('invoices/invoice-a').get());
    await assertFails(financeDb.doc('attendance/attendance-a').get());
    await assertFails(financeDb.doc('events/event-a').get());
  });

  it('denies broad internal collections to guardian identities', async () => {
    await seed();
    const db = testEnv.authenticatedContext('guardian-a').firestore();
    await assertFails(db.doc('learners/learner-a').get());
    await assertFails(db.doc('invoices/invoice-a').get());
  });

  it('protects finance counters from collisions and arbitrary mutation', async () => {
    await seed();
    const financeDb = testEnv.authenticatedContext('finance-a').firestore();
    const teacherDb = testEnv.authenticatedContext('teacher-a').firestore();
    const counter = financeDb.doc('invoiceCounters/org-a_2026');

    await assertSucceeds(counter.set({
      organisationId: 'org-a',
      year: 2026,
      currentSequence: 1,
      updatedAt: NOW,
    }));
    await assertSucceeds(counter.update({ currentSequence: 2, updatedAt: NOW }));
    await assertFails(counter.update({ currentSequence: 10, updatedAt: NOW }));
    await assertFails(teacherDb.doc('invoiceCounters/org-a_2027').set({
      organisationId: 'org-a',
      year: 2027,
      currentSequence: 1,
      updatedAt: NOW,
    }));
  });

  it('rejects tenant reassignment and malformed base records', async () => {
    await seed();
    const db = testEnv.authenticatedContext('admin-a').firestore();
    await assertFails(db.doc('learners/learner-a').update({
      organisationId: 'org-b',
      updatedAt: NOW,
      updatedBy: 'admin-a',
    }));
    await assertFails(db.doc('learners/malformed').set({
      id: 'malformed',
      organisationId: 'org-a',
      firstName: 'Missing audit fields',
    }));
  });

  it('permits only deterministic first-run organisation bootstrap', async () => {
    const uid = 'new-owner';
    const db = testEnv.authenticatedContext(uid, { email: 'owner@example.test' }).firestore();
    const orgId = `org_${uid}`;

    await assertFails(db.doc('organisations/arbitrary-org').set(
      record('arbitrary-org', 'arbitrary-org', uid, { name: 'Wrong', organisationType: 'School' }),
    ));
    await assertSucceeds(db.doc(`organisations/${orgId}`).set(
      record(orgId, orgId, uid, { name: 'New Arts School', organisationType: 'School' }),
    ));
    await assertFails(db.doc(`users/${uid}`).set({
      email: 'owner@example.test',
      organisationId: orgId,
      role: 'super_admin',
    }));
    await assertSucceeds(db.doc(`users/${uid}`).set({
      email: 'owner@example.test',
      organisationId: orgId,
      role: 'organisation_admin',
      status: 'active',
    }));
  });

  it('enforces tenant isolation and anti-escalation on organisationMemberships', async () => {
    await seed();
    const adminADb = testEnv.authenticatedContext('admin-a').firestore();
    const teacherADb = testEnv.authenticatedContext('teacher-a').firestore();
    const adminBDb = testEnv.authenticatedContext('admin-b').firestore();

    // Admin A can create membership in org-a
    await assertSucceeds(adminADb.doc('organisationMemberships/mem-teacher-a').set(
      record('mem-teacher-a', 'org-a', 'admin-a', {
        userId: 'teacher-a',
        email: 'teacher@a.test',
        role: 'teacher',
        membershipStatus: 'active',
        isDefaultOrganisation: true,
        joinedAt: NOW,
      })
    ));

    // Anti-escalation: Admin A CANNOT create membership with role super_admin
    await assertFails(adminADb.doc('organisationMemberships/mem-escalation').set(
      record('mem-escalation', 'org-a', 'admin-a', {
        userId: 'admin-a',
        email: 'admin@a.test',
        role: 'super_admin',
        membershipStatus: 'active',
        joinedAt: NOW,
      })
    ));

    // Cross-tenant write: Admin A CANNOT create membership for org-b
    await assertFails(adminADb.doc('organisationMemberships/mem-cross-org').set(
      record('mem-cross-org', 'org-b', 'admin-a', {
        userId: 'teacher-a',
        email: 'teacher@a.test',
        role: 'teacher',
        membershipStatus: 'active',
        joinedAt: NOW,
      })
    ));

    // User can read their own membership
    await assertSucceeds(teacherADb.doc('organisationMemberships/mem-teacher-a').get());

    // Cross-tenant read: Admin B cannot read org-a membership
    await assertFails(adminBDb.doc('organisationMemberships/mem-teacher-a').get());
  });

  it('enforces platform super_admin boundary on organisation directory', async () => {
    await seed();
    const superAdminDb = testEnv.authenticatedContext('super-admin').firestore();
    const orgAdminDb = testEnv.authenticatedContext('admin-a').firestore();

    // Super admin can list all organisations
    await assertSucceeds(superAdminDb.collection('organisations').get());

    // Organisation admin CANNOT list all organisations across the platform
    await assertFails(orgAdminDb.collection('organisations').get());
  });

  it('enforces platform security and tenant isolation on founder notes and customer feedback', async () => {
    await seed();
    const superAdminDb = testEnv.authenticatedContext('super-admin').firestore();
    const adminADb = testEnv.authenticatedContext('admin-a').firestore();
    const adminBDb = testEnv.authenticatedContext('admin-b').firestore();

    // 1. Founder Notes: Super admin only
    await assertSucceeds(
      superAdminDb.doc('platformCustomerNotes/note-1').set(
        record('note-1', 'org-a', 'super-admin', {
          authorId: 'super-admin',
          authorName: 'Platform Lead',
          content: 'Founding Partner interview notes',
          category: 'commercial',
        })
      )
    );
    await assertSucceeds(superAdminDb.doc('platformCustomerNotes/note-1').get());

    // School admin cannot read or write founder notes
    await assertFails(adminADb.doc('platformCustomerNotes/note-1').get());
    await assertFails(
      adminADb.doc('platformCustomerNotes/note-2').set(
        record('note-2', 'org-a', 'admin-a', {
          authorId: 'admin-a',
          authorName: 'School Admin',
          content: 'Attempted note creation',
          category: 'general',
        })
      )
    );

    // 2. Customer Feedback: Tenant submit and isolation
    // Admin A can submit feedback for org-a
    await assertSucceeds(
      adminADb.doc('customerFeedback/fb-1').set(
        record('fb-1', 'org-a', 'admin-a', {
          submittedBy: 'admin-a',
          category: 'music',
          rating: 5,
          comment: 'Excellent music features',
          status: 'new',
        })
      )
    );

    // Cross-tenant write: Admin A CANNOT submit feedback for org-b
    await assertFails(
      adminADb.doc('customerFeedback/fb-cross').set(
        record('fb-cross', 'org-b', 'admin-a', {
          submittedBy: 'admin-a',
          category: 'dance',
          rating: 4,
          comment: 'Cross tenant attempt',
          status: 'new',
        })
      )
    );

    // Tenant read: Admin A can read org-a feedback
    await assertSucceeds(adminADb.doc('customerFeedback/fb-1').get());

    // Cross-tenant read: Admin B CANNOT read org-a feedback
    await assertFails(adminBDb.doc('customerFeedback/fb-1').get());

    // Platform Super Admin can read all feedback
    await assertSucceeds(superAdminDb.doc('customerFeedback/fb-1').get());

    // Tenant Admin CANNOT update feedback status (only Super Admin can review/plan/resolve)
    await assertFails(adminADb.doc('customerFeedback/fb-1').update({ status: 'resolved' }));
    await assertSucceeds(superAdminDb.doc('customerFeedback/fb-1').update({ status: 'reviewed' }));
  });
});
