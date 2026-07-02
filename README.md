# HR Management

ระบบจัดการพนักงานและแผนก ใช้ ASP.NET Core 9 + Dapper,
SQL Server Express และ React + TypeScript + shadcn/ui

## เริ่มใช้งาน

```powershell
dotnet run --project backend/HrManagement.Api --urls http://localhost:5080
```

เปิดอีก terminal:

```powershell
cd frontend
npm run dev
```

หน้าเว็บ: http://localhost:5173  
OpenAPI: http://localhost:5080/openapi/v1.json

ฐานข้อมูล `HrManagementDb` ใช้ SQL Server instance `.\SQLEXPRESS`
SQL migration ใน `backend/HrManagement.Api/Data/Migrations` จะถูกรันอัตโนมัติ
เมื่อ API เริ่มทำงาน และบันทึกประวัติไว้ในตาราง `schema_migrations`
