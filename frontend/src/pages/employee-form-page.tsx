import { api } from "@/api";
import { EmployeeForm } from "@/components/employee-form";
import { FormPageShell } from "@/components/form-page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import type { Department, Employee } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | "new" | null>(
    id ? null : "new",
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.getDepartments(),
      id ? api.getEmployee(Number(id)) : Promise.resolve("new" as const),
    ])
      .then(([departmentData, employeeData]) => {
        setDepartments(departmentData);
        setEmployee(employeeData);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "โหลดข้อมูลไม่สำเร็จ",
        ),
      );
  }, [id]);

  const back = () => navigate("/employees");
  return (
    <FormPageShell
      title={id ? "แก้ไขพนักงาน" : "เพิ่มพนักงาน"}
      description="จัดการข้อมูลพนักงานในหน้าเดียวและตรวจสอบก่อนบันทึก"
      onBack={back}
    >
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-4 text-destructive"
        >
          {error}
        </p>
      ) : employee === null ? (
        <Skeleton className="h-[640px] w-full" />
      ) : (
        <EmployeeForm
          value={employee}
          departments={departments}
          onCancel={back}
          onSaved={async () => {
            toast.success("บันทึกข้อมูลพนักงานแล้ว");
            back();
          }}
        />
      )}
    </FormPageShell>
  );
}
