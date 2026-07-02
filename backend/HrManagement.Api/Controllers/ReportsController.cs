using HrManagement.Api.Contracts;
using HrManagement.Api.Models;
using HrManagement.Api.Repositories;
using HrManagement.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace HrManagement.Api.Controllers;

[ApiController, Route("api/reports")]
public class ReportsController(
    EmployeeRepository employees,
    DepartmentRepository departments,
    ReportService reports) : ControllerBase
{
    [HttpPost("employees.pdf")]
    public async Task<IActionResult> EmployeeReport([FromBody] EmployeeReportRequest request)
    {
        if (request.DateFrom > request.DateTo)
            return BadRequest(new { message = "date_from must not be later than date_to." });

        var employeeList = (await employees.GetAllAsync(null, request.DepartmentId)).ToList();
        if (request.Status is "active")
            employeeList = employeeList.Where(employee => employee.IsActive).ToList();
        else if (request.Status is "inactive")
            employeeList = employeeList.Where(employee => !employee.IsActive).ToList();
        if (request.DateFrom is not null)
            employeeList = employeeList.Where(employee => employee.DateJoined >= request.DateFrom).ToList();
        if (request.DateTo is not null)
            employeeList = employeeList.Where(employee => employee.DateJoined <= request.DateTo).ToList();

        var departmentList = (await departments.GetAllAsync()).ToList();
        var filterDescription = BuildFilterDescription(
            request.DepartmentId, request.Status, request.Period,
            request.DateFrom, request.DateTo, departmentList);
        var pdf = reports.GenerateEmployeeReport(employeeList, departmentList, filterDescription);
        var fileName = $"employee-report-{DateTime.Now:yyyyMMdd-HHmm}.pdf";
        return File(pdf, "application/pdf", fileName);
    }

    private static string BuildFilterDescription(
        int? departmentId,
        string? status,
        string? period,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        IReadOnlyCollection<Department> departments)
    {
        var department = departmentId is null
            ? "ทุกแผนก"
            : departments.FirstOrDefault(item => item.Id == departmentId)?.Name ?? "ไม่พบแผนก";
        var statusText = status switch
        {
            "active" => "กำลังทำงาน",
            "inactive" => "พ้นสภาพ",
            _ => "ทุกสถานะ"
        };
        var periodText = period switch
        {
            "daily" => "รายวัน",
            "monthly" => "รายเดือน",
            "yearly" => "รายปี",
            "custom" => "กำหนดช่วงเอง",
            _ => "ทุกช่วงเวลา"
        };
        var dateText = dateFrom is null && dateTo is null
            ? "ไม่จำกัดวันที่เริ่มงาน"
            : $"วันที่เริ่มงาน {FormatThaiDate(dateFrom)} ถึง {FormatThaiDate(dateTo)}";
        return $"เงื่อนไข: แผนก {department} | สถานะ {statusText} | {periodText} | {dateText}";
    }

    private static string FormatThaiDate(DateOnly? date) =>
        date is null ? "ไม่จำกัด" : $"{date.Value.Day:00}/{date.Value.Month:00}/{date.Value.Year + 543}";
}
