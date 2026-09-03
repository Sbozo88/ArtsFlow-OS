import type { SubscriptionPlan, PlanEntitlement } from '../types';
import { STANDARD_PLATFORM_FEATURES } from './platformFeaturesRegistry';
import { getPlanEntitlementDocId } from '../repositories/planEntitlementRepository';

export interface PlanDefinition {
  plan: Omit<SubscriptionPlan, 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | 'status'>;
  entitlements: Record<string, boolean | { enabled: boolean; limitValue?: number | null; configuration?: Record<string, unknown> }>;
}

export const STANDARD_PLANS: PlanDefinition[] = [
  // 1. Legacy Full Access Plan (Internal compatibility for v1.0 organisations)
  {
    plan: {
      id: 'plan_legacy_full',
      name: 'Legacy Full Access',
      code: 'legacy_full',
      description: 'Preserves complete v1.0 functionality for established tenants during migration.',
      planStatus: 'active',
      displayOrder: 0,
      isPublic: false,
      recommended: false
    },
    entitlements: STANDARD_PLATFORM_FEATURES.reduce<Record<string, { enabled: boolean; limitValue: null }>>((acc, f) => {
      // Exclude experimental features
      acc[f.key] = {
        enabled: f.featureStatus !== 'experimental',
        limitValue: null
      };
      return acc;
    }, {})
  },

  // 2. Starter Plan
  {
    plan: {
      id: 'plan_starter',
      name: 'ArtsFlow Starter',
      code: 'starter',
      description: 'Essential student administration, group classes, attendance, music & dance tracking, core finance, and guardian portal.',
      planStatus: 'active',
      displayOrder: 1,
      isPublic: true,
      recommended: false
    },
    entitlements: {
      // Core
      'core.learners': true,
      'core.guardians': true,
      'core.staff': true,
      'core.programmes': true,
      'core.groups': true,
      'core.attendance': true,
      'communication.core': true,
      'documents.core': true,
      'guardian_portal': true,
      // Music (Standard on all plans — ArtsFlow identity)
      'music.core': true,
      'music.instruments': true,
      'music.repertoire': true,
      'music.practice': true,
      'music.assessments': true,
      // Dance (Standard on all plans — ArtsFlow identity)
      'dance.core': true,
      'dance.choreography': true,
      'dance.practice': true,
      'dance.assessments': true,
      'dance.costumes': true,
      // Core Finance
      'finance.core': true,
      'finance.reporting': false,
      // Analytics & Automation
      'analytics.core': true,
      'analytics.advanced': false,
      'automation.core': false,
      // Staff Ops & Events (Professional Boundaries)
      'events.core': false,
      'events.transport': false,
      'events.consent': false,
      'staff_operations.core': false,
      // Numeric Limits
      'limits.learners': { enabled: true, limitValue: 100 },
      'limits.staff_users': { enabled: true, limitValue: 10 },
      'limits.storage_mb': { enabled: true, limitValue: 5000 }, // 5 GB
      'limits.monthly_communications': { enabled: true, limitValue: 200 },
      'limits.automation_runs': { enabled: false, limitValue: 0 }
    }
  },

  // 3. Professional Plan (Most Popular / Recommended)
  {
    plan: {
      id: 'plan_professional',
      name: 'ArtsFlow Professional',
      code: 'professional',
      description: 'Run your complete arts operation with Events, Transport, Consent, Staff Timesheets, Advanced Analytics, and Automation.',
      planStatus: 'active',
      displayOrder: 2,
      isPublic: true,
      recommended: true
    },
    entitlements: {
      // Core
      'core.learners': true,
      'core.guardians': true,
      'core.staff': true,
      'core.programmes': true,
      'core.groups': true,
      'core.attendance': true,
      // Music
      'music.core': true,
      'music.instruments': true,
      'music.repertoire': true,
      'music.practice': true,
      'music.assessments': true,
      // Dance
      'dance.core': true,
      'dance.choreography': true,
      'dance.practice': true,
      'dance.assessments': true,
      'dance.costumes': true,
      // Events, Transport & Consent
      'events.core': true,
      'events.transport': true,
      'events.consent': true,
      // Finance & Reporting
      'finance.core': true,
      'finance.reporting': true,
      // Staff Operations
      'staff_operations.core': true,
      // Communications & Portals
      'communication.core': true,
      'documents.core': true,
      'guardian_portal': true,
      // Analytics & Automation
      'analytics.core': true,
      'analytics.advanced': true,
      'automation.core': true,
      // Numeric Limits
      'limits.learners': { enabled: true, limitValue: 500 },
      'limits.staff_users': { enabled: true, limitValue: 50 },
      'limits.storage_mb': { enabled: true, limitValue: 25000 }, // 25 GB
      'limits.monthly_communications': { enabled: true, limitValue: 2000 },
      'limits.automation_runs': { enabled: true, limitValue: 1000 }
    }
  },

  // 4. Premium Plan (Internal / Custom non-public compatibility tier)
  {
    plan: {
      id: 'plan_premium',
      name: 'Premium',
      code: 'premium',
      description: 'Advanced workflow automation, financial reporting, and integrations for scaling arts organisations.',
      planStatus: 'active',
      displayOrder: 3,
      isPublic: false,
      recommended: false
    },
    entitlements: {
      // Professional features included
      'core.learners': true,
      'core.guardians': true,
      'core.staff': true,
      'core.programmes': true,
      'core.groups': true,
      'core.attendance': true,
      'music.core': true,
      'music.instruments': true,
      'music.repertoire': true,
      'music.practice': true,
      'music.assessments': true,
      'dance.core': true,
      'dance.choreography': true,
      'dance.practice': true,
      'dance.assessments': true,
      'dance.costumes': true,
      'events.core': true,
      'events.transport': true,
      'events.consent': true,
      'finance.core': true,
      'finance.reporting': true,
      'staff_operations.core': true,
      'communication.core': true,
      'documents.core': true,
      'analytics.core': true,
      'analytics.advanced': true,
      'automation.core': true,
      'guardian_portal': true,
      'integrations.email': true,
      'integrations.sms': true,
      'integrations.calendar': true,
      'platform.advanced_exports': true,
      // Limits
      'limits.learners': { enabled: true, limitValue: 1000 },
      'limits.staff_users': { enabled: true, limitValue: 50 },
      'limits.storage_mb': { enabled: true, limitValue: 20000 },
      'limits.monthly_communications': { enabled: true, limitValue: 5000 },
      'limits.automation_runs': { enabled: true, limitValue: 500 }
    }
  },

  // 5. Enterprise Plan (Internal / Dedicated tier)
  {
    plan: {
      id: 'plan_enterprise',
      name: 'Enterprise',
      code: 'enterprise',
      description: 'Unlimited institutional access, student portal, custom developer API, and dedicated tier.',
      planStatus: 'active',
      displayOrder: 4,
      isPublic: false,
      recommended: false
    },
    entitlements: STANDARD_PLATFORM_FEATURES.reduce<Record<string, { enabled: boolean; limitValue: null }>>((acc, f) => {
      acc[f.key] = {
        enabled: true,
        limitValue: null // Unlimited
      };
      return acc;
    }, {})
  }
];

export function buildPlanEntitlementRecords(
  planId: string,
  entitlements: PlanDefinition['entitlements'],
  actorId = 'system'
): PlanEntitlement[] {
  const now = new Date().toISOString();
  return STANDARD_PLATFORM_FEATURES.map((feat) => {
    const config = entitlements[feat.key];
    let enabled = false;
    let limitValue: number | null = null;
    let configuration: Record<string, unknown> | undefined = undefined;

    if (config !== undefined) {
      if (typeof config === 'boolean') {
        enabled = config;
      } else {
        enabled = config.enabled;
        limitValue = config.limitValue !== undefined ? config.limitValue : null;
        configuration = config.configuration;
      }
    }

    return {
      id: getPlanEntitlementDocId(planId, feat.key),
      planId,
      featureKey: feat.key,
      enabled,
      limitValue,
      configuration,
      createdAt: now,
      updatedAt: now,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'active'
    };
  });
}
