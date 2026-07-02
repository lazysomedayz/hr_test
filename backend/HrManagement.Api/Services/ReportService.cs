using HrManagement.Api.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace HrManagement.Api.Services;

public class ReportService
{
    private const string Primary = "#2457D6";
    private const string Ink = "#172033";
    private const string Muted = "#667085";
    private const string Border = "#D9E0EA";
    private const string Surface = "#F5F7FB";

    public byte[] GenerateEmployeeReport(
        IReadOnlyCollection<Employee> employees,
        IReadOnlyCollection<Department> departments,
        string filterDescription)
    {
        return Document.Create(document =>
        {
            document.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(32);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(style => style.FontFamily("Noto Sans Thai").FontSize(9).FontColor(Ink));

                page.Header().Element(container => ComposeHeader(container, filterDescription));
                page.Content().PaddingVertical(18).Column(column =>
                {
                    column.Spacing(16);
                    column.Item().Element(container => ComposeSummary(container, employees, departments));
                    column.Item().Text("รายชื่อพนักงาน").FontSize(13).SemiBold();
                    column.Item().Element(container => ComposeEmployeeTable(container, employees));
                });
                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text($"สร้างเมื่อ {FormatThaiDateTime(DateTime.Now)}").FontSize(8).FontColor(Muted);
                    row.RelativeItem().AlignRight().Text(text =>
                    {
                        text.Span("หน้า ");
                        text.CurrentPageNumber();
                        text.Span(" / ");
                        text.TotalPages();
                    });
                });
            });
        }).GeneratePdf();
    }

    private static void ComposeHeader(IContainer container, string filterDescription)
    {
        container.Row(row =>
        {
            row.ConstantItem(44).Height(44).Background(Primary).AlignCenter().AlignMiddle()
                .Text("HR").FontColor(Colors.White).Bold().FontSize(15);
            row.RelativeItem().PaddingLeft(12).Column(column =>
            {
                column.Item().Text("รายงานข้อมูลพนักงาน").FontSize(20).Bold().FontColor(Ink);
                column.Item().Text(filterDescription).FontSize(9).FontColor(Muted);
            });
            row.AutoItem().AlignBottom().Text("PeopleFlow HR Management").FontSize(9).FontColor(Muted);
        });
    }

    private static void ComposeSummary(
        IContainer container,
        IReadOnlyCollection<Employee> employees,
        IReadOnlyCollection<Department> departments)
    {
        container.Row(row =>
        {
            SummaryItem(row.RelativeItem(), "พนักงานทั้งหมด", employees.Count.ToString());
            row.ConstantItem(10);
            SummaryItem(row.RelativeItem(), "กำลังทำงาน", employees.Count(employee => employee.IsActive).ToString());
            row.ConstantItem(10);
            SummaryItem(row.RelativeItem(), "พ้นสภาพ", employees.Count(employee => !employee.IsActive).ToString());
            row.ConstantItem(10);
            SummaryItem(row.RelativeItem(), "แผนกที่เกี่ยวข้อง",
                employees.Select(employee => employee.DepartmentId).Distinct().Count().ToString());
        });

        static void SummaryItem(IContainer item, string label, string value) =>
            item.Background(Surface).Border(1).BorderColor(Border).Padding(10).Column(column =>
            {
                column.Item().Text(label).FontSize(8).FontColor(Muted);
                column.Item().Text(value).FontSize(17).SemiBold().FontColor(Ink);
            });
    }

    private static void ComposeEmployeeTable(IContainer container, IReadOnlyCollection<Employee> employees)
    {
        if (employees.Count == 0)
        {
            container.Background(Surface).Padding(24).AlignCenter()
                .Text("ไม่พบพนักงานตามเงื่อนไขที่เลือก").FontColor(Muted);
            return;
        }

        container.Table(table =>
        {
            table.ColumnsDefinition(columns =>
            {
                columns.ConstantColumn(38);
                columns.ConstantColumn(62);
                columns.RelativeColumn(1.7f);
                columns.RelativeColumn(1.4f);
                columns.RelativeColumn(1.3f);
                columns.RelativeColumn();
                columns.ConstantColumn(72);
                columns.ConstantColumn(58);
            });

            table.Header(header =>
            {
                header.Cell().Element(HeaderCellStyle).Text("ลำดับ");
                header.Cell().Element(HeaderCellStyle).Text("รหัส");
                header.Cell().Element(HeaderCellStyle).Text("ชื่อ - นามสกุล");
                header.Cell().Element(HeaderCellStyle).Text("ตำแหน่ง");
                header.Cell().Element(HeaderCellStyle).Text("แผนก");
                header.Cell().Element(HeaderCellStyle).Text("อีเมล");
                header.Cell().Element(HeaderCellStyle).Text("เริ่มงาน");
                header.Cell().Element(HeaderCellStyle).Text("สถานะ");
            });

            var index = 1;
            foreach (var employee in employees)
            {
                var background = index % 2 == 0 ? Surface : "#FFFFFF";
                table.Cell().Element(cell => BodyCellStyle(cell, background)).Text(index.ToString());
                table.Cell().Element(cell => BodyCellStyle(cell, background)).Text(employee.EmployeeCode);
                table.Cell().Element(cell => BodyCellStyle(cell, background)).Text($"{employee.FirstName} {employee.LastName}");
                table.Cell().Element(cell => BodyCellStyle(cell, background)).Text(employee.JobTitle);
                table.Cell().Element(cell => BodyCellStyle(cell, background)).Text(employee.DepartmentName);
                table.Cell().Element(cell => BodyCellStyle(cell, background)).Text(employee.Email);
                table.Cell().Element(cell => BodyCellStyle(cell, background)).Text(FormatThaiDate(employee.DateJoined));
                table.Cell().Element(cell => BodyCellStyle(cell, background)).Text(employee.IsActive ? "ทำงาน" : "พ้นสภาพ");
                index++;
            }
        });

        static IContainer HeaderCellStyle(IContainer cell) =>
            cell.Background(Primary).PaddingVertical(7).PaddingHorizontal(5)
                .DefaultTextStyle(style => style.FontColor(Colors.White).SemiBold());

        static IContainer BodyCellStyle(IContainer cell, string background) =>
            cell.Background(background).BorderBottom(1).BorderColor(Border)
                .PaddingVertical(6).PaddingHorizontal(5);
    }

    private static string FormatThaiDate(DateOnly date) =>
        $"{date.Day:00}/{date.Month:00}/{date.Year + 543}";

    private static string FormatThaiDateTime(DateTime date) =>
        $"{date:dd/MM}/{date.Year + 543} {date:HH:mm}";
}
