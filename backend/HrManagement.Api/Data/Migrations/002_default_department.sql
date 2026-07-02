IF COL_LENGTH('departments', 'is_default') IS NULL
BEGIN
    ALTER TABLE departments
        ADD is_default bit NOT NULL
            CONSTRAINT df_departments_is_default DEFAULT 0;
END;
GO

IF NOT EXISTS (SELECT 1 FROM departments WHERE is_default = 1)
BEGIN
    IF EXISTS (SELECT 1 FROM departments WHERE code = 'CENTRAL')
        UPDATE departments SET is_default = 1, is_active = 1 WHERE code = 'CENTRAL';
    ELSE
        INSERT INTO departments
            (code, name, address, description, is_active, is_default, created_at)
        VALUES
            ('CENTRAL', N'แผนกกลาง', NULL,
             N'แผนกเริ่มต้นสำหรับพักพนักงานระหว่างการปรับโครงสร้างองค์กร',
             1, 1, SYSUTCDATETIME());
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'ux_departments_default')
    CREATE UNIQUE INDEX ux_departments_default ON departments(is_default)
        WHERE is_default = 1;
GO
