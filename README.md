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

ชื่อ table, column, constraint, index และ JSON field ใช้รูปแบบ `snake_case`
ทั้งหมด รูปพนักงานอัปโหลดผ่าน dropzone และเก็บไว้ใน `wwwroot/uploads`

## ฟีเจอร์หลัก

- ฟอร์มเพิ่มและแก้ไขพนักงาน/แผนกเป็นหน้าแยก พร้อม validation และ dialog ยืนยัน
- วันที่ในหน้าเว็บและรายงานแสดงเป็นปี พ.ศ.
- รหัสพนักงานสร้างอัตโนมัติด้วย SQL Server sequence และแก้ไขภายหลังไม่ได้
- ระบบสร้าง `แผนกกลาง` อัตโนมัติ ใช้รองรับพนักงานระหว่างการปรับโครงสร้าง
- แผนกที่ยังมีพนักงานจะปิดหรือลบไม่ได้ ต้องย้ายพนักงานไปแผนกกลางก่อน
- API request body ทั่วไปใช้ JSON (`application/json`); multipart `FormData` ใช้เฉพาะอัปโหลดไฟล์
- รายงานพนักงาน PDF กรองตามแผนกและสถานะ สร้างโดย `POST /api/reports/employees.pdf` พร้อม JSON body
- ตารางพนักงานใช้ `POST /api/employees/search` พร้อม JSON body สำหรับ server-side pagination/search/filter/sort และ debounce การค้นหา 500 ms
- รายงานรองรับรอบรายวัน รายเดือน รายปี หรือช่วงวันที่กำหนดเอง และแสดงเงื่อนไขใน PDF
- การลบพนักงานและแผนกเป็น soft delete ผ่านฟิลด์ `deleted_at`
- การสร้างและแก้ไขพนักงาน/แผนกทำงานภายใน database transaction
