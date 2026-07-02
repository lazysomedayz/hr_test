using System.Text.Json;
using Dapper;
using HrManagement.Api.Data;
using HrManagement.Api.Repositories;
using HrManagement.Api.Services;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

DefaultTypeMap.MatchNamesWithUnderscores = true;
SqlMapper.AddTypeHandler(new DateOnlyTypeHandler());
QuestPDF.Settings.License = LicenseType.Community;
QuestPDF.Settings.UseEnvironmentFonts = true;
QuestPDF.Settings.FontDiscoveryPaths.Add(Path.Combine(AppContext.BaseDirectory, "Assets", "Fonts"));

builder.Services.AddSingleton<SqlConnectionFactory>();
builder.Services.AddSingleton<DatabaseMigrator>();
builder.Services.AddScoped<DepartmentRepository>();
builder.Services.AddScoped<EmployeeRepository>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
    options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower;
});
builder.Services.AddOpenApi();
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
await app.Services.GetRequiredService<DatabaseMigrator>().MigrateAsync();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors("Frontend");
app.UseStaticFiles();
app.MapControllers();
app.Run();

public partial class Program;
