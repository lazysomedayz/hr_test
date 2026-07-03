import type { Department, DepartmentInput, Employee, EmployeeInput, EmployeePage } from "./types"

const serverUrl = import.meta.env.VITE_SERVER_URL ?? "http://localhost:5129"
const apiUrl = `${serverUrl}/api`

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: options?.body instanceof FormData
      ? options.headers
      : { "Content-Type": "application/json", ...options?.headers },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const validation = body.errors
      ? Object.values(body.errors).flat().join(" ")
      : undefined
    throw new Error(validation || body.message || "เกิดข้อผิดพลาด กรุณาลองใหม่")
  }
  return response.status === 204 ? undefined as T : response.json()
}

export const fileUrl = (path?: string) =>
  path ? (path.startsWith("http") ? path : `${serverUrl}${path}`) : undefined

export const api = {
  getDepartments: () => request<Department[]>("/departments"),
  getDepartment: (id: number) =>
    request<Department>("/departments/detail", { method: "POST", body: JSON.stringify({ id }) }),
  createDepartment: (data: DepartmentInput) =>
    request<Department>("/departments", { method: "POST", body: JSON.stringify(data) }),
  updateDepartment: (id: number, data: DepartmentInput) =>
    request<Department>(`/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDepartment: (id: number) =>
    request<void>(`/departments/${id}`, { method: "DELETE" }),
  setDepartmentStatus: (id: number, is_active: boolean) =>
    request<Department>(`/departments/${id}/status`, {
      method: "PATCH", body: JSON.stringify({ is_active }),
    }),
  moveEmployeesToDefault: (id: number) =>
    request<{ moved_count: number }>(`/departments/${id}/move-employees-to-default`, {
      method: "POST",
    }),
  getEmployees: (filters: {
    page?: number
    size?: number
    search?: string
    department_id?: number
    status?: string
    sort_by?: string
    sort_direction?: "asc" | "desc"
  } = {}) => {
    return request<EmployeePage>("/employees/search", {
      method: "POST",
      body: JSON.stringify(filters),
    })
  },
  getNextEmployeeCode: () => request<{ employee_code: string }>("/employees/next-code"),
  getEmployee: (id: number) =>
    request<Employee>("/employees/detail", { method: "POST", body: JSON.stringify({ id }) }),
  createEmployee: (data: EmployeeInput) =>
    request<Employee>("/employees", { method: "POST", body: JSON.stringify(data) }),
  updateEmployee: (id: number, data: EmployeeInput) =>
    request<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteEmployee: (id: number) =>
    request<void>(`/employees/${id}`, { method: "DELETE" }),
  updateEmployeeStatus: (employee_ids: number[], is_active: boolean) =>
    request<{ updated_count: number }>("/employees/status", {
      method: "PATCH",
      body: JSON.stringify({ employee_ids, is_active }),
    }),
  uploadImage: async (file: File) => {
    const form = new FormData()
    form.append("file", file)
    return request<{ path: string; url: string }>("/uploads/images", {
      method: "POST",
      body: form,
    })
  },
}

export async function downloadEmployeeReport(filters: {
  department_id?: number
  status?: string
  period?: string
  date_from?: string
  date_to?: string
}) {
  const response = await fetch(`${apiUrl}/reports/employees.pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.message || "สร้างรายงานไม่สำเร็จ")
  }
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement("a")
  link.href = url
  link.download = `employee-report-${new Date().toISOString().slice(0, 10)}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}
