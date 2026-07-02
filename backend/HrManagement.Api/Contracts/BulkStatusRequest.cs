using System.ComponentModel.DataAnnotations;

namespace HrManagement.Api.Contracts;

public class BulkStatusRequest
{
    [MinLength(1)]
    public required int[] EmployeeIds { get; set; }
    public bool IsActive { get; set; }
}
