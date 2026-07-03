import { api } from "@/api";
import { DepartmentForm } from "@/components/department-form";
import { FormPageShell } from "@/components/form-page-shell";
import { Skeleton } from "@/components/ui/skeleton";
import type { Department } from "@/types";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

export default function DepartmentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | "new" | null>(
    id ? null : "new",
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    api
      .getDepartment(Number(id))
      .then(setDepartment)
      .catch((reason) =>
        setError(
          reason instanceof Error ? reason.message : "โหลดข้อมูลไม่สำเร็จ",
        ),
      );
  }, [id]);

  const back = () => navigate("/departments");
  return (
    <FormPageShell
      title={id ? "แก้ไขแผนก" : "เพิ่มแผนก"}
      description="กำหนดข้อมูลหน่วยงานและสถานะการใช้งาน"
      onBack={back}
    >
      {error ? (
        <p
          role="alert"
          className="rounded-lg bg-destructive/10 p-4 text-destructive"
        >
          {error}
        </p>
      ) : department === null ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <DepartmentForm
          value={department}
          onCancel={back}
          onSaved={async () => {
            toast.success("บันทึกข้อมูลแผนกแล้ว");
            back();
          }}
        />
      )}
    </FormPageShell>
  );
}
