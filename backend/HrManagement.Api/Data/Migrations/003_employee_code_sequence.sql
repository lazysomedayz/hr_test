IF NOT EXISTS (SELECT 1 FROM sys.sequences WHERE name = 'employee_code_seq' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    DECLARE @next_value bigint = ISNULL((
        SELECT MAX(TRY_CONVERT(bigint, SUBSTRING(employee_code, 4, 30))) + 1
        FROM employees
        WHERE employee_code LIKE 'EMP%'
    ), 1);

    EXEC(N'CREATE SEQUENCE dbo.employee_code_seq
        AS bigint
        START WITH ' + @next_value + N'
        INCREMENT BY 1
        MINVALUE 1
        NO CYCLE
        CACHE 20;');
END;
