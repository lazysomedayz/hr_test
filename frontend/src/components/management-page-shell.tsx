import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ManagementPageShell({
  title,
  employeeCount,
  departmentCount,
  loading,
  actions,
  children,
}: {
  title: string;
  employeeCount: number;
  departmentCount: number;
  loading: boolean;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <div className="app-shell">
        <AppSidebar
          employeeCount={employeeCount}
          departmentCount={departmentCount}
        />
        <main className="app-main" aria-busy={loading}>
          <header className="page-header">
            <div>
              <p>ระบบจัดการทรัพยากรบุคคล</p>
              <h1>{title}</h1>
            </div>
            <div className="page-actions">{actions}</div>
          </header>
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
