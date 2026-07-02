using System.Reflection;
using System.Text.RegularExpressions;
using Dapper;

namespace HrManagement.Api.Data;

public class DatabaseMigrator(SqlConnectionFactory connections)
{
    public async Task MigrateAsync()
    {
        await using var connection = connections.Create();
        await connection.OpenAsync();
        await connection.ExecuteAsync("""
            IF OBJECT_ID('schema_migrations', 'U') IS NULL
                CREATE TABLE schema_migrations (
                    migration_name nvarchar(255) NOT NULL
                        CONSTRAINT pk_schema_migrations PRIMARY KEY,
                    applied_at datetime2 NOT NULL
                        CONSTRAINT df_schema_migrations_applied_at DEFAULT SYSUTCDATETIME()
                );
            """);

        var applied = (await connection.QueryAsync<string>(
            "SELECT migration_name FROM schema_migrations")).ToHashSet();

        var assembly = Assembly.GetExecutingAssembly();
        var scripts = assembly.GetManifestResourceNames()
            .Where(name => name.Contains(".Data.Migrations.") && name.EndsWith(".sql"))
            .OrderBy(name => name);

        foreach (var resourceName in scripts)
        {
            var migrationName = resourceName[(resourceName.LastIndexOf(".Migrations.", StringComparison.Ordinal) + 12)..];
            if (applied.Contains(migrationName)) continue;

            await using var stream = assembly.GetManifestResourceStream(resourceName)!;
            using var reader = new StreamReader(stream);
            var sql = await reader.ReadToEndAsync();
            await using var transaction = await connection.BeginTransactionAsync();
            try
            {
                foreach (var batch in Regex.Split(sql, @"^\s*GO\s*$",
                             RegexOptions.Multiline | RegexOptions.IgnoreCase))
                    if (!string.IsNullOrWhiteSpace(batch))
                        await connection.ExecuteAsync(batch, transaction: transaction);

                await connection.ExecuteAsync(
                    "INSERT INTO schema_migrations (migration_name) VALUES (@migrationName)",
                    new { migrationName }, transaction);
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}
