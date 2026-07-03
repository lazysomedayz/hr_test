import { api, downloadEmployeeReport } from "@/api";
import { BuddhistDatePicker } from "@/components/buddhist-date-picker";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { FormPageShell } from "@/components/form-page-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department } from "@/types";
import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReportPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [department, setDepartment] = useState("all");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    api.getDepartments().then(setDepartments);
  }, []);

  const download = async () => {
    await downloadEmployeeReport({
      department_id: department === "all" ? undefined : Number(department),
      status,
      period,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const changePeriod = (value: string) => {
    setPeriod(value);
    const today = new Date();
    if (value === "all") {
      setDateFrom("");
      setDateTo("");
    } else if (value === "daily") {
      const date = toIsoDate(today);
      setDateFrom(date);
      setDateTo(date);
    } else if (value === "monthly") {
      setDateFrom(
        toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      );
      setDateTo(
        toIsoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0)),
      );
    } else if (value === "yearly") {
      setDateFrom(toIsoDate(new Date(today.getFullYear(), 0, 1)));
      setDateTo(toIsoDate(new Date(today.getFullYear(), 11, 31)));
    } else if (!dateFrom || !dateTo) {
      setDateFrom(
        toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      );
      setDateTo(toIsoDate(today));
    }
  };

  const invalidRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  return (
    <FormPageShell
      title="รายงานพนักงาน"
      description="เลือกเงื่อนไขและส่งออกข้อมูลจากระบบเป็น PDF"
      onBack={() => navigate("/employees")}
    >
      <Card className="form-card">
        <CardHeader>
          <div className="report-icon">
            <FileText />
          </div>
          <CardTitle>Employee Directory Report</CardTitle>
          <CardDescription>
            สรุปจำนวนพนักงาน รายชื่อ ตำแหน่ง แผนก วันที่เริ่มงาน และสถานะ
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>แผนก</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกแผนก</SelectItem>
                  {departments.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>สถานะพนักงาน</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสถานะ</SelectItem>
                  <SelectItem value="active">กำลังทำงาน</SelectItem>
                  <SelectItem value="inactive">พ้นสภาพ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>รอบรายงาน</Label>
              <Select value={period} onValueChange={changePeriod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกช่วงเวลา</SelectItem>
                  <SelectItem value="daily">รายวัน - วันนี้</SelectItem>
                  <SelectItem value="monthly">รายเดือน - เดือนนี้</SelectItem>
                  <SelectItem value="yearly">รายปี - ปีนี้</SelectItem>
                  <SelectItem value="custom">กำหนดช่วงเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="hidden sm:block" />
            <div className="grid gap-2">
              <Label>วันที่เริ่มงาน ตั้งแต่</Label>
              <BuddhistDatePicker
                value={dateFrom}
                onChange={setDateFrom}
                disabled={period !== "custom"}
                invalid={invalidRange}
              />
            </div>
            <div className="grid gap-2">
              <Label>วันที่เริ่มงาน ถึง</Label>
              <BuddhistDatePicker
                value={dateTo}
                onChange={setDateTo}
                disabled={period !== "custom"}
                invalid={invalidRange}
              />
            </div>
          </div>
          {invalidRange && (
            <p role="alert" className="text-sm text-destructive">
              วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด
            </p>
          )}
          {/* <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            PDF จะสร้างจากข้อมูลล่าสุดใน SQL Server และแสดงวันที่แบบ พ.ศ.
            พร้อมเลขหน้า
          </div> */}
          <div className="form-page-actions">
            <Button variant="outline" onClick={() => navigate("/employees")}>
              ยกเลิก
            </Button>
            <Button
              disabled={invalidRange}
              onClick={() => setConfirmOpen(true)}
            >
              <Download />
              สร้างและดาวน์โหลด PDF
            </Button>
          </div>
        </CardContent>
      </Card>
      <ConfirmActionDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="ยืนยันการสร้างรายงาน"
        description="ระบบจะสร้าง PDF จากข้อมูลล่าสุดตามเงื่อนไขที่เลือก"
        confirmLabel="สร้างรายงาน"
        onConfirm={download}
      />
    </FormPageShell>
  );
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
