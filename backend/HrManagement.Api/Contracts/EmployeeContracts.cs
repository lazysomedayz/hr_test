using System.ComponentModel.DataAnnotations;

namespace HrManagement.Api.Contracts;

public class EmployeeRequest : IValidatableObject
{
    [Range(1, int.MaxValue)]
    public int DepartmentId { get; set; }

    [StringLength(20)]
    public string EmployeeCode { get; set; } = "";

    [Required, StringLength(100, MinimumLength = 2)]
    public string FirstName { get; set; } = "";

    [Required, StringLength(100, MinimumLength = 2)]
    public string LastName { get; set; } = "";

    [Required, EmailAddress, StringLength(150)]
    public string Email { get; set; } = "";

    [Phone, StringLength(30)]
    public string? Phone { get; set; }

    [Required, RegularExpression("^(Male|Female|Other)$")]
    public string Gender { get; set; } = "";

    public DateOnly DateOfBirth { get; set; }
    public DateOnly DateJoined { get; set; }

    [Required, StringLength(100, MinimumLength = 2)]
    public string JobTitle { get; set; } = "";

    [StringLength(300)]
    public string? Address { get; set; }

    public string? PhotoPath { get; set; }

    public bool IsActive { get; set; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        if (DateOfBirth == default || DateOfBirth > today.AddYears(-15))
            yield return new("Employee must be at least 15 years old.", [nameof(DateOfBirth)]);
        if (DateJoined == default || DateJoined > today)
            yield return new("Date joined cannot be in the future.", [nameof(DateJoined)]);
        if (DateOfBirth != default && DateJoined != default && DateJoined < DateOfBirth.AddYears(15))
            yield return new("Date joined must be after the employee turns 15.", [nameof(DateJoined)]);
    }
}

public record EmployeeResponse(
    int Id, int DepartmentId, string DepartmentName, string EmployeeCode,
    string FirstName, string LastName, string Email, string? Phone, string Gender,
    DateOnly DateOfBirth, DateOnly DateJoined, string JobTitle, string? Address,
    string? PhotoPath, bool IsActive);
