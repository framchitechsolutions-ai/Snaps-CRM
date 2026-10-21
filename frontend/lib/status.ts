export type RequestStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'in_progress'
  | 'awaiting_payment'
  | 'completed'
  | 'cancelled'

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  in_progress: 'In Progress',
  awaiting_payment: 'Awaiting Payment',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-primary/10 text-primary',
  in_review: 'bg-warning/10 text-warning',
  in_progress: 'bg-primary/10 text-primary',
  awaiting_payment: 'bg-purple/10 text-purple',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-danger/10 text-danger',
}

export function statusBadgeClass(status: string): string {
  return STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}
