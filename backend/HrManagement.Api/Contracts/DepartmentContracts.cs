using System.ComponentModel.DataAnnotations;

namespace HrManagement.Api.Contracts;

public class DepartmentRequest
{
    [Required, StringLength(20, MinimumLength = 2)]
    public string Code { get; set; } = "";

    [Required, StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = "";

    [StringLength(300)]
    public string? Address { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

public record DepartmentResponse(
    int Id, string Code, string Name, string? Address, string? Description,
    bool IsActive, int EmployeeCount);
