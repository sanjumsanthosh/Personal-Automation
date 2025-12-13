import { Badge } from '@/components/ui/badge'
import type { EntryStatus } from '@/lib/types'

const statusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const },
  processed: { label: 'Processed', variant: 'default' as const },
  archived: { label: 'Archived', variant: 'outline' as const },
}

export function StatusBadge({ status }: { status: EntryStatus }) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
