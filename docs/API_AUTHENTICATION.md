# Authentication API Documentation

## Base URL
```
http://localhost:3000/api/auth
```

## Overview
ระบบ Authentication ใช้ JWT (JSON Web Token) สำหรับการยืนยันตัวตน โดย Token จะมีอายุ 30 วัน

---

## Endpoints

### 1. Login (เข้าสู่ระบบ)

**Endpoint:** `POST /api/auth/login`

**Access:** Public

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "password123"
}
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
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**

400 Bad Request - Missing fields:
```json
{
  "success": false,
  "message": "Please provide username and password"
}
```

401 Unauthorized - Invalid credentials:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

401 Unauthorized - Account deleted:
```json
{
  "success": false,
  "message": "Your account has been deleted"
}
```

---

### 2. Get Current User (ดูข้อมูลผู้ใช้ปัจจุบัน)

**Endpoint:** `GET /api/auth/me`

**Access:** Private (ต้อง Login)

**Headers:**
```
Authorization: Bearer <token>
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

**Error Response:**

401 Unauthorized - No token:
```json
{
  "success": false,
  "message": "Not authorized, no token"
}
```

401 Unauthorized - Invalid token:
```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

---

### 3. Update Profile (แก้ไขข้อมูลส่วนตัว)

**Endpoint:** `PUT /api/auth/profile`

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Smith"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "username": "johndoe",
    "name": "Jane Smith",
    "role": "user",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "deletedAt": null
  }
}
```

---

### 4. Change Password (เปลี่ยนรหัสผ่าน)

**Endpoint:** `PUT /api/auth/password`

**Access:** Private

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Validation:**
- `newPassword`: Minimum 6 characters

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "data": {
    "token": "new_jwt_token_here..."
  }
}
```

**Error Responses:**

400 Bad Request - Missing fields:
```json
{
  "success": false,
  "message": "Please provide current and new password"
}
```

400 Bad Request - Password too short:
```json
{
  "success": false,
  "message": "Password must be at least 6 characters"
}
```

401 Unauthorized - Wrong current password:
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## Authentication Flow

### สำหรับ Frontend

#### 1. Login
```javascript
// Login
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'johndoe',
    password: 'password123'
  })
});

const data = await response.json();
if (data.success) {
  // Save token to localStorage
  localStorage.setItem('token', data.data.token);
  // Save user data
  localStorage.setItem('user', JSON.stringify(data.data));
}
```

#### 2. Making Authenticated Requests
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:3000/api/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### 3. Logout
```javascript
// ลบ token และ user data
localStorage.removeItem('token');
localStorage.removeItem('user');
// Redirect to login page
```

---

## User Roles

- `user`: ผู้ใช้ทั่วไป (สามารถจองสนามได้)
- `admin`: ผู้ดูแลระบบ (มีสิทธิ์เต็ม)

---

## Security Notes

### สำหรับ Production:
1. เปลี่ยน `JWT_SECRET` ให้เป็นค่าที่ปลอดภัย (random string ยาวๆ)
2. ใช้ HTTPS แทน HTTP
3. ตั้งค่า CORS ให้ระบุ domain ที่อนุญาตชัดเจน
4. อาจเพิ่ม rate limiting สำหรับ login endpoint
5. ควรเก็บ token ใน httpOnly cookie แทน localStorage (ปลอดภัยกว่า)

### Password Security:
- Password จะถูก hash ด้วย bcrypt ก่อนบันทึกลง database
- ไม่มีการส่ง password กลับมาใน response
- การเปรียบเทียบ password ใช้ bcrypt compare

---

## Common Errors

### 401 Unauthorized
- Token หมดอายุหรือไม่ถูกต้อง → Redirect to login
- User ถูก deactivate → แจ้งเตือนผู้ใช้

### 500 Internal Server Error
- ปัญหา Database connection
- ปัญหา Server → Check backend logs
