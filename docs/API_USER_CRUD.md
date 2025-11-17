# User CRUD API Documentation

## Base URL
```
http://localhost:3000/api/users
```

## Overview
ระบบจัดการ User ใช้ Soft Delete (ไม่ลบข้อมูลจริงๆ แต่ set `deletedAt` timestamp)

**สิทธิ์การเข้าถึง:** ทุก endpoints ต้องการ Authentication และ Admin role

---

## Endpoints

### 1. Get All Users (ดูรายชื่อผู้ใช้ทั้งหมด)

**Endpoint:** `GET /api/users`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `includeDeleted` (optional): `true` เพื่อแสดงผู้ใช้ที่ถูก soft delete ด้วย

**Success Response (200 OK):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "user_id",
      "username": "johndoe",
      "name": "John Doe",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "deletedAt": null
    }
  ]
}
```

**Example:**
```bash
# ดูผู้ใช้ที่ active อย่างเดียว
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# ดูทุกผู้ใช้รวมที่ถูกลบด้วย
curl -X GET http://localhost:3000/api/users?includeDeleted=true \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

### 2. Get User by ID (ดูข้อมูลผู้ใช้รายเดียว)

**Endpoint:** `GET /api/users/:id`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

**Error Responses:**

404 Not Found - User not found:
```json
{
  "success": false,
  "message": "User not found"
}
```

404 Not Found - User is deleted:
```json
{
  "success": false,
  "message": "User has been deleted"
}
```

---

### 3. Create User (สร้างผู้ใช้ใหม่)

**Endpoint:** `POST /api/users`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "newuser",
  "password": "password123",
  "name": "New User",
  "role": "user"
}
```

**Validation:**
- `username`: Required, minimum 3 characters, unique
- `password`: Required, minimum 6 characters
- `name`: Required
- `role`: Optional, default: "user", values: "user" | "admin"

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "new_user_id",
    "username": "newuser",
    "name": "New User",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

**Error Responses:**

400 Bad Request - Missing fields:
```json
{
  "success": false,
  "message": "Please provide username, password, and name"
}
```

400 Bad Request - Username exists:
```json
{
  "success": false,
  "message": "User already exists with this username"
}
```

---

### 4. Update User (แก้ไขข้อมูลผู้ใช้)

**Endpoint:** `PUT /api/users/:id`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "admin",
  "username": "newusername"
}
```

**Note:** สามารถส่งแค่ field ที่ต้องการเปลี่ยนได้ ไม่ต้องส่งทุก field

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "newusername",
    "name": "Updated Name",
    "role": "admin",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z",
    "deletedAt": null
  }
}
```

**Error Responses:**

404 Not Found:
```json
{
  "success": false,
  "message": "User not found"
}
```

400 Bad Request - User is deleted:
```json
{
  "success": false,
  "message": "Cannot update deleted user. Please restore first."
}
```

400 Bad Request - Username exists:
```json
{
  "success": false,
  "message": "Username already exists"
}
```

---

### 5. Delete User (ลบผู้ใช้ - Soft Delete)

**Endpoint:** `DELETE /api/users/:id`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "deletedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**

404 Not Found:
```json
{
  "success": false,
  "message": "User not found"
}
```

400 Bad Request - Already deleted:
```json
{
  "success": false,
  "message": "User is already deleted"
}
```

400 Bad Request - Cannot delete yourself:
```json
{
  "success": false,
  "message": "You cannot delete your own account"
}
```

---

### 6. Restore User (กู้คืนผู้ใช้ที่ถูกลบ)

**Endpoint:** `PATCH /api/users/:id/restore`

**Access:** Private/Admin

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "User restored successfully",
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:30:00.000Z",
    "deletedAt": null
  }
}
```

**Error Responses:**

404 Not Found:
```json
{
  "success": false,
  "message": "User not found"
}
```

400 Bad Request - User is not deleted:
```json
{
  "success": false,
  "message": "User is not deleted"
}
```

---

## Usage Examples

### 1. สร้างผู้ใช้ใหม่ (เช่น พนักงาน)
```javascript
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'staff01',
    password: 'staff123',
    name: 'Staff Member 1',
    role: 'user'
  })
});
```

### 2. ดูรายชื่อผู้ใช้ทั้งหมด
```javascript
const response = await fetch('http://localhost:3000/api/users', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
const data = await response.json();
console.log(data.data); // array of users
```

### 3. แก้ไขข้อมูลผู้ใช้
```javascript
const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Updated Name',
    role: 'admin'
  })
});
```

### 4. ลบผู้ใช้ (Soft Delete)
```javascript
const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### 5. กู้คืนผู้ใช้
```javascript
const response = await fetch(`http://localhost:3000/api/users/${userId}/restore`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

---

## Security Notes

### Authorization
- ✅ ทุก endpoints ต้องมี JWT token
- ✅ ทุก endpoints ต้องเป็น Admin role เท่านั้น
- ✅ ไม่สามารถลบ account ตัวเองได้

### Soft Delete
- ✅ การลบเป็น Soft Delete (set `deletedAt` timestamp)
- ✅ ผู้ใช้ที่ถูกลบจะไม่แสดงใน list ปกติ
- ✅ สามารถกู้คืนผู้ใช้ที่ถูกลบได้
- ✅ ไม่สามารถแก้ไขผู้ใช้ที่ถูกลบ (ต้องกู้คืนก่อน)

### Password Security
- ✅ Password จะถูก hash ด้วย bcrypt ก่อนบันทึก
- ✅ ไม่มีการส่ง password กลับมาใน response
- ✅ Password ต้องมีความยาวอย่างน้อย 6 ตัวอักษร

---

## Testing with cURL

### สร้าง User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123",
    "name": "Test User",
    "role": "user"
  }'
```

### ดูรายชื่อ Users
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### แก้ไข User
```bash
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Test User"
  }'
```

### ลบ User (Soft Delete)
```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### กู้คืน User
```bash
curl -X PATCH http://localhost:3000/api/users/USER_ID/restore \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Common Errors

### 401 Unauthorized
- Token หมดอายุหรือไม่ถูกต้อง
- ไม่มี token ใน header

### 403 Forbidden
- User ไม่ใช่ admin role
- ไม่มีสิทธิ์เข้าถึง

### 404 Not Found
- User ID ไม่ถูกต้อง
- User ไม่มีในระบบ
- User ถูก soft delete แล้ว

### 500 Internal Server Error
- ปัญหา Database connection
- ปัญหา Server

---

## Summary

### API Endpoints สำหรับ User CRUD:

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | ดูรายชื่อผู้ใช้ทั้งหมด | Admin |
| GET | `/api/users/:id` | ดูข้อมูลผู้ใช้รายเดียว | Admin |
| POST | `/api/users` | สร้างผู้ใช้ใหม่ | Admin |
| PUT | `/api/users/:id` | แก้ไขข้อมูลผู้ใช้ | Admin |
| DELETE | `/api/users/:id` | ลบผู้ใช้ (Soft Delete) | Admin |
| PATCH | `/api/users/:id/restore` | กู้คืนผู้ใช้ที่ถูกลบ | Admin |

### Features:
- ✅ Soft Delete (ไม่ลบข้อมูลจริง)
- ✅ Restore deleted users
- ✅ Admin-only access
- ✅ Password hashing
- ✅ Input validation
- ✅ Cannot delete own account
- ✅ Cannot update deleted users
