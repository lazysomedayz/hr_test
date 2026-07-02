using HrManagement.Api.Contracts;
using HrManagement.Api.Models;
using HrManagement.Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace HrManagement.Api.Controllers;

[ApiController, Route("api/employees")]
public class EmployeesController(EmployeeRepository employees) : ControllerBase
{
    [HttpPost("search")]
    public async Task<ActionResult<PagedResult<Employee>>> Search([FromBody] EmployeeSearchRequest request)
    {
        if (request.Page < 1 || request.Size is < 1 or > 100)
            return BadRequest(new { message = "Page must be at least 1 and size must be between 1 and 100." });
        return Ok(await employees.GetPagedAsync(
            request.Page, request.Size, request.Search, request.DepartmentId,
            request.Status, request.SortBy, request.SortDirection != "desc"));
    }

    [HttpPost("detail")]
    public async Task<ActionResult<Employee>> Get([FromBody] IdRequest request)
    {
        var employee = await employees.GetAsync(request.Id);
        return employee is null ? NotFound() : Ok(employee);
    }

    [HttpGet("next-code")]
    public async Task<ActionResult> GetNextCode()
        => Ok(new { employee_code = await employees.GetNextCodePreviewAsync() });

    [HttpPost]
    public async Task<ActionResult<Employee>> Create([FromBody] EmployeeRequest request)
    {
        Normalize(request);
        var error = await employees.ValidateAsync(request);
        if (error is not null) return Conflict(new { message = error });
        var id = await employees.CreateAsync(request);
        return StatusCode(StatusCodes.Status201Created, await employees.GetAsync(id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Employee>> Update(int id, [FromBody] EmployeeRequest request)
    {
        Normalize(request);
        var error = await employees.ValidateAsync(request, id);
        if (error is not null) return Conflict(new { message = error });
        if (!await employees.UpdateAsync(id, request)) return NotFound();
        return Ok(await employees.GetAsync(id));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
        => await employees.DeleteAsync(id) ? NoContent() : NotFound();

    [HttpPatch("status")]
    public async Task<ActionResult> UpdateStatus([FromBody] BulkStatusRequest request)
    {
        var updated = await employees.UpdateStatusAsync(request.EmployeeIds, request.IsActive);
        return Ok(new { updated_count = updated });
    }

    private static void Normalize(EmployeeRequest request)
    {
        request.EmployeeCode = request.EmployeeCode.Trim().ToUpperInvariant();
        request.FirstName = request.FirstName.Trim();
        request.LastName = request.LastName.Trim();
        request.Email = request.Email.Trim().ToLowerInvariant();
        request.JobTitle = request.JobTitle.Trim();
        request.Phone = Clean(request.Phone);
        request.Address = Clean(request.Address);
        request.PhotoPath = Clean(request.PhotoPath);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
