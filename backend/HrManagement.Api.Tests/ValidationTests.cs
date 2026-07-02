using System.ComponentModel.DataAnnotations;
using HrManagement.Api.Contracts;

namespace HrManagement.Api.Tests;

public class ValidationTests
{
    [Fact]
    public void EmployeeRequest_RejectsInvalidEmail()
    {
        var request = ValidEmployee();
        request.Email = "not-an-email";

        var errors = Validate(request);

        Assert.Contains(errors, x => x.MemberNames.Contains(nameof(EmployeeRequest.Email)));
    }

    [Fact]
    public void EmployeeRequest_RejectsInvalidDates()
    {
        var request = ValidEmployee();
        request.DateOfBirth = DateOnly.FromDateTime(DateTime.Today).AddYears(-14);
        request.DateJoined = DateOnly.FromDateTime(DateTime.Today).AddDays(1);

        var errors = Validate(request);

        Assert.Contains(errors, x => x.MemberNames.Contains(nameof(EmployeeRequest.DateOfBirth)));
        Assert.Contains(errors, x => x.MemberNames.Contains(nameof(EmployeeRequest.DateJoined)));
    }

    [Fact]
    public void EmployeeRequest_AcceptsValidData()
    {
        Assert.Empty(Validate(ValidEmployee()));
    }

    [Fact]
    public void DepartmentRequest_RequiresCodeAndName()
    {
        var errors = Validate(new DepartmentRequest());

        Assert.Contains(errors, x => x.MemberNames.Contains(nameof(DepartmentRequest.Code)));
        Assert.Contains(errors, x => x.MemberNames.Contains(nameof(DepartmentRequest.Name)));
    }

    private static EmployeeRequest ValidEmployee() => new()
    {
        DepartmentId = 1,
        EmployeeCode = "EMP001",
        FirstName = "Somchai",
        LastName = "Jaidee",
        Email = "somchai@example.com",
        Gender = "Male",
        DateOfBirth = new DateOnly(1995, 1, 1),
        DateJoined = new DateOnly(2024, 1, 1),
        JobTitle = "Developer"
    };

    private static List<ValidationResult> Validate(object model)
    {
        var results = new List<ValidationResult>();
        Validator.TryValidateObject(model, new ValidationContext(model), results, true);
        return results;
    }
}
