import { useState, type FormEvent } from "react"
import { api } from "@/api"
import type { Department, DepartmentInput } from "@/types"
import { ConfirmActionDialog } from "@/components/confirm-action-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"

const emptyDepartment: DepartmentInput = {
  code: "", name: "", address: "", description: "", is_active: true,
}

export function DepartmentForm({ value, onCancel, onSaved }: {
  value: Department | "new"
  onCancel: () => void
  onSaved: () => Promise<void>
}) {
  const [form, setForm] = useState<DepartmentInput>(value === "new" ? emptyDepartment : value)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState("")

  const requestSave = (event: FormEvent) => {
    event.preventDefault()
    setConfirmOpen(true)
  }

  const save = async () => {
    setError("")
    try {
      if (value === "new") await api.createDepartment(form)
      else await api.updateDepartment(value.id, form)
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
          <CardTitle>{value === "new" ? "เพิ่มแผนก" : "แก้ไขแผนก"}</CardTitle>
          <CardDescription>ข้อมูลพื้นฐานของหน่วยงานและสถานะการใช้งาน</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={requestSave} className="grid gap-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="รหัสแผนก" required>
                <Input required minLength={2} maxLength={20} value={form.code}
                  disabled={value !== "new" && value.is_default}
                  onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="เช่น IT" />
              </Field>
              <Field label="ชื่อแผนก" required>
                <Input required minLength={2} maxLength={100} value={form.name}
                  disabled={value !== "new" && value.is_default}
                  onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </Field>
              <Field label="ที่อยู่" wide>
                <Input maxLength={300} value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })} />
              </Field>
              <Field label="รายละเอียด" wide>
                <Textarea maxLength={500} rows={5} value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </Field>
              <div className="col-span-full flex items-center gap-3 rounded-lg border p-4">
                <Switch id="department-active" checked={form.is_active}
                  disabled={value !== "new" && value.is_default}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })} />
                <div>
                  <Label htmlFor="department-active">เปิดใช้งานแผนก</Label>
                  <p className="text-xs text-muted-foreground">
                    {value !== "new" && value.is_default
                      ? "แผนกกลางต้องเปิดใช้งานตลอดเวลา"
                      : "พนักงานใหม่สามารถเลือกแผนกนี้ได้เมื่อเปิดใช้งาน"}
                  </p>
                </div>
              </div>
            </div>
            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div className="form-page-actions">
              <Button type="button" variant="outline" onClick={onCancel}>ยกเลิก</Button>
              <Button type="submit">ตรวจสอบและบันทึก</Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <ConfirmActionDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title={value === "new" ? "ยืนยันการเพิ่มแผนก" : "ยืนยันการแก้ไขแผนก"}
        description={`บันทึกข้อมูลแผนก “${form.name || "ยังไม่ระบุชื่อ"}” และสถานะ ${form.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}?`}
        confirmLabel="ยืนยันและบันทึก" onConfirm={save} />
    </>
  )
}

function Field({ label, required, wide, children }: {
  label: string; required?: boolean; wide?: boolean; children: React.ReactNode
}) {
  return (
    <div className={`grid gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      {children}
    </div>
  )
}
