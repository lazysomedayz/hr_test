IF OBJECT_ID('dbo.Departments', 'U') IS NOT NULL
BEGIN
    EXEC sp_rename N'dbo.Departments', N'departments';
    EXEC sp_rename N'dbo.departments.Id', N'id', 'COLUMN';
    EXEC sp_rename N'dbo.departments.Code', N'code', 'COLUMN';
    EXEC sp_rename N'dbo.departments.Name', N'name', 'COLUMN';
    EXEC sp_rename N'dbo.departments.Address', N'address', 'COLUMN';
    EXEC sp_rename N'dbo.departments.Description', N'description', 'COLUMN';
    EXEC sp_rename N'dbo.departments.IsActive', N'is_active', 'COLUMN';
    EXEC sp_rename N'dbo.departments.CreatedAt', N'created_at', 'COLUMN';
END;
GO

IF OBJECT_ID('dbo.Employees', 'U') IS NOT NULL
BEGIN
    EXEC sp_rename N'dbo.Employees', N'employees';
    EXEC sp_rename N'dbo.employees.Id', N'id', 'COLUMN';
    EXEC sp_rename N'dbo.employees.DepartmentId', N'department_id', 'COLUMN';
    EXEC sp_rename N'dbo.employees.EmployeeCode', N'employee_code', 'COLUMN';
    EXEC sp_rename N'dbo.employees.FirstName', N'first_name', 'COLUMN';
    EXEC sp_rename N'dbo.employees.LastName', N'last_name', 'COLUMN';
    EXEC sp_rename N'dbo.employees.Email', N'email', 'COLUMN';
    EXEC sp_rename N'dbo.employees.Phone', N'phone', 'COLUMN';
    EXEC sp_rename N'dbo.employees.Gender', N'gender', 'COLUMN';
    EXEC sp_rename N'dbo.employees.DateOfBirth', N'date_of_birth', 'COLUMN';
    EXEC sp_rename N'dbo.employees.DateJoined', N'date_joined', 'COLUMN';
    EXEC sp_rename N'dbo.employees.JobTitle', N'job_title', 'COLUMN';
    EXEC sp_rename N'dbo.employees.Address', N'address', 'COLUMN';
    EXEC sp_rename N'dbo.employees.PhotoUrl', N'photo_path', 'COLUMN';
    EXEC sp_rename N'dbo.employees.IsActive', N'is_active', 'COLUMN';
    EXEC sp_rename N'dbo.employees.CreatedAt', N'created_at', 'COLUMN';
END;
GO

IF OBJECT_ID('dbo.departments', 'U') IS NULL
BEGIN
    CREATE TABLE departments (
        id int IDENTITY NOT NULL CONSTRAINT pk_departments PRIMARY KEY,
        code nvarchar(20) NOT NULL,
        name nvarchar(100) NOT NULL,
        address nvarchar(300) NULL,
        description nvarchar(500) NULL,
        is_active bit NOT NULL CONSTRAINT df_departments_is_active DEFAULT 1,
        created_at datetime2 NOT NULL CONSTRAINT df_departments_created_at DEFAULT SYSUTCDATETIME()
    );
END;
GO

IF OBJECT_ID('dbo.employees', 'U') IS NULL
BEGIN
    CREATE TABLE employees (
        id int IDENTITY NOT NULL CONSTRAINT pk_employees PRIMARY KEY,
        department_id int NOT NULL,
        employee_code nvarchar(20) NOT NULL,
        first_name nvarchar(100) NOT NULL,
        last_name nvarchar(100) NOT NULL,
        email nvarchar(150) NOT NULL,
        phone nvarchar(30) NULL,
        gender nvarchar(20) NOT NULL,
        date_of_birth date NOT NULL,
        date_joined date NOT NULL,
        job_title nvarchar(100) NOT NULL,
        address nvarchar(300) NULL,
        photo_path nvarchar(500) NULL,
        is_active bit NOT NULL CONSTRAINT df_employees_is_active DEFAULT 1,
        created_at datetime2 NOT NULL CONSTRAINT df_employees_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT fk_employees_departments FOREIGN KEY (department_id)
            REFERENCES departments(id)
    );
END;
GO

IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'PK_Departments')
    EXEC sp_rename N'dbo.PK_Departments', N'pk_departments', 'OBJECT';
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'PK_Employees')
    EXEC sp_rename N'dbo.PK_Employees', N'pk_employees', 'OBJECT';
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Employees_Departments_DepartmentId')
    EXEC sp_rename N'dbo.FK_Employees_Departments_DepartmentId', N'fk_employees_departments', 'OBJECT';
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Departments_Code')
    EXEC sp_rename N'dbo.departments.IX_Departments_Code', N'ux_departments_code', 'INDEX';
ELSE IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_departments_code')
    CREATE UNIQUE INDEX ux_departments_code ON departments(code);

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Departments_Name')
    EXEC sp_rename N'dbo.departments.IX_Departments_Name', N'ux_departments_name', 'INDEX';
ELSE IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_departments_name')
    CREATE UNIQUE INDEX ux_departments_name ON departments(name);

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Employees_DepartmentId')
    EXEC sp_rename N'dbo.employees.IX_Employees_DepartmentId', N'ix_employees_department_id', 'INDEX';
ELSE IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ix_employees_department_id')
    CREATE INDEX ix_employees_department_id ON employees(department_id);

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Employees_Email')
    EXEC sp_rename N'dbo.employees.IX_Employees_Email', N'ux_employees_email', 'INDEX';
ELSE IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_employees_email')
    CREATE UNIQUE INDEX ux_employees_email ON employees(email);

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Employees_EmployeeCode')
    EXEC sp_rename N'dbo.employees.IX_Employees_EmployeeCode', N'ux_employees_employee_code', 'INDEX';
ELSE IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_employees_employee_code')
    CREATE UNIQUE INDEX ux_employees_employee_code ON employees(employee_code);
GO
