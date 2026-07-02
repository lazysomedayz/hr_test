IF COL_LENGTH('dbo.departments', 'deleted_at') IS NULL
    ALTER TABLE departments ADD deleted_at datetime2 NULL;

IF COL_LENGTH('dbo.employees', 'deleted_at') IS NULL
    ALTER TABLE employees ADD deleted_at datetime2 NULL;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_departments_code' AND object_id = OBJECT_ID('dbo.departments'))
    DROP INDEX ux_departments_code ON departments;
CREATE UNIQUE INDEX ux_departments_code ON departments(code) WHERE deleted_at IS NULL;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_departments_name' AND object_id = OBJECT_ID('dbo.departments'))
    DROP INDEX ux_departments_name ON departments;
CREATE UNIQUE INDEX ux_departments_name ON departments(name) WHERE deleted_at IS NULL;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_employees_email' AND object_id = OBJECT_ID('dbo.employees'))
    DROP INDEX ux_employees_email ON employees;
CREATE UNIQUE INDEX ux_employees_email ON employees(email) WHERE deleted_at IS NULL;
GO
