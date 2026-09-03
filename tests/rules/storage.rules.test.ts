import { readFile } from 'node:fs/promises';
import { afterAll, afterEach, beforeAll, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'demo-artflow-os';
const BUCKET = `gs://${PROJECT_ID}.appspot.com`;

let testEnv: RulesTestEnvironment;

async function seedUsers() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await Promise.all([
      db.doc('users/admin-a').set({ organisationId: 'org-a', role: 'organisation_admin' }),
      db.doc('users/teacher-a').set({ organisationId: 'org-a', role: 'teacher' }),
      db.doc('users/finance-a').set({ organisationId: 'org-a', role: 'finance' }),
      db.doc('users/admin-b').set({ organisationId: 'org-b', role: 'organisation_admin' }),
      db.doc('users/guardian-a').set({ organisationId: 'org-a', role: 'guardian' }),
    ]);
  });
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
    storage: { rules: await readFile('storage.rules', 'utf8') },
  });
});

afterEach(async () => {
  await Promise.all([testEnv.clearFirestore(), testEnv.clearStorage()]);
});

afterAll(async () => {
  await testEnv.cleanup();
});

function file(uid: string, path: string) {
  return testEnv.authenticatedContext(uid).storage(BUCKET).ref(path);
}

describe('Storage tenant, role, path, and content boundaries', () => {
  it('allows approved document uploads only inside the caller tenant', async () => {
    await seedUsers();
    const sameTenant = file('teacher-a', 'organisations/org-a/documents/doc-1/v1/score.pdf');
    const otherTenant = file('teacher-a', 'organisations/org-b/documents/doc-1/v1/score.pdf');

    await assertSucceeds(sameTenant.putString('pdf-data', 'raw', { contentType: 'application/pdf' }));
    await assertFails(otherTenant.putString('pdf-data', 'raw', { contentType: 'application/pdf' }));
  });

  it('denies unsafe types, unsupported paths, and non-document roles', async () => {
    await seedUsers();
    await assertFails(file('admin-a', 'organisations/org-a/documents/doc-1/v1/run.html')
      .putString('<script />', 'raw', { contentType: 'text/html' }));
    await assertFails(file('admin-a', 'organisations/org-a/temp/unmanaged.pdf')
      .putString('data', 'raw', { contentType: 'application/pdf' }));
    await assertFails(file('finance-a', 'organisations/org-a/documents/doc-1/v1/finance.pdf')
      .putString('data', 'raw', { contentType: 'application/pdf' }));
    await assertFails(file('guardian-a', 'organisations/org-a/documents/doc-1/v1/guardian.pdf')
      .putString('data', 'raw', { contentType: 'application/pdf' }));
  });

  it('keeps stored objects private and tenant-scoped', async () => {
    await seedUsers();
    const path = 'organisations/org-a/documents/doc-1/v1/private.pdf';
    await assertSucceeds(file('admin-a', path)
      .putString('private', 'raw', { contentType: 'application/pdf' }));
    await assertSucceeds(file('teacher-a', path).getMetadata());
    await assertFails(file('admin-b', path).getMetadata());
    await assertFails(testEnv.unauthenticatedContext().storage(BUCKET).ref(path).getMetadata());
  });

  it('limits branding writes to administrators and safe images', async () => {
    await seedUsers();
    const path = 'organisations/org-a/branding/logo.png';
    await assertFails(file('teacher-a', path)
      .putString('image', 'raw', { contentType: 'image/png' }));
    await assertSucceeds(file('admin-a', path)
      .putString('image', 'raw', { contentType: 'image/png' }));
  });

  it('keeps generated exports private to tenant administrators', async () => {
    await seedUsers();
    const path = 'organisations/org-a/exports/export-2026.json';
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.storage(BUCKET).ref(path)
        .putString('{}', 'raw', { contentType: 'application/json' });
    });

    await assertSucceeds(file('admin-a', path).getMetadata());
    await assertFails(file('teacher-a', path).getMetadata());
    await assertFails(file('admin-b', path).getMetadata());
  });
});
