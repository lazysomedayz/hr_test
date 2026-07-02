using Microsoft.Data.SqlClient;

namespace HrManagement.Api.Data;

public class SqlConnectionFactory(IConfiguration configuration)
{
    private readonly string _connectionString = configuration.GetConnectionString("HrDatabase")
        ?? throw new InvalidOperationException("Connection string 'HrDatabase' is missing.");

    public SqlConnection Create() => new(_connectionString);
}
