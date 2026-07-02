using Dapper;
using HrManagement.Api.Contracts;
using HrManagement.Api.Data;
using HrManagement.Api.Models;

namespace HrManagement.Api.Repositories;

public class EmployeeRepository(SqlConnectionFactory connections)
{
    private const string SelectSql = """
        SELECT e.id, e.department_id, d.name AS department_name, e.employee_code,
               e.first_name, e.last_name, e.email, e.phone, e.gender,
               e.date_of_birth, e.date_joined, e.job_title, e.address,
               e.photo_path, e.is_active
        FROM employees e
        JOIN departments d ON d.id = e.department_id
        """;

    public async Task<IEnumerable<Employee>> GetAllAsync(string? search, int? departmentId)
    {
        await using var db = connections.Create();
        return await db.QueryAsync<Employee>($"""
            {SelectSql}
            WHERE e.deleted_at IS NULL
              AND (@search IS NULL OR e.employee_code LIKE '%' + @search + '%'
                OR e.first_name LIKE '%' + @search + '%' OR e.last_name LIKE '%' + @search + '%'
                OR e.email LIKE '%' + @search + '%')
              AND (@departmentId IS NULL OR e.department_id = @departmentId)
            ORDER BY e.first_name, e.last_name
            """, new { search = Clean(search), departmentId });
    }

    public async Task<PagedResult<Employee>> GetPagedAsync(
        int page,
        int size,
        string? search,
        int? departmentId,
        string? status,
        string? sortBy,
        bool ascending)
    {
        var direction = ascending ? "ASC" : "DESC";
        var orderBy = sortBy switch
        {
            "employee_code" => "e.employee_code",
            "job_title" => "e.job_title",
            "date_joined" => "e.date_joined",
            "is_active" => "e.is_active",
            _ => $"e.first_name {direction}, e.last_name"
        };
        var offset = (page - 1) * size;
        var parameters = new
        {
            search = Clean(search),
            departmentId,
            isActive = status == "active" ? true : status == "inactive" ? (bool?)false : null,
            offset,
            size
        };

        await using var db = connections.Create();
        using var result = await db.QueryMultipleAsync($"""
            SELECT COUNT(*) AS total_count,
                   ISNULL(SUM(CASE WHEN e.is_active = 1 THEN 1 ELSE 0 END), 0) AS active_count,
                   ISNULL(SUM(CASE WHEN e.is_active = 0 THEN 1 ELSE 0 END), 0) AS inactive_count
            FROM employees e
            WHERE e.deleted_at IS NULL
              AND (@search IS NULL OR e.employee_code LIKE '%' + @search + '%'
                OR e.first_name LIKE '%' + @search + '%' OR e.last_name LIKE '%' + @search + '%'
                OR e.email LIKE '%' + @search + '%' OR e.phone LIKE '%' + @search + '%'
                OR e.job_title LIKE '%' + @search + '%')
              AND (@departmentId IS NULL OR e.department_id = @departmentId);

            {SelectSql}
            WHERE e.deleted_at IS NULL
              AND (@search IS NULL OR e.employee_code LIKE '%' + @search + '%'
                OR e.first_name LIKE '%' + @search + '%' OR e.last_name LIKE '%' + @search + '%'
                OR e.email LIKE '%' + @search + '%' OR e.phone LIKE '%' + @search + '%'
                OR e.job_title LIKE '%' + @search + '%')
              AND (@departmentId IS NULL OR e.department_id = @departmentId)
              AND (@isActive IS NULL OR e.is_active = @isActive)
            ORDER BY {orderBy} {direction}, e.id {direction}
            OFFSET @offset ROWS FETCH NEXT @size ROWS ONLY;
            """, parameters);

        var counts = await result.ReadSingleAsync<EmployeeCounts>();
        var items = (await result.ReadAsync<Employee>()).ToList();
        var totalCount = status switch
        {
            "active" => counts.ActiveCount,
            "inactive" => counts.InactiveCount,
            _ => counts.TotalCount
        };
        return new(items, page, size, totalCount, counts.TotalCount, counts.ActiveCount, counts.InactiveCount);
    }

    public async Task<Employee?> GetAsync(int id)
    {
        await using var db = connections.Create();
        return await db.QuerySingleOrDefaultAsync<Employee>(
            $"{SelectSql} WHERE e.id=@id AND e.deleted_at IS NULL AND d.deleted_at IS NULL", new { id });
    }

    public async Task<string> GetNextCodePreviewAsync()
    {
        await using var db = connections.Create();
        var nextNumber = await db.ExecuteScalarAsync<long>("""
            SELECT CASE
                WHEN last_used_value IS NULL THEN CONVERT(bigint, start_value)
                ELSE CONVERT(bigint, current_value) + CONVERT(bigint, increment)
            END
            FROM sys.sequences
            WHERE name = 'employee_code_seq' AND schema_id = SCHEMA_ID('dbo')
            """);
        return FormatEmployeeCode(nextNumber);
    }

    public async Task<string?> ValidateAsync(EmployeeRequest request, int? exceptId = null)
    {
        await using var db = connections.Create();
        if (!await db.ExecuteScalarAsync<bool>(
                "SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM departments WHERE id=@DepartmentId AND is_active=1 AND deleted_at IS NULL) THEN 1 ELSE 0 END AS bit)",
                request))
            return "Please select an active department.";
        if (await db.ExecuteScalarAsync<bool>(
                "SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM employees WHERE deleted_at IS NULL AND id <> COALESCE(@exceptId, 0) AND email=@Email) THEN 1 ELSE 0 END AS bit)",
                new { exceptId, request.Email }))
            return "Email already exists.";
        return null;
    }

    public async Task<int> CreateAsync(EmployeeRequest request)
    {
        await using var db = connections.Create();
        await db.OpenAsync();
        await using var transaction = await db.BeginTransactionAsync();
        var id = await db.ExecuteScalarAsync<int>("""
            DECLARE @employee_number bigint = NEXT VALUE FOR dbo.employee_code_seq;
            DECLARE @employee_code varchar(20) = CONCAT(
                'EMP',
                CASE WHEN @employee_number < 10000
                    THEN RIGHT('0000' + CONVERT(varchar(16), @employee_number), 4)
                    ELSE CONVERT(varchar(16), @employee_number)
                END);

            INSERT INTO employees (department_id, employee_code, first_name, last_name,
                email, phone, gender, date_of_birth, date_joined, job_title, address,
                photo_path, is_active, created_at)
            OUTPUT INSERTED.id
            VALUES (@DepartmentId, @employee_code, @FirstName, @LastName, @Email, @Phone,
                @Gender, @DateOfBirth, @DateJoined, @JobTitle, @Address, @PhotoPath, @IsActive,
                SYSUTCDATETIME())
            """, request, transaction);
        await transaction.CommitAsync();
        return id;
    }

    public async Task<bool> UpdateAsync(int id, EmployeeRequest request)
    {
        await using var db = connections.Create();
        await db.OpenAsync();
        await using var transaction = await db.BeginTransactionAsync();
        var updated = await db.ExecuteAsync("""
            UPDATE employees SET department_id=@DepartmentId,
                first_name=@FirstName, last_name=@LastName, email=@Email, phone=@Phone,
                gender=@Gender, date_of_birth=@DateOfBirth, date_joined=@DateJoined,
                job_title=@JobTitle, address=@Address, photo_path=@PhotoPath, is_active=@IsActive
            WHERE id=@id AND deleted_at IS NULL
            """, new
        {
            id, request.DepartmentId, request.FirstName, request.LastName,
            request.Email, request.Phone, request.Gender, request.DateOfBirth, request.DateJoined,
            request.JobTitle, request.Address, request.PhotoPath, request.IsActive
        }, transaction) > 0;
        await transaction.CommitAsync();
        return updated;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        await using var db = connections.Create();
        return await db.ExecuteAsync(
            "UPDATE employees SET deleted_at=SYSUTCDATETIME(), is_active=0 WHERE id=@id AND deleted_at IS NULL",
            new { id }) > 0;
    }

    public async Task<int> UpdateStatusAsync(int[] employeeIds, bool isActive)
    {
        await using var db = connections.Create();
        return await db.ExecuteAsync(
            "UPDATE employees SET is_active=@isActive WHERE deleted_at IS NULL AND id IN @employeeIds",
            new { employeeIds, isActive });
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static string FormatEmployeeCode(long number) => $"EMP{number:0000}";

    private sealed class EmployeeCounts
    {
        public int TotalCount { get; init; }
        public int ActiveCount { get; init; }
        public int InactiveCount { get; init; }
    }
}
