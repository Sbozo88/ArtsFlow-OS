/**
 * ArtsFlow OS — Design Tokens
 * Centralised semantic colour and status mappings.
 * All modules must reference these tokens instead of ad-hoc colour classes.
 */

// ── Semantic Status Mapping ──────────────────────────────────────────────────

export type SemanticStatus = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'muted';

export const STATUS_MAP: Record<string, SemanticStatus> = {
  // Active / positive states
  active: 'success',
  approved: 'success',
  paid: 'success',
  completed: 'success',
  verified: 'success',
  available: 'success',
  healthy: 'success',
  confirmed: 'success',
  accepted: 'success',
  boarded: 'success',
  returned: 'success',

  // Pending / neutral states
  pending: 'info',
  draft: 'neutral',
  waiting: 'info',
  submitted: 'info',
  sent: 'info',
  scheduled: 'info',
  in_progress: 'info',
  under_review: 'info',
  allocated: 'info',
  partially_paid: 'warning',
  open: 'info',

  // Warning states
  attention: 'warning',
  late: 'warning',
  overdue: 'warning',
  needs_attention: 'warning',
  degraded: 'warning',
  warning: 'warning',
  repair: 'warning',
  absent: 'warning',

  // Danger states
  cancelled: 'danger',
  failed: 'danger',
  declined: 'danger',
  critical: 'danger',
  urgent: 'danger',
  revoked: 'danger',
  unavailable: 'danger',
  rejected: 'danger',
  expired: 'danger',
  archived: 'danger',

  // Muted / inactive
  inactive: 'muted',
  deleted: 'muted',
  retired: 'muted',
};

// ── Status Badge Colour Classes ──────────────────────────────────────────────

export interface StatusColours {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const SEMANTIC_COLOURS: Record<SemanticStatus, StatusColours> = {
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
  info: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  muted: {
    bg: 'bg-slate-50',
    text: 'text-slate-400',
    border: 'border-slate-200',
    dot: 'bg-slate-300',
  },
};

/**
 * Resolves any status string to its semantic status category.
 * Falls back to 'neutral' for unknown statuses.
 */
export function resolveStatus(status: string | undefined | null): SemanticStatus {
  if (!status) return 'neutral';
  const normalised = status.toLowerCase().replace(/[\s-]/g, '_');
  return STATUS_MAP[normalised] ?? 'neutral';
}

/**
 * Resolves any status string to its Tailwind colour classes.
 */
export function getStatusColours(status: string | undefined | null): StatusColours {
  return SEMANTIC_COLOURS[resolveStatus(status)];
}

/**
 * Formats a raw status string for user display.
 * E.g. 'in_progress' → 'In Progress'
 */
export function formatStatusLabel(status: string | undefined | null): string {
  if (!status) return '—';
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}
