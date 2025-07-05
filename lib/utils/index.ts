import { formatDistanceToNow } from "date-fns";
import { vi } from 'date-fns/locale'

export function formatCreatedAt(d: Date) {
  if (!d) return '-'
  return formatDistanceToNow(d, { addSuffix: true, locale: vi })
}