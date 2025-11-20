# Layout Standardization Plan
## Badminton Court Booking System

**Created:** 2025-11-21
**Status:** 🔴 Not Started
**Last Updated:** 2025-11-21

---

## 📊 Executive Summary

จากการวิเคราะห์ 20 หน้า admin pages พบว่ามี **ความไม่สอดคล้องกันค่อนข้างมาก** ในหลายด้าน ส่งผลให้ระบบดูไม่เป็นระเบียบและไม่เป็นมืออาชีพ

### ปัญหาหลัก 7 ประการ:
1. ❌ **Rounded Corners** ไม่สม่ำเสมอ (rounded-lg vs rounded-xl vs rounded-2xl)
2. ❌ **Shadow Styles** แตกต่างกัน (shadow-md vs shadow-lg vs shadow-xl)
3. ❌ **Card Styles** หลายแบบ (border styles, padding, backgrounds)
4. ❌ **Table Headers** สไตล์ต่างกัน (gray vs gradient vs mixed)
5. ❌ **Settings Pages** ใช้สีไม่เหมือนกัน (blue, purple, orange, green, gray)
6. ❌ **Button Styles** ไม่สอดคล้อง (padding, rounded, colors)
7. ❌ **Container Max-width** ไม่ชัดเจน (max-w-4xl vs max-w-7xl vs none)

---

## 🎯 Design Decisions (User Approved)

### ตัดสินใจแล้ว:
- ✅ **Table Headers:** ใช้ Gradient Header (`bg-gradient-to-r from-blue-600 to-purple-600`) สำหรับทุกตาราง
- ✅ **Page Backgrounds:** เอา gradient ออก ใช้ `bg-bg-cream` เหมือน Settings pages
- ✅ **File Location:** `./LAYOUT_PLAN.md`

---

## 🎨 Design Tokens (Standard)

### Rounded Corners
```css
/* Standard for all components */
Cards: rounded-xl
Buttons: rounded-xl
Inputs: rounded-xl
Modals: rounded-2xl
Badges: rounded-lg
```

### Shadows
```css
/* Standard shadows */
Cards: shadow-lg
Modals: shadow-2xl
Hover states: shadow-xl
```

### Spacing
```css
/* Consistent spacing */
Section gaps: space-y-6 or gap-6
Card padding: p-6
Container padding: p-4 lg:p-6
Form fields: space-y-6
Grid gaps: gap-6
```

### Container Max-widths
```css
/* Purpose-based max-width */
Settings/Forms: max-w-4xl mx-auto
Tables/Lists: max-w-7xl mx-auto
Dashboard/POS: no max-width (full width)
```

### Colors
```css
/* Primary colors */
Primary Blue: blue-600
Accent Purple: purple-600
Success: green-600
Warning: orange-500
Danger: red-600

/* Backgrounds */
Page: bg-bg-cream
Cards: bg-white
Sidebar: bg-bg-sidebar
Table headers: bg-gradient-to-r from-blue-600 to-purple-600

/* Text */
Headings: text-gray-900
Body: text-gray-700
Muted: text-gray-500
```

### Typography
```css
/* Standard text sizes */
Page title: text-2xl font-bold text-gray-900
Page subtitle: text-sm text-gray-500
Card title: text-xl font-bold text-gray-900
Section title: text-lg font-semibold text-gray-900
Body text: text-sm text-gray-700
Labels: text-sm font-medium text-gray-700
Helper text: text-xs text-gray-500
```

---

## 📋 Detailed Analysis

### 1. CONTAINER LAYOUTS

#### Current State:
| Page | Max-width | Padding | Background |
|------|-----------|---------|------------|
| Settings Pages (9 files) | `max-w-4xl` | `p-6` | `bg-bg-cream` |
| Dashboard | None | `space-y-6` | `bg-bg-cream` |
| POS | None | `p-4` | `bg-gradient-to-br` ❌ |
| Products | None | `p-4` | `bg-gradient-to-br` ❌ |
| Sales History | `max-w-7xl` | `p-4` | `bg-gradient-to-br` ❌ |
| Category | None | `p-4` | `bg-gradient-to-br` ❌ |
| Reports | None | `p-4 lg:p-6` | `bg-bg-cream` |

#### Issues:
- ⚠️ POSPage, CategoryManagementPage, ProductsPage, SalesHistoryPage ใช้ gradient backgrounds
- ⚠️ Padding ไม่สอดคล้อง (p-4 vs p-6)
- ⚠️ Max-width ไม่มีกฎที่ชัดเจน

#### Target State:
- ✅ เอา gradient backgrounds ออกทั้งหมด → ใช้ `bg-bg-cream`
- ✅ Settings/Forms → `max-w-4xl mx-auto`
- ✅ Tables/Lists → `max-w-7xl mx-auto`
- ✅ Dashboard/POS → full width
- ✅ Padding → `p-4 lg:p-6` consistent

---

### 2. CARD STYLES

#### Current State:
| Style Pattern | Rounded | Shadow | Border | Pages |
|--------------|---------|--------|--------|-------|
| Pattern A | `rounded-lg` | `shadow-md` | `border border-gray-200` | Settings (9 pages) |
| Pattern B | `rounded-xl` | `shadow-md` | none | Dashboard |
| Pattern C | `rounded-2xl` | `shadow-lg` | `border border-gray-100` | POS, Category, Products |
| Pattern D | `rounded-2xl` | `shadow-lg` | `border border-gray-200` | Sales History |

#### Issues:
- ⚠️ 4 แบบที่แตกต่างกัน
- ⚠️ Rounded corners ไม่สอดคล้อง
- ⚠️ Shadow intensity แตกต่างกัน

#### Target State:
```jsx
/* Standard Card Component */
<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
```

#### Files to Update:
1. **Settings Pages (9 files):** `rounded-lg` → `rounded-xl`, `shadow-md` → `shadow-lg`
   - VenueSettingsPage.jsx (L73)
   - BookingSettingsPage.jsx (L82)
   - PaymentSettingsPage.jsx (L102)
   - GeneralSettingsPage.jsx (L89)
   - OperatingHoursPage.jsx (L120)
   - CourtsPage.jsx (L95)
   - CourtsAddPage.jsx (L57)
   - CourtsEditPage.jsx (L87)
   - TimeSlotsPage.jsx (L174)

2. **Dashboard:** Add border
   - DashboardPage.jsx (L120, L151, L181)

3. **POS/Products/Category/Sales:** `rounded-2xl` → `rounded-xl`, `border-gray-100` → `border-gray-200`
   - POSPage.jsx (L154)
   - ProductsPage.jsx (L167)
   - CategoryManagementPage.jsx (L160)
   - SalesHistoryPage.jsx (L146)

---

### 3. TABLE STYLES

#### Current State:
| Page | Header BG | Header Text | Row Hover |
|------|-----------|-------------|-----------|
| CourtsPage | `bg-gray-50` | `text-gray-500` | `hover:bg-gray-50` |
| TimeSlotsPage | `bg-gray-50` | `text-gray-500` | - |
| ProductsPage | Gradient ✅ | `text-white` | `hover:bg-gray-50` |
| SalesHistoryPage | Gradient ✅ | `text-white` | `hover:bg-gray-50` |
| PlayersPage | `bg-gradient-to-r from-gray-50` | `text-gray-700` | `hover:bg-blue-50` |
| GroupPlayPage | Mixed | Mixed | `hover:bg-blue-50` |

#### Issues:
- ⚠️ 3 แบบที่แตกต่างกัน (gray, gradient, mixed)
- ⚠️ Hover effects ไม่สอดคล้อง
- ⚠️ Padding แตกต่างกัน (py-3 vs py-4)

#### Target State (User Selected: Gradient Header):
```jsx
/* Standard Table Header */
<thead className="bg-gradient-to-r from-blue-600 to-purple-600">
  <tr>
    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
      Header
    </th>
  </tr>
</thead>

/* Standard Table Row */
<tr className="hover:bg-blue-50 transition-all duration-150">
  <td className="px-6 py-4 text-sm text-gray-900">Content</td>
</tr>
```

#### Files to Update:
1. **CourtsPage.jsx:** Gray → Gradient (L204-212)
2. **TimeSlotsPage.jsx:** Gray → Gradient (L282-291)
3. **UserManagementPage.jsx:** Gray → Gradient (check table headers)
4. **PlayersPage.jsx:** Mixed gradient → Standard gradient (L380-395)
5. **GroupPlayPage.jsx:** Mixed → Standard gradient (L580-595)
6. **BookingsPage.jsx:** Add/update to gradient if exists

---

### 4. PAGE BACKGROUNDS

#### Current State:
| Page | Background |
|------|------------|
| Most pages | `bg-bg-cream` ✅ |
| POSPage | `bg-gradient-to-br from-blue-50 via-white to-purple-50` ❌ |
| ProductsPage | `bg-gradient-to-br from-blue-50 via-white to-purple-50` ❌ |
| CategoryManagementPage | `bg-gradient-to-br from-blue-50 via-white to-purple-50` ❌ |
| SalesHistoryPage | `bg-gradient-to-br from-blue-50 via-white to-purple-50` ❌ |

#### Target State (User Selected: Remove Gradients):
- ✅ เอา gradient backgrounds ออกทั้งหมด
- ✅ ใช้ `bg-bg-cream` เหมือน Settings pages

#### Files to Update:
1. **POSPage.jsx (L151):** Remove gradient, use `bg-bg-cream`
2. **ProductsPage.jsx (L164):** Remove gradient, use `bg-bg-cream`
3. **CategoryManagementPage.jsx (L157):** Remove gradient, use `bg-bg-cream`
4. **SalesHistoryPage.jsx (L143):** Remove gradient, use `bg-bg-cream`

---

### 5. BUTTON STYLES

#### Current State:
| Type | Padding | Rounded | Found In |
|------|---------|---------|----------|
| Primary | `px-4 py-2` | `rounded-lg` | Settings pages |
| Primary | `px-6 py-3` | `rounded-xl` | POS, Products, Category |
| Secondary | `px-3 py-1.5` | `rounded-lg` | Various |
| Icon buttons | `p-2` | `rounded-lg` | Various |

#### Target State:
```jsx
/* Primary Button */
<button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
  Primary Action
</button>

/* Secondary Button */
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all border border-gray-300">
  Secondary Action
</button>

/* Danger Button */
<button className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all">
  Delete
</button>

/* Icon Button */
<button className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
  <Icon size={20} />
</button>
```

#### Files to Update:
- All Settings pages: Update save buttons to `px-6 py-3 rounded-xl`
- All pages: Standardize secondary buttons to `px-4 py-2 rounded-xl`

---

### 6. SETTINGS PAGES - ICON COLORS

#### Current State:
| Page | Icon Color | Badge BG |
|------|------------|----------|
| VenueSettingsPage | `text-blue-600` | `bg-blue-100` |
| BookingSettingsPage | `text-purple-600` | `bg-purple-100` |
| PaymentSettingsPage | `text-orange-600` | `bg-orange-100` |
| GeneralSettingsPage | `text-gray-600` | `bg-gray-100` |
| OperatingHoursPage | `text-green-600` | `bg-green-100` |
| CourtsPage | `text-blue-600` | `bg-blue-100` |
| TimeSlotsPage | `text-blue-600` | `bg-blue-100` |

#### Issue:
- ⚠️ แต่ละหน้าใช้สีต่างกัน ทำให้ไม่สอดคล้อง

#### Target State:
- ✅ ใช้ `text-blue-600` และ `bg-blue-100` สำหรับทุก Settings page

#### Files to Update:
1. **BookingSettingsPage.jsx:** purple → blue
2. **PaymentSettingsPage.jsx:** orange → blue
3. **GeneralSettingsPage.jsx:** gray → blue
4. **OperatingHoursPage.jsx:** green → blue

---

### 7. MODAL STYLES

#### Current State:
| Page | Rounded | Shadow | Header Style |
|------|---------|--------|--------------|
| UserManagementPage | `rounded-xl` | `shadow-2xl` | White with border |
| POSPage | `rounded-2xl` | `shadow-2xl` | Gradient |
| SalesHistoryPage | `rounded-2xl` | `shadow-2xl` | White with border |
| CategoryManagementPage | `rounded-2xl` | `shadow-2xl` | Gradient |

#### Target State:
```jsx
/* Standard Modal */
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="p-6 border-b border-gray-200">
      <h3 className="text-xl font-bold text-gray-900">Modal Title</h3>
    </div>

    {/* Content */}
    <div className="p-6">
      Content here
    </div>

    {/* Footer */}
    <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
      <button>Cancel</button>
      <button>Confirm</button>
    </div>
  </div>
</div>
```

#### Files to Update:
- Remove gradient modal headers from POSPage and CategoryManagementPage
- Standardize to white header with border-b

---

## 🚀 Implementation Plan

### Phase 1: Foundation (Priority: Critical) ⭐
**Estimated Time:** 2-3 hours

#### 1.1 Remove Gradient Page Backgrounds
- [ ] POSPage.jsx (L151)
- [ ] ProductsPage.jsx (L164)
- [ ] CategoryManagementPage.jsx (L157)
- [ ] SalesHistoryPage.jsx (L143)

**Changes:**
```jsx
// Before
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">

// After
<div className="min-h-screen bg-bg-cream p-4 lg:p-6">
```

#### 1.2 Standardize Card Styles (9 Settings Pages)
- [ ] VenueSettingsPage.jsx
- [ ] BookingSettingsPage.jsx
- [ ] PaymentSettingsPage.jsx
- [ ] GeneralSettingsPage.jsx
- [ ] OperatingHoursPage.jsx
- [ ] CourtsPage.jsx
- [ ] CourtsAddPage.jsx
- [ ] CourtsEditPage.jsx
- [ ] TimeSlotsPage.jsx

**Changes:**
```jsx
// Before
<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">

// After
<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
```

---

### Phase 2: Settings Pages Icon Colors (Priority: High)
**Estimated Time:** 30 minutes

- [ ] BookingSettingsPage.jsx: `purple-600` → `blue-600`
- [ ] PaymentSettingsPage.jsx: `orange-600` → `blue-600`
- [ ] GeneralSettingsPage.jsx: `gray-600` → `blue-600`
- [ ] OperatingHoursPage.jsx: `green-600` → `blue-600`

**Changes:**
```jsx
// Before (example: BookingSettingsPage)
<div className="bg-purple-100 p-3 rounded-lg">
  <Calendar className="w-6 h-6 text-purple-600" />
</div>

// After
<div className="bg-blue-100 p-3 rounded-lg">
  <Calendar className="w-6 h-6 text-blue-600" />
</div>
```

---

### Phase 3: Table Headers - Apply Gradient (Priority: High) ⭐
**Estimated Time:** 1-2 hours

#### Files to Update:
- [ ] CourtsPage.jsx (L204-212)
- [ ] TimeSlotsPage.jsx (L282-291)
- [ ] UserManagementPage.jsx
- [ ] PlayersPage.jsx (L380-395)
- [ ] GroupPlayPage.jsx (L580-595)
- [ ] BookingsPage.jsx

**Before:**
```jsx
<thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
```

**After:**
```jsx
<thead className="bg-gradient-to-r from-blue-600 to-purple-600">
  <tr>
    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
```

**Also Update Row Hover:**
```jsx
// Standard hover effect
<tr className="hover:bg-blue-50 transition-all duration-150">
```

---

### Phase 4: Button Standardization (Priority: Medium)
**Estimated Time:** 1 hour

#### 4.1 Primary Buttons
Update all primary action buttons:
```jsx
// Before (Settings pages)
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">

// After
<button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg">
```

#### 4.2 Secondary Buttons
```jsx
// Standard secondary button
<button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all border border-gray-300">
```

---

### Phase 5: Dashboard & POS/Products Adjustments (Priority: Medium)
**Estimated Time:** 1 hour

- [ ] DashboardPage.jsx: Add borders to cards
- [ ] POSPage.jsx: Update card rounded from `rounded-2xl` → `rounded-xl`
- [ ] ProductsPage.jsx: Update card rounded from `rounded-2xl` → `rounded-xl`
- [ ] CategoryManagementPage.jsx: Update card rounded from `rounded-2xl` → `rounded-xl`
- [ ] SalesHistoryPage.jsx: Update card rounded from `rounded-2xl` → `rounded-xl`

---

### Phase 6: Modal Standardization (Priority: Low)
**Estimated Time:** 30 minutes

- [ ] Remove gradient headers from POSPage modals
- [ ] Remove gradient headers from CategoryManagementPage modals
- [ ] Standardize to white header with `border-b border-gray-200`

---

## ✅ Progress Tracking

### Overall Progress: 0% Complete (0/40 tasks)

| Phase | Status | Tasks Complete | Total Tasks |
|-------|--------|----------------|-------------|
| Phase 1 | 🔴 Not Started | 0 | 13 |
| Phase 2 | 🔴 Not Started | 0 | 4 |
| Phase 3 | 🔴 Not Started | 0 | 6 |
| Phase 4 | 🔴 Not Started | 0 | ~12 |
| Phase 5 | 🔴 Not Started | 0 | 5 |
| Phase 6 | 🔴 Not Started | 0 | ~3 |

### Legend:
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Complete
- ⭐ High Impact

---

## 📝 Testing Checklist

After each phase, verify:

- [ ] Visual consistency across all pages
- [ ] No broken layouts on mobile/tablet/desktop
- [ ] All hover effects work properly
- [ ] No TypeScript/ESLint warnings
- [ ] All E2E tests still pass
- [ ] Dark mode compatibility (if applicable)

### Test Commands:
```bash
# Visual inspection
npm run dev

# Run E2E tests
cd frontend && npm run test:e2e

# Run backend tests
cd backend && npm test
```

---

## 📚 Before/After Examples

### Example 1: Card Style

**Before (Settings Page):**
```jsx
<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
  <h2 className="text-xl font-bold text-text-primary mb-4">Card Title</h2>
  <p>Content</p>
</div>
```

**After:**
```jsx
<div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">Card Title</h2>
  <p>Content</p>
</div>
```

### Example 2: Table Header

**Before (CourtsPage):**
```jsx
<thead className="bg-gray-50">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      Court Name
    </th>
  </tr>
</thead>
```

**After:**
```jsx
<thead className="bg-gradient-to-r from-blue-600 to-purple-600">
  <tr>
    <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
      Court Name
    </th>
  </tr>
</thead>
```

### Example 3: Page Background

**Before (POSPage):**
```jsx
<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
```

**After:**
```jsx
<div className="min-h-screen bg-bg-cream p-4 lg:p-6">
```

---

## 🎯 Success Criteria

Layout standardization จะถือว่าสำเร็จเมื่อ:

1. ✅ ทุกหน้าใช้ rounded corners เหมือนกัน (rounded-xl)
2. ✅ ทุกหน้าใช้ shadow intensity เหมือนกัน (shadow-lg)
3. ✅ Table headers ทั้งหมดใช้ gradient style
4. ✅ ไม่มี gradient page backgrounds
5. ✅ Settings pages ใช้สี icon เดียวกันทั้งหมด (blue-600)
6. ✅ Button styles สอดคล้องกันทุกหน้า
7. ✅ Container max-widths มีกฎที่ชัดเจน
8. ✅ ไม่มี TypeScript/ESLint warnings
9. ✅ E2E tests ผ่านทั้งหมด
10. ✅ Visual consistency ตรวจสอบแล้วบนทุก breakpoint

---

## 📌 Notes

- **Backup:** สร้าง git branch ใหม่ก่อนเริ่มแก้ไข
- **Review:** ตรวจสอบ visual consistency หลังแก้ไขแต่ละ phase
- **Testing:** รัน E2E tests หลังแก้ไขเสร็จทุก phase
- **Documentation:** Update DEVELOPMENT_PLAN.md เมื่อเสร็จสมบูรณ์

---

**Last Updated:** 2025-11-21
**Next Review:** After Phase 1 completion
