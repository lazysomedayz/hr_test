import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import EmployeesPage from "@/pages/employees-page"
import DepartmentsPage from "@/pages/departments-page"
import DepartmentFormPage from "@/pages/department-form-page"
import EmployeeFormPage from "@/pages/employee-form-page"
import ReportPage from "@/pages/report-page"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/employees" element={<EmployeesPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/employees/new" element={<EmployeeFormPage />} />
        <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
        <Route path="/departments/new" element={<DepartmentFormPage />} />
        <Route path="/departments/:id/edit" element={<DepartmentFormPage />} />
        <Route path="/reports" element={<ReportPage />} />
        <Route path="*" element={<Navigate to="/employees" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  )
}
