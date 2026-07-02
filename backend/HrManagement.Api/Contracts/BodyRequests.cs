namespace HrManagement.Api.Contracts;

public class IdRequest
{
    public int Id { get; set; }
}

public class EmployeeSearchRequest
{
    public int Page { get; set; } = 1;

    public int Size { get; set; } = 10;

    public string? Search { get; set; }

    public int? DepartmentId { get; set; }

    public string? Status { get; set; }

    public string? SortBy { get; set; }

    public string? SortDirection { get; set; }
}

public class EmployeeReportRequest
{
    public int? DepartmentId { get; set; }

    public string? Status { get; set; }

    public string? Period { get; set; }

    public DateOnly? DateFrom { get; set; }

    public DateOnly? DateTo { get; set; }
}
