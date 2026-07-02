using HrManagement.Api.Contracts;
using HrManagement.Api.Models;
using HrManagement.Api.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace HrManagement.Api.Controllers;

[ApiController, Route("api/departments")]
public class DepartmentsController(DepartmentRepository departments) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<Department>> GetAll() => await departments.GetAllAsync();

    [HttpPost("detail")]
    public async Task<ActionResult<Department>> Get([FromBody] IdRequest request)
    {
        var department = await departments.GetAsync(request.Id);
        return department is null ? NotFound() : Ok(department);
    }

    [HttpPost]
    public async Task<ActionResult<Department>> Create([FromBody] DepartmentRequest request)
    {
        Normalize(request);
        if (await departments.ExistsAsync(request.Code, request.Name))
            return Conflict(new { message = "Department code or name already exists." });
        var id = await departments.CreateAsync(request);
        return StatusCode(StatusCodes.Status201Created, await departments.GetAsync(id));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Department>> Update(int id, [FromBody] DepartmentRequest request)
    {
        Normalize(request);
        var current = await departments.GetAsync(id);
        if (current is null) return NotFound();
        if (current.IsDefault && !request.IsActive)
            return Conflict(new { message = "The default department cannot be deactivated." });
        if (await departments.ExistsAsync(request.Code, request.Name, id))
            return Conflict(new { message = "Department code or name already exists." });
        if (!await departments.UpdateAsync(id, request)) return NotFound();
        return Ok(await departments.GetAsync(id));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<Department>> SetStatus(int id, [FromBody] DepartmentStatusRequest request)
    {
        var current = await departments.GetAsync(id);
        if (current is null) return NotFound();
        if (current.IsDefault && !request.IsActive)
            return Conflict(new { message = "The default department cannot be deactivated." });
        if (!request.IsActive && current.EmployeeCount > 0)
            return Conflict(new { message = "Move employees out before deactivating this department." });
        await departments.SetActiveAsync(id, request.IsActive);
        return Ok(await departments.GetAsync(id));
    }

    [HttpPost("{id:int}/move-employees-to-default")]
    public async Task<ActionResult> MoveEmployeesToDefault(int id)
    {
        var current = await departments.GetAsync(id);
        if (current is null) return NotFound();
        if (current.IsDefault)
            return Conflict(new { message = "Employees are already in the default department." });
        var moved = await departments.MoveEmployeesToDefaultAsync(id);
        return moved is null
            ? Conflict(new { message = "An active default department was not found." })
            : Ok(new { moved_count = moved });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var current = await departments.GetAsync(id);
        if (current is null) return NotFound();
        if (current.IsDefault)
            return Conflict(new { message = "The default department cannot be deleted." });
        var result = await departments.DeleteAsync(id);
        if (!result.Found) return NotFound();
        return result.HasEmployees
            ? Conflict(new { message = "Move or delete employees in this department first." })
            : NoContent();
    }

    private static void Normalize(DepartmentRequest request)
    {
        request.Code = request.Code.Trim().ToUpperInvariant();
        request.Name = request.Name.Trim();
        request.Address = Clean(request.Address);
        request.Description = Clean(request.Description);
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
