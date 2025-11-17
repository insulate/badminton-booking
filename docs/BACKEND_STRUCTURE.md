# Backend Structure Documentation

## โครงสร้างโปรเจค

```
backend/
├── bin/
│   └── www                 # Server entry point
├── config/
│   └── database.js         # MongoDB connection configuration
├── controllers/
│   └── authController.js   # Authentication logic
├── middleware/
│   └── auth.js            # JWT verification & authorization
├── models/
│   └── User.js            # User schema (Mongoose)
├── routes/
│   ├── index.js           # Root routes
│   ├── users.js           # User routes
│   └── auth.js            # Authentication routes
├── public/                # Static files
├── app.js                 # Express app configuration
├── package.json           # Dependencies
├── .env.example           # Environment variables template
└── .env                   # Environment variables (create this)
```

---

## Models

### User Model (`models/User.js`)

**Schema Fields:**
```javascript
{
  username: String,        // unique, required, min 3 chars
  password: String,        // hashed with bcrypt, min 6 chars
  name: String,           // required
  role: String,           // 'user' | 'admin', default: 'user'
  createdAt: Date,        // auto-generated
  updatedAt: Date,        // auto-updated
  deletedAt: Date         // soft delete, default: null
}
```

**Methods:**
- `comparePassword(candidatePassword)` - เปรียบเทียบ password
- `toJSON()` - ลบข้อมูลที่ไม่จำเป็นออก (password, __v)

**Hooks:**
- `pre('save')` - Hash password ก่อน save
- `pre('save')` - Update timestamp

---

## Middleware

### Auth Middleware (`middleware/auth.js`)

**Functions:**

1. **`protect`** - ตรวจสอบ JWT token
   - ใช้กับ routes ที่ต้องการ authentication
   - ดึงข้อมูล user จาก token ใส่ใน `req.user`

2. **`admin`** - ตรวจสอบสิทธิ์ admin
   - ต้องใช้หลัง `protect` middleware
   - ใช้กับ routes ที่ต้องการสิทธิ์ admin เท่านั้น

**Usage Example:**
```javascript
// ใช้ protect กับ route ที่ต้อง login
router.get('/profile', protect, getProfile);

// ใช้ทั้ง protect และ admin กับ route ที่ต้องการสิทธิ์ admin
router.delete('/users/:id', protect, admin, deleteUser);
```

---

## Controllers

### Auth Controller (`controllers/authController.js`)

**Functions:**

1. **`register(req, res)`**
   - สมัครสมาชิกใหม่
   - Validate input
   - Check duplicate email
   - Create user & return token

2. **`login(req, res)`**
   - เข้าสู่ระบบ
   - Validate credentials
   - Check user status
   - Return user data & token

3. **`getMe(req, res)`**
   - ดึงข้อมูลผู้ใช้ปัจจุบัน
   - Requires: `protect` middleware

4. **`updateProfile(req, res)`**
   - แก้ไขข้อมูลส่วนตัว
   - Requires: `protect` middleware

5. **`changePassword(req, res)`**
   - เปลี่ยนรหัสผ่าน
   - Validate current password
   - Hash new password
   - Return new token

**Helper:**
- `generateToken(id)` - สร้าง JWT token

---

## Routes

### Auth Routes (`routes/auth.js`)

```javascript
// Public routes
POST   /api/auth/register      // Register new user
POST   /api/auth/login         // Login

// Private routes (require token)
GET    /api/auth/me            // Get current user
PUT    /api/auth/profile       // Update profile
PUT    /api/auth/password      // Change password
```

---

## Environment Variables

**Required in `.env`:**

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Server
PORT=3000
NODE_ENV=development

# CORS
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
```

---

## Database Connection

**File:** `config/database.js`

```javascript
const connectDB = async () => {
  // Connect to MongoDB Atlas
  // Handle connection errors
  // Log success
}
```

**Called in:** `app.js` on startup

---

## Error Handling

**Centralized Error Handler** in `app.js`:

```javascript
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      status: err.status || 500
    }
  });
});
```

**Response Format:**

Success:
```json
{
  "success": true,
  "data": { ... }
}
```

Error:
```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Security Features

### Password Security
- ✅ Bcrypt hashing (10 salt rounds)
- ✅ Minimum 6 characters
- ✅ Never return password in responses
- ✅ Secure password comparison

### JWT Security
- ✅ Token expiration (30 days)
- ✅ Secret key configuration
- ✅ Token verification on protected routes
- ✅ User status check (isActive)

### CORS Configuration
- ✅ Configured for frontend URL
- ✅ Credentials support
- ✅ Can restrict by origin

---

## Development

### Install Dependencies
```bash
cd backend
npm install
```

### Setup Environment
```bash
cp .env.example .env
# Edit .env with your values
```

### Run Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### Run Production
```bash
npm start
```

---

## Testing API

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123",
    "name": "John Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "password123"
  }'
```

**Get Profile (with token):**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Next Steps

### สิ่งที่อาจเพิ่มเติมในอนาคต:

1. **Email Verification**
   - Send verification email on register
   - Verify token before activation

2. **Password Reset**
   - Forgot password functionality
   - Reset token via email

3. **Refresh Tokens**
   - Implement refresh token mechanism
   - Better security for long sessions

4. **Rate Limiting**
   - Prevent brute force attacks
   - Limit login attempts

5. **Logging**
   - Request logging
   - Error logging
   - Audit trail

6. **Validation**
   - Use express-validator
   - More robust input validation

7. **Testing**
   - Unit tests
   - Integration tests
   - API testing with Jest/Mocha
