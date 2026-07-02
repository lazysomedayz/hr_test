import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeftRight, Building2, Edit3, Plus, Power, Trash2, Users } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api"
import type { Department } from "@/types"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { DeleteDialog } from "@/components/delete-dialog"
import { ManagementPageShell } from "@/components/management-page-shell"
import { EmptyState, IconAction, LoadError, messageOf, StatusBadge } from "@/components/management-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type PendingAction = {
  title: string
  description: string
  confirmLabel: string
  destructive?: boolean
  run: () => Promise<void>
} | null

export default function DepartmentsPage() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>([])
  const [employeeCount, setEmployeeCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setLoadError("")
    try {
      const [departmentData, employeeData] = await Promise.all([
        api.getDepartments(),
        api.getEmployees({ page: 1, size: 1 }),
      ])
      setDepartments(departmentData)
      setEmployeeCount(employeeData.all_count)
    } catch (error) {
      setLoadError(messageOf(error))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { void load() }, [])

  const requestStatus = (department: Department) => setPendingAction({
    title: `${department.is_active ? "ปิด" : "เปิด"}ใช้งานแผนก “${department.name}”?`,
    description: department.is_active
      ? "เมื่อปิดใช้งาน แผนกนี้จะไม่ปรากฏเป็นตัวเลือกสำหรับพนักงานใหม่"
      : "แผนกนี้จะกลับมาเป็นตัวเลือกสำหรับพนักงานใหม่",
    confirmLabel: department.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน",
    destructive: department.is_active,
    run: async () => {
      await api.setDepartmentStatus(department.id, !department.is_active)
      toast.success("อัปเดตสถานะแผนกแล้ว")
      await load(false)
    },
  })
  const requestMove = (department: Department) => setPendingAction({
    title: `ย้ายพนักงาน ${department.employee_count} คนไปแผนกกลาง?`,
    description: `พนักงานทั้งหมดใน “${department.name}” จะถูกย้ายไปแผนกกลาง หลังจากนั้นจึงสามารถปิดหรือลบแผนกนี้ได้`,
    confirmLabel: "ย้ายพนักงาน",
    run: async () => {
      const result = await api.moveEmployeesToDefault(department.id)
      toast.success(`ย้ายพนักงานแล้ว ${result.moved_count} คน`)
      await load(false)
    },
  })
  const deleteDepartment = async () => {
    if (!deleteTarget) return
    try {
      await api.deleteDepartment(deleteTarget.id)
      toast.success("ลบแผนกแล้ว")
      await load(false)
    } catch (error) {
      toast.error(messageOf(error))
      throw error
    }
  }

  return (
    <ManagementPageShell title="แผนก" employeeCount={employeeCount} departmentCount={departments.length}
      loading={loading} actions={<><Button variant="outline" onClick={() => navigate("/reports")}>รายงาน PDF</Button><Button onClick={() => navigate("/departments/new")}><Plus />เพิ่มแผนก</Button></>}>
      {loadError ? <LoadError message={loadError} onRetry={() => void load()} />
        : loading ? <DepartmentSkeleton />
        : departments.length === 0 ? <EmptyState text="ยังไม่มีแผนก" description="สร้างแผนกแรกก่อนเพิ่มพนักงาน"
            action={() => navigate("/departments/new")} actionText="เพิ่มแผนก" />
        : <section className="department-grid">{departments.map((department) => (
          <Card className="department-card" key={department.id}>
            <CardContent className="p-0">
              <div className="department-heading"><span className="department-icon"><Building2 /></span><div><code>{department.code}</code><h2>{department.name}</h2></div></div>
              <div className="card-actions">
                <IconAction label={`แก้ไขแผนก ${department.name}`} icon={<Edit3 />} onClick={() => navigate(`/departments/${department.id}/edit`)} />
                {!department.is_default && department.employee_count > 0 && <IconAction label={`ย้ายพนักงานจาก ${department.name} ไปแผนกกลาง`} icon={<ArrowLeftRight />} onClick={() => requestMove(department)} />}
                {!department.is_default && <IconAction destructive={department.is_active} label={`${department.is_active ? "ปิด" : "เปิด"}ใช้งานแผนก ${department.name}`} icon={<Power />} onClick={() => requestStatus(department)} />}
                {!department.is_default && <IconAction destructive label={`ลบแผนก ${department.name}`} icon={<Trash2 />} onClick={() => setDeleteTarget(department)} />}
              </div>
              <p>{department.description || "ยังไม่มีรายละเอียดแผนก"}</p>
              <div className="department-meta"><span><Users />{department.employee_count} คน</span><div className="flex gap-2">
                {department.is_default && <Badge variant="secondary">ค่าเริ่มต้น</Badge>}
                <StatusBadge active={department.is_active} activeText="เปิดใช้งาน" inactiveText="ปิดใช้งาน" />
              </div></div>
            </CardContent>
          </Card>
        ))}</section>}

      {deleteTarget && <DeleteDialog open title={`ลบแผนก “${deleteTarget.name}”?`}
        description="แผนกจะถูกนำออกจากรายการและไม่สามารถนำไปเลือกให้พนักงานใหม่ได้"
        blockedReason={deleteTarget.employee_count > 0 ? `แผนกนี้มีพนักงาน ${deleteTarget.employee_count} คน กรุณาย้ายพนักงานไปแผนกกลางก่อน` : undefined}
        onOpenChange={(open) => !open && setDeleteTarget(null)} onConfirm={deleteDepartment} />}
      {pendingAction && <ConfirmActionDialog open title={pendingAction.title}
        description={pendingAction.description} confirmLabel={pendingAction.confirmLabel}
        destructive={pendingAction.destructive} onOpenChange={(open) => !open && setPendingAction(null)}
        onConfirm={pendingAction.run} />}
    </ManagementPageShell>
  )
}

function DepartmentSkeleton() {
  return <div className="department-grid" role="status" aria-label="กำลังโหลดข้อมูลแผนก">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-52 w-full" />)}</div>
}
