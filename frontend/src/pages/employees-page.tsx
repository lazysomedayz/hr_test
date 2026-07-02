import { api, fileUrl } from "@/api";
import { ConfirmActionDialog } from "@/components/confirm-action-dialog";
import { DeleteDialog } from "@/components/delete-dialog";
import { ManagementPageShell } from "@/components/management-page-shell";
import {
  EmptyState,
  IconAction,
  LoadError,
  messageOf,
  StatusBadge,
} from "@/components/management-ui";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import type { Department, Employee } from "@/types";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle2,
  Edit3,
  Plus,
  Search,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type StatusFilter = "all" | "active" | "inactive";
type SortKey =
  | "name"
  | "employee_code"
  | "job_title"
  | "date_joined"
  | "is_active";

export default function EmployeesPage() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAscending, setSortAscending] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [allCount, setAllCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [pendingStatus, setPendingStatus] = useState<boolean | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebouncedValue(search, 500);

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setLoadError("");
    try {
      const [employeeData, departmentData] = await Promise.all([
        api.getEmployees({
          page: currentPage,
          size: pageSize,
          search: debouncedSearch,
          department_id:
            departmentFilter === "all" ? undefined : Number(departmentFilter),
          status: statusFilter,
          sort_by: sortKey,
          sort_direction: sortAscending ? "asc" : "desc",
        }),
        api.getDepartments(),
      ]);
      setEmployees(employeeData.items);
      setTotalCount(employeeData.total_count);
      setAllCount(employeeData.all_count);
      setActiveCount(employeeData.active_count);
      setInactiveCount(employeeData.inactive_count);
      setDepartments(departmentData);
      setSelectedIds(new Set());
    } catch (error) {
      setLoadError(messageOf(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    departmentFilter,
    statusFilter,
    sortKey,
    sortAscending,
  ]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, [role='combobox']")) return;
      if (event.key === "/") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        navigate("/employees/new");
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    departmentFilter,
    statusFilter,
    sortKey,
    sortAscending,
    pageSize,
  ]);

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const allVisibleSelected =
    employees.length > 0 && employees.every((item) => selectedIds.has(item.id));
  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAscending((value) => !value);
    else {
      setSortKey(key);
      setSortAscending(true);
    }
  };
  const toggleSelection = (id: number) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleVisible = () =>
    setSelectedIds((current) => {
      const next = new Set(current);
      employees.forEach((item) =>
        allVisibleSelected ? next.delete(item.id) : next.add(item.id),
      );
      return next;
    });
  const updateSelectedStatus = async (isActive: boolean) => {
    try {
      const result = await api.updateEmployeeStatus([...selectedIds], isActive);
      toast.success(`อัปเดตสถานะแล้ว ${result.updated_count} คน`);
      await load(false);
    } catch (error) {
      toast.error(messageOf(error));
    }
  };
  const deleteEmployee = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteEmployee(deleteTarget.id);
      toast.success("ลบข้อมูลพนักงานแล้ว");
      await load(false);
    } catch (error) {
      toast.error(messageOf(error));
      throw error;
    }
  };

  const hasBaseEmployees = allCount > 0 || search || departmentFilter !== "all";

  return (
    <ManagementPageShell
      title="พนักงาน"
      employeeCount={allCount}
      departmentCount={departments.length}
      loading={loading}
      actions={
        <>
          <Button variant="outline" onClick={() => navigate("/reports")}>
            รายงาน PDF
          </Button>
          <Button onClick={() => navigate("/employees/new")}>
            <Plus />
            เพิ่มพนักงาน<kbd>N</kbd>
          </Button>
        </>
      }
    >
      {!loading && !loadError && (
        <section className="insight-bar" aria-label="สรุปสถานะพนักงาน">
          <Insight
            active={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
            icon={<Users />}
            label="ทั้งหมด"
            value={allCount}
          />
          <Insight
            active={statusFilter === "active"}
            onClick={() => setStatusFilter("active")}
            icon={<CheckCircle2 />}
            label="กำลังทำงาน"
            value={activeCount}
          />
          <Insight
            active={statusFilter === "inactive"}
            onClick={() => setStatusFilter("inactive")}
            icon={<UserMinus />}
            label="พ้นสภาพ"
            value={inactiveCount}
          />
        </section>
      )}

      {loadError ? (
        <LoadError message={loadError} onRetry={() => void load()} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="toolbar">
            <div className="search">
              <Search size={12} style={{ top: "10px" }} />
              <Input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ค้นหาชื่อ รหัส อีเมล ตำแหน่ง หรือเบอร์โทร..."
                aria-label="ค้นหาพนักงาน"
              />
              <kbd>/</kbd>
            </div>
            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger aria-label="กรองตามแผนก">
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
            {(search ||
              departmentFilter !== "all" ||
              statusFilter !== "all") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setDepartmentFilter("all");
                  setStatusFilter("all");
                }}
              >
                <X />
                ล้างตัวกรอง
              </Button>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="bulk-bar" role="status">
              <strong>เลือก {selectedIds.size} คน</strong>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingStatus(true)}
              >
                <UserPlus />
                ตั้งเป็นทำงาน
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingStatus(false)}
              >
                <UserMinus />
                ตั้งเป็นพ้นสภาพ
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                ยกเลิก
              </Button>
            </div>
          )}

          {loading ? (
            <TableSkeleton />
          ) : employees.length === 0 ? (
            <EmptyState
              text={
                hasBaseEmployees
                  ? "ไม่พบข้อมูลที่ตรงกับตัวกรอง"
                  : "ยังไม่พบพนักงาน"
              }
              description={
                hasBaseEmployees
                  ? "ลองเปลี่ยนคำค้นหา หรือล้างตัวกรอง"
                  : "เพิ่มพนักงานคนแรกเพื่อเริ่มจัดการข้อมูลบุคลากร"
              }
              action={
                hasBaseEmployees
                  ? () => {
                      setSearch("");
                      setDepartmentFilter("all");
                      setStatusFilter("all");
                    }
                  : () => navigate("/employees/new")
              }
              actionText={hasBaseEmployees ? "ล้างตัวกรอง" : "เพิ่มพนักงาน"}
            />
          ) : (
            <EmployeeTable
              employees={employees}
              selectedIds={selectedIds}
              allSelected={allVisibleSelected}
              onToggleAll={toggleVisible}
              onToggle={toggleSelection}
              sortKey={sortKey}
              ascending={sortAscending}
              onSort={toggleSort}
              onEdit={(id) => navigate(`/employees/${id}/edit`)}
              onDelete={setDeleteTarget}
            />
          )}

          {!loading && employees.length > 0 && (
            <div className="table-footer">
              <span>
                แสดง {(currentPage - 1) * pageSize + 1}–
                {Math.min(currentPage * pageSize, totalCount)} จาก {totalCount}{" "}
                คน
              </span>
              <div>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger
                    className="h-8 w-24"
                    aria-label="จำนวนรายการต่อหน้า"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 / หน้า</SelectItem>
                    <SelectItem value="20">20 / หน้า</SelectItem>
                    <SelectItem value="50">50 / หน้า</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((value) => value - 1)}
                >
                  ก่อนหน้า
                </Button>
                <span>
                  หน้า {currentPage} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === pageCount}
                  onClick={() => setCurrentPage((value) => value + 1)}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {deleteTarget && (
        <DeleteDialog
          open
          title={`ลบ ${deleteTarget.first_name} ${deleteTarget.last_name}?`}
          description={`ข้อมูลพนักงานรหัส ${deleteTarget.employee_code} จะถูกนำออกจากรายการ`}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          onConfirm={deleteEmployee}
        />
      )}
      {pendingStatus !== null && (
        <ConfirmActionDialog
          open
          title={`ยืนยันการเปลี่ยนสถานะ ${selectedIds.size} คน`}
          description={`พนักงานที่เลือกจะถูกเปลี่ยนเป็น “${pendingStatus ? "กำลังทำงาน" : "พ้นสภาพ"}”`}
          confirmLabel="ยืนยันการเปลี่ยนสถานะ"
          destructive={!pendingStatus}
          onOpenChange={(open) => !open && setPendingStatus(null)}
          onConfirm={() => updateSelectedStatus(pendingStatus)}
        />
      )}
    </ManagementPageShell>
  );
}

function EmployeeTable({
  employees,
  selectedIds,
  allSelected,
  onToggleAll,
  onToggle,
  sortKey,
  ascending,
  onSort,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  selectedIds: Set<number>;
  allSelected: boolean;
  onToggleAll: () => void;
  onToggle: (id: number) => void;
  sortKey: SortKey;
  ascending: boolean;
  onSort: (key: SortKey) => void;
  onEdit: (id: number) => void;
  onDelete: (employee: Employee) => void;
}) {
  return (
    <>
      <div className="desktop-table overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  aria-label="เลือกพนักงานในหน้านี้"
                  checked={allSelected}
                  onCheckedChange={onToggleAll}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  label="พนักงาน"
                  sortKey="name"
                  current={sortKey}
                  ascending={ascending}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  label="รหัส"
                  sortKey="employee_code"
                  current={sortKey}
                  ascending={ascending}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  label="ตำแหน่ง / แผนก"
                  sortKey="job_title"
                  current={sortKey}
                  ascending={ascending}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  label="วันที่เริ่มงาน"
                  sortKey="date_joined"
                  current={sortKey}
                  ascending={ascending}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead>
                <SortButton
                  label="สถานะ"
                  sortKey="is_active"
                  current={sortKey}
                  ascending={ascending}
                  onSort={onSort}
                />
              </TableHead>
              <TableHead className="text-right">การทำงาน</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow
                key={employee.id}
                data-state={
                  selectedIds.has(employee.id) ? "selected" : undefined
                }
              >
                <TableCell>
                  <Checkbox
                    aria-label={`เลือก ${employee.first_name} ${employee.last_name}`}
                    checked={selectedIds.has(employee.id)}
                    onCheckedChange={() => onToggle(employee.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="person">
                    <Avatar employee={employee} />
                    <div>
                      <strong>
                        {employee.first_name} {employee.last_name}
                      </strong>
                      <span>{employee.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <code>{employee.employee_code}</code>
                </TableCell>
                <TableCell>
                  <strong>{employee.job_title}</strong>
                  <span className="sub">{employee.department_name}</span>
                </TableCell>
                <TableCell>{formatDate(employee.date_joined)}</TableCell>
                <TableCell>
                  <StatusBadge active={employee.is_active} />
                </TableCell>
                <TableCell>
                  <div className="actions">
                    <IconAction
                      label={`แก้ไข ${employee.first_name} ${employee.last_name}`}
                      icon={<Edit3 />}
                      onClick={() => onEdit(employee.id)}
                    />
                    <IconAction
                      destructive
                      label={`ลบ ${employee.first_name} ${employee.last_name}`}
                      icon={<Trash2 />}
                      onClick={() => onDelete(employee)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mobile-list">
        {employees.map((employee) => (
          <article className="mobile-employee" key={employee.id}>
            <Checkbox
              aria-label={`เลือก ${employee.first_name} ${employee.last_name}`}
              checked={selectedIds.has(employee.id)}
              onCheckedChange={() => onToggle(employee.id)}
            />
            <Avatar employee={employee} />
            <div className="mobile-employee-info">
              <strong>
                {employee.first_name} {employee.last_name}
              </strong>
              <span>
                {employee.employee_code} · {employee.job_title}
              </span>
              <small>{employee.department_name}</small>
            </div>
            <StatusBadge active={employee.is_active} />
            <div className="actions">
              <IconAction
                label={`แก้ไข ${employee.first_name} ${employee.last_name}`}
                icon={<Edit3 />}
                onClick={() => onEdit(employee.id)}
              />
              <IconAction
                destructive
                label={`ลบ ${employee.first_name} ${employee.last_name}`}
                icon={<Trash2 />}
                onClick={() => onDelete(employee)}
              />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

function Insight({
  icon,
  label,
  value,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "insight active" : "insight"} onClick={onClick}>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}
function SortButton({
  label,
  sortKey,
  current,
  ascending,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  ascending: boolean;
  onSort: (key: SortKey) => void;
}) {
  const icon =
    current !== sortKey ? (
      <ArrowUpDown />
    ) : ascending ? (
      <ArrowUp />
    ) : (
      <ArrowDown />
    );
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8"
      onClick={() => onSort(sortKey)}
    >
      {label}
      {icon}
    </Button>
  );
}
function Avatar({ employee }: { employee: Employee }) {
  const image = fileUrl(employee.photo_path);
  return image ? (
    <img
      className="avatar"
      src={image}
      alt={`รูปของ ${employee.first_name} ${employee.last_name}`}
      loading="lazy"
    />
  ) : (
    <span className="avatar initials" aria-hidden="true">
      {employee.first_name[0]}
      {employee.last_name[0]}
    </span>
  );
}
function TableSkeleton() {
  return (
    <div
      className="grid gap-4 p-5"
      role="status"
      aria-label="กำลังโหลดข้อมูลพนักงาน"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
