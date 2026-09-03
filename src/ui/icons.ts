import { Cpu, Database, Server, Split, Users, Zap, type LucideIcon } from 'lucide-react'
import type { NodeType } from '../sim/types'

export const ICONS: Record<NodeType, LucideIcon> = {
  users: Users,
  lb: Split,
  web: Server,
  bigweb: Cpu,
  cache: Zap,
  db: Database,
}
