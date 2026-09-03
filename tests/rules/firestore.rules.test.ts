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
      db.doc('users/admin-a').set(user('org-a', 'organisation_admin')),
      db.doc('users/admin-b').set(user('org-b', 'organisation_admin')),
      db.doc('users/teacher-a').set(user('org-a', 'teacher')),
      db.doc('users/finance-a').set(user('org-a', 'finance')),
      db.doc('users/viewer-a').set(user('org-a', 'viewer')),
      db.doc('users/guardian-a').set({ ...user('org-a', 'guardian'), guardianId: 'guardian-1' }),
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
});
