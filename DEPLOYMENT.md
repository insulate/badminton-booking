# Badminton Booking System - Deployment Guide

คู่มือการ Deploy ระบบจองสนามแบดมินตัน ขึ้น Production

## สถาปัตยกรรมระบบ (Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare DNS                         │
│                    (SSL + Proxy)                            │
└───────────────────────────┬─────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
┌───────────────────────┐       ┌───────────────────────────┐
│   Vercel (Frontend)   │       │   DigitalOcean Server     │
│                       │       │     146.190.97.131        │
│ badminton-booking     │       │                           │
│   .vercel.app         │       │  ┌─────────────────────┐  │
│                       │       │  │   waste-nginx       │  │
│ - React + Vite        │──────▶│  │   (port 80/443)     │  │
│ - Static hosting      │       │  └──────────┬──────────┘  │
│ - Free                │       │             │             │
└───────────────────────┘       │             ▼             │
                                │  ┌─────────────────────┐  │
                                │  │ badminton-backend   │  │
                                │  │ (port 3000)         │  │
                                │  └──────────┬──────────┘  │
                                │             │             │
                                │             ▼             │
                                │  ┌─────────────────────┐  │
                                │  │ waste-mongodb       │  │
                                │  │ (database:          │  │
                                │  │  badminton_db)      │  │
                                │  └─────────────────────┘  │
                                └───────────────────────────┘
```

## URLs สุดท้าย

| รายการ | URL |
|--------|-----|
| **Frontend** | https://badminton-booking.vercel.app |
| **Backend API** | https://badminton-api.conypetshop.com/api |

## Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| User | `user1` | `user123` |

---

## ขั้นตอนการ Deploy

### Phase 1: Setup Cloudflare DNS

#### 1.1 เพิ่ม DNS Record

1. Login เข้า [Cloudflare Dashboard](https://dash.cloudflare.com)
2. เลือก domain `conypetshop.com`
3. ไปที่ **DNS** > **Records**
4. Click **Add record**
5. กรอกข้อมูล:

| Field | Value |
|-------|-------|
| Type | `A` |
| Name | `badminton-api` |
| IPv4 address | `146.190.97.131` |
| Proxy status | **Proxied** (orange cloud) |
| TTL | Auto |

6. Click **Save**

#### 1.2 ตรวจสอบ SSL/TLS Settings

1. ไปที่ **SSL/TLS** > **Overview**
2. ตรวจสอบว่าเป็น **Flexible** หรือ **Full** (แนะนำ Flexible เพราะ server ไม่มี SSL cert)

---

### Phase 2: Deploy Backend บน DigitalOcean Server

#### 2.1 SSH เข้า Server

```bash
ssh root@146.190.97.131
```

#### 2.2 Clone Repository

```bash
cd /root
git clone https://github.com/insulate/badminton-booking.git
cd badminton-booking
```

#### 2.3 สร้างไฟล์ .env สำหรับ Production

```bash
cat > .env << 'EOF'
JWT_SECRET=badminton_super_secret_jwt_key_2024_production
EOF
```

**หมายเหตุ:** สามารถเปลี่ยน JWT_SECRET เป็นค่าอื่นที่ปลอดภัยกว่าได้

#### 2.4 Build และ Run Docker Container

```bash
# Build และ start container
docker-compose -f docker-compose.prod.yml up -d --build

# ตรวจสอบว่า container ทำงาน
docker ps | grep badminton

# ดู logs (ถ้าต้องการ)
docker logs badminton-backend
```

#### 2.5 Update Nginx Configuration

**วิธีที่ 1: แก้ไขไฟล์โดยตรง**

```bash
# Backup config เดิมก่อน
cp /root/waste-tax/nginx/nginx.conf /root/waste-tax/nginx/nginx.conf.backup

# เปิดไฟล์แก้ไข
nano /root/waste-tax/nginx/nginx.conf
```

**เพิ่มเนื้อหาต่อไปนี้ใน `http { }` block (ก่อน server block ของ waste-tax):**

```nginx
    # ========================================
    # Badminton Booking API
    # ========================================
    
    # Upstream for badminton backend
    upstream badminton_backend {
        server badminton-backend:3000;
    }

    # Badminton API server
    server {
        listen 80;
        server_name badminton-api.conypetshop.com;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Max upload size (10MB for product images)
        client_max_body_size 10M;

        # API routes - proxy to backend
        location / {
            proxy_pass http://badminton_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Uploaded files (product images)
        location /uploads/ {
            alias /var/www/badminton-uploads/;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }
    }
```

**บันทึกไฟล์แล้ว Test และ Reload Nginx:**

```bash
# Test configuration
docker exec waste-nginx nginx -t

# ถ้า test ผ่าน ให้ reload
docker exec waste-nginx nginx -s reload
```

#### 2.6 เพิ่ม Badminton Container เข้า Network

```bash
# เชื่อม badminton-backend เข้า waste-tax network
docker network connect waste-tax_waste-network badminton-backend

# ตรวจสอบว่าเชื่อมแล้ว
docker network inspect waste-tax_waste-network | grep badminton
```

#### 2.7 Mount Uploads Volume ให้ Nginx

แก้ไข `/root/waste-tax/docker-compose.yml` เพิ่ม volume ใน nginx service:

```yaml
  nginx:
    # ... existing config ...
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - backend_uploads:/var/www/uploads:ro
      - /root/badminton-booking/backend/uploads:/var/www/badminton-uploads:ro  # เพิ่มบรรทัดนี้
```

หรือใช้วิธี mount แบบ bind โดยตรง:

```bash
# หยุด nginx
docker stop waste-nginx

# ลบ container เดิม
docker rm waste-nginx

# รัน nginx ใหม่พร้อม mount badminton uploads
cd /root/waste-tax
docker-compose up -d nginx
```

#### 2.8 Seed ข้อมูลตัวอย่าง

```bash
# รัน seed script
docker exec badminton-backend npm run seed:all

# หรือ seed ทีละส่วน
docker exec badminton-backend npm run seed:users
docker exec badminton-backend npm run seed:settings
docker exec badminton-backend npm run seed:courts
docker exec badminton-backend npm run seed:timeslots
docker exec badminton-backend npm run seed:categories
docker exec badminton-backend npm run seed:products
docker exec badminton-backend npm run seed:players
```

#### 2.9 ทดสอบ Backend API

```bash
# ทดสอบ health check
curl http://localhost:3000/api

# ทดสอบผ่าน domain (หลังจาก DNS propagate แล้ว)
curl https://badminton-api.conypetshop.com/api
```

**ผลลัพธ์ที่คาดหวัง:**
```json
{"message":"Badminton Court Booking API is running","version":"1.0.0"}
```

---

### Phase 3: Deploy Frontend บน Vercel

#### 3.1 Login Vercel

1. ไปที่ https://vercel.com
2. Click **Login**
3. เลือก **Continue with GitHub**
4. Authorize Vercel ให้เข้าถึง GitHub account `insulate`

#### 3.2 Import Project

1. Click **Add New...** > **Project**
2. ในส่วน **Import Git Repository** จะเห็น repo `insulate/badminton-booking`
3. Click **Import**

#### 3.3 Configure Project

| Setting | Value |
|---------|-------|
| **Project Name** | `badminton-booking` (หรือชื่อที่ต้องการ) |
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` (Click Edit แล้วพิมพ์ `frontend`) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

#### 3.4 Add Environment Variables

1. Expand **Environment Variables** section
2. เพิ่ม variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://badminton-api.conypetshop.com/api` |

3. Click **Add**

#### 3.5 Deploy

1. Click **Deploy**
2. รอ build เสร็จ (ประมาณ 1-2 นาที)
3. เมื่อเสร็จจะได้ URL: `https://badminton-booking.vercel.app`

---

### Phase 4: ทดสอบระบบ

#### 4.1 ทดสอบหน้าเว็บ

1. เปิด https://badminton-booking.vercel.app
2. ควรเห็นหน้า Homepage หรือ Login page

#### 4.2 ทดสอบ Login Admin

1. ไปที่ https://badminton-booking.vercel.app/admin/login
2. Login ด้วย:
   - Username: `admin`
   - Password: `admin123`
3. ควรเข้าสู่ Dashboard ได้

#### 4.3 ทดสอบ Features หลัก

- [ ] ดูรายการ Bookings
- [ ] สร้าง Booking ใหม่
- [ ] ดูรายการ Courts
- [ ] ดูรายการ Products
- [ ] สร้าง Sale ใน POS
- [ ] ดู Settings

---

## Troubleshooting

### ปัญหา: CORS Error

**อาการ:** Frontend แสดง error "Access to XMLHttpRequest blocked by CORS policy"

**วิธีแก้:**
1. ตรวจสอบว่า `backend/app.js` มี URL ของ Vercel ใน `allowedOrigins`
2. Rebuild และ restart container:
```bash
cd /root/badminton-booking
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### ปัญหา: 502 Bad Gateway

**อาการ:** เข้า API แล้วได้ 502 error

**วิธีแก้:**
1. ตรวจสอบว่า badminton-backend container ทำงาน:
```bash
docker ps | grep badminton
docker logs badminton-backend
```

2. ตรวจสอบว่า container เชื่อม network แล้ว:
```bash
docker network inspect waste-tax_waste-network
```

3. ตรวจสอบ Nginx config:
```bash
docker exec waste-nginx nginx -t
```

### ปัญหา: DNS ยังไม่ resolve

**อาการ:** เข้า `badminton-api.conypetshop.com` ไม่ได้

**วิธีแก้:**
1. รอ DNS propagate (ปกติ 1-5 นาที สำหรับ Cloudflare)
2. ตรวจสอบ DNS:
```bash
nslookup badminton-api.conypetshop.com
# หรือ
dig badminton-api.conypetshop.com
```

### ปัญหา: MongoDB Connection Error

**อาการ:** Backend เริ่มไม่ได้ แสดง MongoDB connection error

**วิธีแก้:**
1. ตรวจสอบว่า waste-mongodb container ทำงาน:
```bash
docker ps | grep mongodb
```

2. ตรวจสอบว่า badminton-backend อยู่ใน network เดียวกัน:
```bash
docker network connect waste-tax_waste-network badminton-backend
```

---

## Commands ที่ใช้บ่อย

### Server Management

```bash
# SSH เข้า server
ssh root@146.190.97.131

# ไปที่ project directory
cd /root/badminton-booking

# Pull code ใหม่
git pull

# Rebuild และ restart
docker-compose -f docker-compose.prod.yml up -d --build

# ดู logs
docker logs -f badminton-backend

# เข้าไปใน container
docker exec -it badminton-backend sh

# Restart container
docker restart badminton-backend

# หยุด container
docker stop badminton-backend

# ลบ container
docker rm badminton-backend
```

### Database Management

```bash
# Seed ข้อมูลใหม่ทั้งหมด (ลบของเดิม)
docker exec badminton-backend npm run seed:all

# เข้า MongoDB shell
docker exec -it waste-mongodb mongosh

# ใน MongoDB shell
use badminton_db
db.users.find()
db.bookings.find()
```

### Nginx Management

```bash
# Test config
docker exec waste-nginx nginx -t

# Reload config
docker exec waste-nginx nginx -s reload

# ดู logs
docker logs waste-nginx
```

---

## File Structure (Production)

```
/root/badminton-booking/
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── app.js
│   ├── package.json
│   ├── uploads/
│   │   └── products/
│   └── ...
├── frontend/
│   ├── .env.production
│   └── ...
├── nginx/
│   └── badminton.conf (reference)
├── docker-compose.prod.yml
├── .env
└── DEPLOYMENT.md

/root/waste-tax/nginx/
└── nginx.conf (แก้ไขเพิ่ม badminton server block)
```

---

## อัปเดต Code ในอนาคต

เมื่อต้องการอัปเดต code:

### Backend

```bash
ssh root@146.190.97.131
cd /root/badminton-booking
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Frontend

Vercel จะ auto-deploy เมื่อมี push ไปที่ `main` branch

หรือถ้าต้องการ manual deploy:
1. ไปที่ Vercel Dashboard
2. เลือก project `badminton-booking`
3. Click **Deployments** > **Redeploy**

---

## Contact & Support

หากพบปัญหา สามารถตรวจสอบ logs ได้ที่:

```bash
# Backend logs
docker logs badminton-backend

# Nginx logs
docker logs waste-nginx

# All containers
docker ps -a
```
