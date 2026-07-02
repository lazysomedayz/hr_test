namespace HrManagement.Api.Models;

public class Employee
{
    public int Id { get; set; }
    public int DepartmentId { get; set; }
    public required string DepartmentName { get; set; }
    public required string EmployeeCode { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Email { get; set; }
    public string? Phone { get; set; }
    public required string Gender { get; set; }
    public DateOnly DateOfBirth { get; set; }
    public DateOnly DateJoined { get; set; }
    public required string JobTitle { get; set; }
    public string? Address { get; set; }
    public string? PhotoPath { get; set; }
    public bool IsActive { get; set; }
}
