import { Plus, Users, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function StatusBadge({ active, activeText = "ทำงาน", inactiveText = "พ้นสภาพ" }: {
  active: boolean
  activeText?: string
  inactiveText?: string
}) {
  return <Badge variant="outline" className={active ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "text-muted-foreground"}>{active ? activeText : inactiveText}</Badge>
}

export function IconAction({ label, icon, destructive, onClick }: {
  label: string
  icon: React.ReactNode
  destructive?: boolean
  onClick: () => void
}) {
  return <Tooltip><TooltipTrigger asChild><Button aria-label={label} variant="ghost" size="icon" className={destructive ? "text-destructive" : ""} onClick={onClick}>{icon}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}

export function EmptyState({ text, description, action, actionText }: {
  text: string
  description: string
  action: () => void
  actionText: string
}) {
  return <div className="empty"><div><Users /></div><h2>{text}</h2><p>{description}</p><Button onClick={action}><Plus />{actionText}</Button></div>
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <Card className="empty" role="alert"><div><X /></div><h2>โหลดข้อมูลไม่สำเร็จ</h2><p>{message}</p><Button onClick={onRetry}>ลองอีกครั้ง</Button></Card>
}

export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
}
