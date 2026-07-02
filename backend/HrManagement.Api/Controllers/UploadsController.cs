using Microsoft.AspNetCore.Mvc;

namespace HrManagement.Api.Controllers;

[ApiController, Route("api/uploads")]
public class UploadsController(IWebHostEnvironment environment) : ControllerBase
{
    private static readonly HashSet<string> AllowedTypes =
        ["image/jpeg", "image/png", "image/webp"];
    private const long MaxSize = 5 * 1024 * 1024;

    [HttpPost("images")]
    [RequestSizeLimit(MaxSize)]
    public async Task<ActionResult> UploadImage(IFormFile file)
    {
        if (file.Length == 0 || file.Length > MaxSize)
            return BadRequest(new { message = "Image must be smaller than 5 MB." });
        if (!AllowedTypes.Contains(file.ContentType))
            return BadRequest(new { message = "Only JPG, PNG and WebP images are supported." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var uploadDirectory = Path.Combine(environment.WebRootPath, "uploads");
        Directory.CreateDirectory(uploadDirectory);
        await using var stream = System.IO.File.Create(Path.Combine(uploadDirectory, fileName));
        await file.CopyToAsync(stream);

        var path = $"/uploads/{fileName}";
        return Ok(new { path, url = $"{Request.Scheme}://{Request.Host}{path}" });
    }
}
