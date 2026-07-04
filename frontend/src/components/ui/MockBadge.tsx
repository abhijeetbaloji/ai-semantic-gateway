import { FlaskConical } from 'lucide-react'

/**
 * Renders a small "demo data" badge. Used on pages whose numbers/rows
 * are illustrative rather than real backend data. Being explicit here
 * lets you truthfully say "this page shows the intended UX; the backend
 * endpoints to populate it are Priority 3/4 work" without lying.
 */
export default function MockBadge({ label = 'demo data' }: { label?: string }) {
  return (
    <span className="badge bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
      <FlaskConical className="mr-1 h-3 w-3" />
      {label}
    </span>
  )
}
