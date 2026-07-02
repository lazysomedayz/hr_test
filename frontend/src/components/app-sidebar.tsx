import { api } from "@/api";
import { Button } from "@/components/ui/button";
import { Building2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function AppSidebar({
  employeeCount,
  departmentCount,
}: {
  employeeCount?: number;
  departmentCount?: number;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    employees: employeeCount,
    departments: departmentCount,
  });

  useEffect(() => {
    if (employeeCount !== undefined && departmentCount !== undefined) {
      setCounts({ employees: employeeCount, departments: departmentCount });
      return;
    }
    void Promise.all([
      api.getEmployees({ page: 1, size: 1 }),
      api.getDepartments(),
    ])
      .then(([employees, departments]) =>
        setCounts({
          employees: employees.all_count,
          departments: departments.length,
        }),
      )
      .catch(() => undefined);
  }, [employeeCount, departmentCount]);

  const employeePage = location.pathname.startsWith("/employees");
  const departmentPage = location.pathname.startsWith("/departments");

  return (
    <aside className="app-sidebar">
      <div className="brand">
        <span>HR</span>
        <div>
          TAF HR<small>HR Management</small>
        </div>
      </div>
      <nav aria-label="เมนูหลัก">
        <Button
          variant={employeePage ? "secondary" : "ghost"}
          onClick={() => navigate("/employees")}
        >
          <Users /> พนักงาน{" "}
          {counts.employees !== undefined && <b>{counts.employees}</b>}
        </Button>
        <Button
          variant={departmentPage ? "secondary" : "ghost"}
          onClick={() => navigate("/departments")}
        >
          <Building2 /> แผนก{" "}
          {counts.departments !== undefined && <b>{counts.departments}</b>}
        </Button>
      </nav>
    </aside>
  );
}
