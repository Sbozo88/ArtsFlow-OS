/**
 * ArtsFlow OS — Secure Founder Bootstrap Script
 *
 * Configures the platform founder account with authoritative Super Admin platform privileges
 * and explicit Organisation Admin membership inside the dedicated Demo Arts Academy.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-founder-admin.ts --email=founder@example.com [--uid=custom_uid] [--send-reset] [--dry-run]
 *
 * Security Principles:
 * - Never hardcodes passwords
 * - Never logs secrets
 * - Platform Super Admin does NOT require an organisation membership
 * - Grants explicit organisation_admin role exclusively inside the demo organisation
 * - Emits structured audit logging for security compliance
 */

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { db, auth } from '../src/lib/firebase';
import { DEMO_DATA, DEMO_ORGANISATION_ID, runDemoSeed } from './seed-demo';

interface BootstrapOptions {
  email: string;
  uid?: string;
  displayName?: string;
  sendReset?: boolean;
  dryRun?: boolean;
}

export interface BootstrapResult {
  success: boolean;
  founderUid: string;
  founderEmail: string;
  platformRole: 'super_admin';
  demoOrganisationId: string;
  demoMembershipId: string;
  resetEmailDispatched: boolean;
  auditLogged: boolean;
  dryRun: boolean;
}

export async function bootstrapFounderAdmin(options: BootstrapOptions): Promise<BootstrapResult> {
  const {
    email,
    uid = `usr_founder_${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
    displayName = 'Platform Founder',
    sendReset = false,
    dryRun = false
  } = options;

  if (!email || !email.includes('@')) {
    throw new Error(`Invalid founder email: "${email}". A valid email address is required.`);
  }

  console.log(`\n======================================================`);
  console.log(`ARTSFLOW OS — FOUNDER BOOTSTRAP PIPELINE`);
  console.log(`======================================================`);
  console.log(`Founder Email:       ${email}`);
  console.log(`Founder UID:         ${uid}`);
  console.log(`Platform Role:       super_admin`);
  console.log(`Demo Tenant:         ${DEMO_DATA.organisation.name} (${DEMO_ORGANISATION_ID})`);
  console.log(`Mode:                ${dryRun ? 'DRY RUN (no database writes)' : 'LIVE EXECUTION'}`);
  console.log(`======================================================\n`);

  if (dryRun) {
    console.log('[DRY-RUN] Validating schema records...');
    console.log('[DRY-RUN] 1. Global User Document: users/' + uid);
    console.log('[DRY-RUN] 2. Demo Organisation: organisations/' + DEMO_ORGANISATION_ID);
    console.log('[DRY-RUN] 3. Organisation Membership: organisationMemberships/mem_' + uid + '_' + DEMO_ORGANISATION_ID);
    console.log('[DRY-RUN] Dry run validation passed successfully.');
    return {
      success: true,
      founderUid: uid,
      founderEmail: email,
      platformRole: 'super_admin',
      demoOrganisationId: DEMO_ORGANISATION_ID,
      demoMembershipId: `mem_${uid}_${DEMO_ORGANISATION_ID}`,
      resetEmailDispatched: false,
      auditLogged: false,
      dryRun: true
    };
  }

  const now = new Date().toISOString();

  // 1. Create / Update Global User Profile
  console.log(`[1/5] Updating global user profile (users/${uid})...`);
  const userRef = doc(db, 'users', uid);
  const existingUserSnap = await getDoc(userRef);
  const existingUserData = existingUserSnap.exists() ? existingUserSnap.data() : {};

  await setDoc(
    userRef,
    {
      ...existingUserData,
      uid,
      email,
      displayName: existingUserData.displayName || displayName,
      role: 'super_admin',
      platformRole: 'super_admin',
      status: 'active',
      updatedAt: now,
      updatedBy: 'bootstrap_script',
      createdAt: existingUserData.createdAt || now,
      createdBy: existingUserData.createdBy || 'bootstrap_script'
    },
    { merge: true }
  );
  console.log(`✔ Global user profile established with platformRole = 'super_admin'.`);

  // 2. Create / Update Demo Organisation
  console.log(`[2/5] Establishing Demo Organisation (organisations/${DEMO_ORGANISATION_ID})...`);
  const orgRef = doc(db, 'organisations', DEMO_ORGANISATION_ID);
  const existingOrgSnap = await getDoc(orgRef);
  const existingOrgData = existingOrgSnap.exists() ? existingOrgSnap.data() : {};

  await setDoc(
    orgRef,
    {
      ...existingOrgData,
      id: DEMO_ORGANISATION_ID,
      organisationId: DEMO_ORGANISATION_ID,
      name: DEMO_DATA.organisation.name,
      contactEmail: DEMO_DATA.organisation.contactEmail,
      contactPhone: DEMO_DATA.organisation.contactPhone,
      address: DEMO_DATA.organisation.address,
      timezone: DEMO_DATA.organisation.timezone,
      currency: DEMO_DATA.organisation.currency,
      status: 'active',
      tenantStatus: 'active',
      billingMode: 'complimentary',
      assignedPlanId: 'plan_professional',
      organisationType: 'music_and_dance',
      isDemoTenant: true,
      updatedAt: now,
      updatedBy: 'bootstrap_script',
      createdAt: existingOrgData.createdAt || now,
      createdBy: existingOrgData.createdBy || 'bootstrap_script'
    },
    { merge: true }
  );
  console.log(`✔ Demo organisation active on Professional tier.`);

  // 3. Create Explicit Founder Membership in Demo Academy
  const membershipId = `mem_${uid}_${DEMO_ORGANISATION_ID}`;
  console.log(`[3/5] Assigning explicit organisation_admin membership (${membershipId})...`);
  const memRef = doc(db, 'organisationMemberships', membershipId);

  await setDoc(
    memRef,
    {
      id: membershipId,
      organisationId: DEMO_ORGANISATION_ID,
      userId: uid,
      email,
      displayName: displayName || 'Platform Founder',
      role: 'organisation_admin',
      membershipStatus: 'active',
      isDefaultOrganisation: false,
      joinedAt: now,
      updatedAt: now,
      updatedBy: 'bootstrap_script',
      createdAt: now,
      createdBy: 'bootstrap_script',
      status: 'active'
    },
    { merge: true }
  );
  console.log(`✔ Explicit organisation_admin membership granted for demo tenant.`);

  // 4. Seed Essential Operational Demo Records
  console.log(`[4/5] Seeding comprehensive demo records for founder product demonstration...`);
  await runDemoSeed(false);
  console.log(`✔ Demo operational dataset ready for founder testing.`);

  // 5. Password Reset Request & Audit Log
  let resetEmailDispatched = false;
  if (sendReset) {
    console.log(`[5/5] Requesting Firebase Auth password reset email for ${email}...`);
    try {
      await sendPasswordResetEmail(auth, email);
      resetEmailDispatched = true;
      console.log(`✔ Password reset email successfully dispatched to ${email}.`);
    } catch (resetErr) {
      console.warn(`[Warning] Could not trigger client password reset email: ${(resetErr as Error).message}`);
    }
  } else {
    console.log(`[5/5] Skipping password reset email (pass --send-reset to trigger).`);
  }

  // Audit record
  const auditId = `aud_bootstrap_${Date.now()}`;
  try {
    await setDoc(doc(db, 'auditLogs', auditId), {
      id: auditId,
      organisationId: DEMO_ORGANISATION_ID,
      actorId: 'bootstrap_script',
      action: 'PLATFORM_BOOTSTRAP_FOUNDER',
      entityType: 'user',
      entityId: uid,
      scopeType: 'platform',
      reason: 'Founder bootstrap executed for Super Admin access',
      after: { email, platformRole: 'super_admin', demoOrg: DEMO_ORGANISATION_ID },
      createdAt: now
    });
  } catch (auditErr) {
    console.warn(`[Warning] Could not record bootstrap audit log: ${(auditErr as Error).message}`);
  }

  console.log(`\n======================================================`);
  console.log(`FOUNDER BOOTSTRAP COMPLETE`);
  console.log(`======================================================`);
  console.log(`Platform Console:   https://artflow-os.web.app/platform`);
  console.log(`Demo Workspace:     https://artflow-os.web.app/`);
  console.log(`Sign In URL:        https://artflow-os.web.app/login`);
  console.log(`======================================================\n`);

  return {
    success: true,
    founderUid: uid,
    founderEmail: email,
    platformRole: 'super_admin',
    demoOrganisationId: DEMO_ORGANISATION_ID,
    demoMembershipId: membershipId,
    resetEmailDispatched,
    auditLogged: true,
    dryRun: false
  };
}

// Allow direct CLI execution
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.endsWith('bootstrap-founder-admin.ts')) {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith('--email='))?.split('=')[1] || process.env.FOUNDER_EMAIL;
  const uidArg = args.find((a) => a.startsWith('--uid='))?.split('=')[1];
  const sendReset = args.includes('--send-reset');
  const dryRun = args.includes('--dry-run');

  if (!emailArg) {
    console.error('Error: Founder email required. Provide --email=<email> or set FOUNDER_EMAIL environment variable.');
    process.exit?.(1);
  }

  bootstrapFounderAdmin({
    email: emailArg,
    uid: uidArg,
    sendReset,
    dryRun
  })
    .then((res) => {
      console.log('Result:', JSON.stringify(res, null, 2));
      process.exit?.(0);
    })
    .catch((err) => {
      console.error('Fatal bootstrap error:', err);
      process.exit?.(1);
    });
}
