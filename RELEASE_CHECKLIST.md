# ArtsFlow OS — Release Checklist (v1.0.0-rc.1)

This file records evidence, not aspirations. A box may be checked only after the stated command or operational review has completed for the release commit.

## 1. Automated quality gate

- [x] `npm run typecheck`
- [x] `npm run lint` with no errors (four non-blocking Fast Refresh warnings remain)
- [x] `npm test` — 229 passing tests
- [x] `npm run test:rules` — 17 passing Firestore/Storage emulator tests
- [x] `npm run build` (large bundle warning recorded)
- [x] `npm audit --omit=dev` — zero production vulnerabilities

## 2. Security gate

- [x] Firestore and Storage use deny-by-default rules.
- [x] Emulator tests reject unauthenticated, cross-tenant, role-escalation, unsafe upload, and unscoped-query attacks.
- [x] User `role` and `organisationId` authority fields cannot be changed by the client.
- [x] Learner and guardian identities cannot enter internal administration routes.
- [x] Guardian routes and invitations are release-disabled until relationship-scoped server enforcement and tests exist.
- [x] Production Firestore Rules dry-run compiled successfully against project `artflow-os`.

## 3. Operational truthfulness

- [x] Unconfigured providers and webhooks are reported as not configured.
- [x] The application does not fabricate backup timestamps or successful storage uploads.
- [x] Demo seed and baseline migration fail closed when live writers are unavailable.
- [x] Organisation queries have a bounded result limit.
- [ ] Managed Firestore backup policy configured and a non-production restore tested.
- [ ] Production monitoring/alert ownership recorded.

## 4. Deployment gate

- [x] `npm run release:firebase` targets only Hosting and Firestore on the explicit `artflow-os` project.
- [ ] Firebase Storage is provisioned; until then, Storage deploy and document uploads remain unavailable/fail closed.
- [x] CI includes Firebase Rules emulator tests.
- [ ] GitHub production environment contains `FIREBASE_SERVICE_ACCOUNT_ARTFLOW_OS` with least-privilege credentials.
- [ ] Branch protection requires validation CI before merge to `main`.
- [ ] Release commit is clean, reviewed, and pushed without unrelated files.

## 5. Post-deployment smoke test

- [ ] Hosting root and a deep SPA route return HTTP 200.
- [ ] Administrator login and dashboard load without console errors.
- [ ] Same-tenant learner read/write succeeds for an authorised role.
- [ ] Cross-tenant and unauthorised role operations fail.
- [ ] Firestore and Storage production rules match the release commit.
- [ ] Guardian routes remain disabled or access-tested until the relationship-scoped backend gate passes.
- [ ] Rollback target and previous Hosting release ID recorded.

## Deferred, not part of v1.0

- Learner self-service portal
- SaaS subscriptions, billing, trials, entitlements, and customer provisioning
- Payment-provider and inbound webhook runtimes

Only after this v1.0 checklist is complete may the v1.1 roadmap begin with SaaS 1A, the tenancy and commercial architecture audit.
