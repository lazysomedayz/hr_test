import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"

export function FormPageShell({ title, description, onBack, children }: {
  title: string
  description: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="app-shell">
      <AppSidebar />
      <main className="app-main form-main">
        <div className="form-page">
          <div className="form-page-header">
            <Button variant="ghost" onClick={onBack}><ArrowLeft />กลับ</Button>
            <div><h1>{title}</h1><p>{description}</p></div>
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
