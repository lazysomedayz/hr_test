using Dapper;
using HrManagement.Api.Contracts;
using HrManagement.Api.Data;
using HrManagement.Api.Models;

namespace HrManagement.Api.Repositories;

public class DepartmentRepository(SqlConnectionFactory connections)
{
    private const string SelectSql = """
        SELECT d.id, d.code, d.name, d.address, d.description, d.is_active, d.is_default,
               COUNT(e.id) AS employee_count
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id AND e.deleted_at IS NULL
        """;

    public async Task<IEnumerable<Department>> GetAllAsync()
    {
        await using var db = connections.Create();
        return await db.QueryAsync<Department>(
            $"{SelectSql} WHERE d.deleted_at IS NULL GROUP BY d.id, d.code, d.name, d.address, d.description, d.is_active, d.is_default ORDER BY d.is_default DESC, d.name");
    }

    public async Task<Department?> GetAsync(int id)
    {
        await using var db = connections.Create();
        return await db.QuerySingleOrDefaultAsync<Department>(
            $"{SelectSql} WHERE d.id = @id AND d.deleted_at IS NULL GROUP BY d.id, d.code, d.name, d.address, d.description, d.is_active, d.is_default",
            new { id });
    }

    public async Task<bool> ExistsAsync(string code, string name, int? exceptId = null)
    {
        await using var db = connections.Create();
        return await db.ExecuteScalarAsync<bool>(
            "SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM departments WHERE deleted_at IS NULL AND id <> COALESCE(@exceptId, 0) AND (code = @code OR name = @name)) THEN 1 ELSE 0 END AS bit)",
            new { code, name, exceptId });
    }

    public async Task<int> CreateAsync(DepartmentRequest request)
    {
        await using var db = connections.Create();
        await db.OpenAsync();
        await using var transaction = await db.BeginTransactionAsync();
        var id = await db.ExecuteScalarAsync<int>("""
            INSERT INTO departments (code, name, address, description, is_active, created_at)
            OUTPUT INSERTED.id
            VALUES (@Code, @Name, @Address, @Description, @IsActive, SYSUTCDATETIME())
            """, request, transaction);
        await transaction.CommitAsync();
        return id;
    }

    public async Task<bool> UpdateAsync(int id, DepartmentRequest request)
    {
        await using var db = connections.Create();
        await db.OpenAsync();
        await using var transaction = await db.BeginTransactionAsync();
        var updated = await db.ExecuteAsync("""
            UPDATE departments SET code=@Code, name=@Name, address=@Address,
                description=@Description, is_active=@IsActive WHERE id=@id AND deleted_at IS NULL
            """, new { id, request.Code, request.Name, request.Address, request.Description, request.IsActive }, transaction) > 0;
        await transaction.CommitAsync();
        return updated;
    }

    public async Task<(bool Found, bool HasEmployees)> DeleteAsync(int id)
    {
        await using var db = connections.Create();
        await db.OpenAsync();
        await using var transaction = await db.BeginTransactionAsync();
        var exists = await db.ExecuteScalarAsync<bool>(
            "SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM departments WHERE id=@id AND is_default=0 AND deleted_at IS NULL) THEN 1 ELSE 0 END AS bit)",
            new { id }, transaction);
        if (!exists) return (false, false);
        var hasEmployees = await db.ExecuteScalarAsync<bool>(
            "SELECT CAST(CASE WHEN EXISTS (SELECT 1 FROM employees WHERE department_id=@id AND deleted_at IS NULL) THEN 1 ELSE 0 END AS bit)",
            new { id }, transaction);
        if (hasEmployees) return (true, true);
        await db.ExecuteAsync(
            "UPDATE departments SET deleted_at=SYSUTCDATETIME(), is_active=0 WHERE id=@id",
            new { id }, transaction);
        await transaction.CommitAsync();
        return (true, false);
    }

    public async Task<bool> SetActiveAsync(int id, bool isActive)
    {
        await using var db = connections.Create();
        return await db.ExecuteAsync("""
            UPDATE departments SET is_active=@isActive
            WHERE id=@id AND deleted_at IS NULL AND (is_default=0 OR @isActive=1)
            """, new { id, isActive }) > 0;
    }

    public async Task<int?> MoveEmployeesToDefaultAsync(int sourceDepartmentId)
    {
        await using var db = connections.Create();
        var defaultId = await db.QuerySingleOrDefaultAsync<int?>(
            "SELECT id FROM departments WHERE is_default=1 AND is_active=1 AND deleted_at IS NULL");
        if (defaultId is null || defaultId == sourceDepartmentId) return null;
        return await db.ExecuteAsync("""
            UPDATE employees SET department_id=@defaultId
            WHERE department_id=@sourceDepartmentId AND deleted_at IS NULL
            """, new { defaultId, sourceDepartmentId });
    }
}
