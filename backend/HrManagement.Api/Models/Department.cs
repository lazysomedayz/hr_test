namespace HrManagement.Api.Models;

public class Department
{
    public int Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Address { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public bool IsDefault { get; set; }
    public int EmployeeCount { get; set; }
}
