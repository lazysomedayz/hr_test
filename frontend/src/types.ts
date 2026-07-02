export type Department = {
  id: number
  code: string
  name: string
  address?: string
  description?: string
  is_active: boolean
  is_default: boolean
  employee_count: number
}

export type Employee = {
  id: number
  department_id: number
  department_name: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  gender: string
  date_of_birth: string
  date_joined: string
  job_title: string
  address?: string
  photo_path?: string
  is_active: boolean
}

export type DepartmentInput = Omit<Department, "id" | "employee_count" | "is_default">
export type EmployeeInput = Omit<Employee, "id" | "department_name">
export type EmployeePage = {
  items: Employee[]
  page: number
  size: number
  total_count: number
  all_count: number
  active_count: number
  inactive_count: number
}
