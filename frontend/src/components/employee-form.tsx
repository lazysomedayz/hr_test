import { useEffect, useRef, useState, type FormEvent } from "react"
import { BriefcaseBusiness, ChevronDown, Contact, UserRound } from "lucide-react"
import { api } from "@/api"
import type { Department, Employee, EmployeeInput } from "@/types"
import { BuddhistDatePicker } from "@/components/buddhist-date-picker"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { ImageDropzone } from "@/components/image-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const today = new Date().toISOString().slice(0, 10)
const fifteenYearsAgo = `${new Date().getFullYear() - 15}${today.slice(4)}`
const emptyEmployee: EmployeeInput = {
  department_id: 0, employee_code: "", first_name: "", last_name: "", email: "",
  phone: "", gender: "", date_of_birth: "", date_joined: today, job_title: "",
  address: "", photo_path: "", is_active: true,
}

export function EmployeeForm({ value, departments, onCancel, onSaved }: {
  value: Employee | "new"
  departments: Department[]
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [form, setForm] = useState<EmployeeInput>(value === "new" ? emptyEmployee : value)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [codeLoading, setCodeLoading] = useState(value === "new")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const formRef = useRef<HTMLFormElement>(null)
  const set = <K extends keyof EmployeeInput>(key: K, fieldValue: EmployeeInput[K]) =>
    setForm((current) => ({ ...current, [key]: fieldValue }))

  useEffect(() => {
    if (value !== "new") return
    void api.getNextEmployeeCode()
      .then(({ employee_code }) => set("employee_code", employee_code))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "โหลดรหัสพนักงานไม่สำเร็จ"))
      .finally(() => setCodeLoading(false))
  }, [value])

  const requestSave = (event: FormEvent) => {
    event.preventDefault()
    setError("")
    const errors: Record<string, string> = {}
    if (!form.date_of_birth) errors.date_of_birth = "กรุณาเลือกวันเกิด"
    if (!form.date_joined) errors.date_joined = "กรุณาเลือกวันที่เริ่มงาน"
    if (!form.department_id) errors.department_id = "กรุณาเลือกแผนก"
    if (!form.gender) errors.gender = "กรุณาเลือกเพศ"
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus()
      return
    }
    setConfirmOpen(true)
  }

  const save = async () => {
    setError("")
    try {
      if (value === "new") await api.createEmployee(form)
      else await api.updateEmployee(value.id, form)
      await onSaved()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "บันทึกไม่สำเร็จ")
      throw reason
    }
  }

  return (
    <>
      <Card className="form-card">
        <CardHeader>
          <CardTitle>{value === "new" ? "เพิ่มพนักงาน" : "แก้ไขพนักงาน"}</CardTitle>
          <CardDescription>ข้อมูลบุคคล การทำงาน และช่องทางติดต่อ</CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={requestSave} className="grid gap-5">
            <FormSection icon={<UserRound />} title="ข้อมูลประจำตัว" description="ข้อมูลสำหรับระบุตัวพนักงาน">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="รหัสพนักงาน">
                  <Input readOnly aria-readonly="true" value={codeLoading ? "กำลังสร้างรหัส..." : form.employee_code} className="bg-muted font-mono" />
                  {value === "new" && <p className="mt-1 text-xs text-muted-foreground">ระบบจะยืนยันเลขสุดท้ายอีกครั้งตอนบันทึก เพื่อป้องกันรหัสซ้ำเมื่อมีการสร้างพร้อมกัน</p>}
                </Field>
                <Field label="ชื่อ" required><Input required minLength={2} maxLength={100} value={form.first_name} onChange={(event) => set("first_name", event.target.value)} /></Field>
                <Field label="นามสกุล" required><Input required minLength={2} maxLength={100} value={form.last_name} onChange={(event) => set("last_name", event.target.value)} /></Field>
                <Field label="เพศ" required error={fieldErrors.gender}>
                  <Select required value={form.gender} onValueChange={(selected) => set("gender", selected)}>
                    <SelectTrigger className="w-full" aria-invalid={Boolean(fieldErrors.gender)}><SelectValue placeholder="เลือกเพศ" /></SelectTrigger>
                    <SelectContent><SelectItem value="Male">ชาย</SelectItem><SelectItem value="Female">หญิง</SelectItem><SelectItem value="Other">อื่น ๆ</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="วันเกิด (พ.ศ.)" required error={fieldErrors.date_of_birth} errorId="error-date-of-birth">
                  <BuddhistDatePicker value={form.date_of_birth} max={fifteenYearsAgo} invalid={Boolean(fieldErrors.date_of_birth)} describedBy="error-date-of-birth" onChange={(date) => set("date_of_birth", date)} />
                </Field>
              </div>
            </FormSection>

            <FormSection icon={<BriefcaseBusiness />} title="ข้อมูลการทำงาน" description="แผนก ตำแหน่ง และวันเริ่มงาน">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="แผนก" required error={fieldErrors.department_id}>
                  <Select required value={form.department_id ? String(form.department_id) : ""} onValueChange={(selected) => set("department_id", Number(selected))}>
                    <SelectTrigger className="w-full" aria-invalid={Boolean(fieldErrors.department_id)}><SelectValue placeholder="เลือกแผนก" /></SelectTrigger>
                    <SelectContent>{departments.filter((item) => item.is_active || item.id === form.department_id).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}{item.is_default ? " (ค่าเริ่มต้น)" : ""}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="ตำแหน่ง" required><Input required minLength={2} maxLength={100} value={form.job_title} onChange={(event) => set("job_title", event.target.value)} /></Field>
                <Field label="วันที่เริ่มงาน (พ.ศ.)" required error={fieldErrors.date_joined} errorId="error-date-joined">
                  <BuddhistDatePicker value={form.date_joined} max={today} invalid={Boolean(fieldErrors.date_joined)} describedBy="error-date-joined" onChange={(date) => set("date_joined", date)} />
                </Field>
                <div className="flex items-center gap-3 self-end pb-2">
                  <Switch id="employee-active" checked={form.is_active} onCheckedChange={(checked) => set("is_active", checked)} />
                  <Label htmlFor="employee-active">พนักงานกำลังทำงาน</Label>
                </div>
              </div>
            </FormSection>

            <FormSection icon={<Contact />} title="ช่องทางติดต่อ" description="ข้อมูลที่ใช้ติดต่อพนักงาน">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="อีเมล" required><Input required type="email" maxLength={150} autoComplete="email" value={form.email} onChange={(event) => set("email", event.target.value)} placeholder="name@company.com" /></Field>
                <Field label="เบอร์โทรศัพท์"><Input type="tel" maxLength={30} autoComplete="tel" value={form.phone} onChange={(event) => set("phone", event.target.value)} placeholder="08x-xxx-xxxx" /></Field>
              </div>
            </FormSection>

            <details className="group rounded-lg border bg-muted/20">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4 font-medium"><ChevronDown className="size-4 transition-transform group-open:rotate-180" />ข้อมูลเสริม <span className="text-xs font-normal text-muted-foreground">ไม่บังคับ</span></summary>
              <div className="grid gap-4 border-t p-4">
                <Field label="ที่อยู่"><Input maxLength={300} autoComplete="street-address" value={form.address} onChange={(event) => set("address", event.target.value)} /></Field>
                <Field label="รูปพนักงาน"><ImageDropzone value={form.photo_path} onChange={(path) => set("photo_path", path)} onError={setError} /></Field>
              </div>
            </details>
            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div className="form-page-actions">
              <Button type="button" variant="outline" onClick={onCancel}>ยกเลิก</Button>
              <Button type="submit" disabled={departments.length === 0 || codeLoading || !form.employee_code}>ตรวจสอบและบันทึก</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmActionDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title={value === "new" ? "ยืนยันการเพิ่มพนักงาน" : "ยืนยันการแก้ไขพนักงาน"}
        description={`บันทึกข้อมูล ${form.first_name || "พนักงาน"} ${form.last_name} รหัส ${form.employee_code || "ยังไม่ระบุ"}?`}
        confirmLabel="ยืนยันและบันทึก" onConfirm={save} />
    </>
  )
}

function FormSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <section className="grid gap-4 rounded-lg border p-4"><div className="flex items-start gap-3"><span className="mt-0.5 text-primary">{icon}</span><div><h2 className="font-semibold">{title}</h2><p className="text-xs text-muted-foreground">{description}</p></div></div>{children}</section>
}
function Field({ label, required, wide, error, errorId: customErrorId, children }: { label: string; required?: boolean; wide?: boolean; error?: string; errorId?: string; children: React.ReactNode }) {
  const errorId = customErrorId ?? `error-${label.replace(/\s/g, "-")}`
  return <div className={`grid gap-2 ${wide ? "sm:col-span-2" : ""}`}><Label>{label}{required && <span className="text-destructive"> *</span>}</Label><div aria-describedby={error ? errorId : undefined} aria-invalid={Boolean(error)}>{children}</div>{error && <p id={errorId} className="text-xs text-destructive">{error}</p>}</div>
}
