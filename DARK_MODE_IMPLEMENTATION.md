# 🌓 Hệ Thống Light/Dark Mode - Hướng Dẫn

## ✅ Đã Hoàn Thành

### 1. Tailwind Configuration

**File:** `frontend/tailwind.config.js`

- ✅ Bật `darkMode: "class"`
- ✅ Thêm custom colors cho dark mode

### 2. Theme Context

**File:** `frontend/src/contexts/ThemeContext.jsx`

- ✅ Quản lý theme state (light/dark)
- ✅ Lưu theme vào localStorage
- ✅ Tự động load theme khi F5
- ✅ Tự động thêm/xóa class "dark" vào `document.documentElement`

### 3. Theme Toggle Component

**File:** `frontend/src/components/ThemeToggle.jsx`

- ✅ UI đúng như mô tả:
  - Light mode: Icon mặt trời trong vòng tròn trắng, nền xanh (#3B82F6)
  - Dark mode: Icon mặt trăng trong vòng tròn trắng, nền xám (#374151)
- ✅ Animation mượt (300ms transition)
- ✅ Switch có hiệu ứng trượt giống iOS

### 4. Header Integration

**File:** `frontend/src/components/Header.jsx`

- ✅ Thêm ThemeToggle vào Header
- ✅ Đặt giữa Bell Icon và Profile Picture
- ✅ Thêm dark mode classes cho các icon khác

### 5. App Integration

**File:** `frontend/src/App.jsx`

- ✅ Wrap app với `ThemeProvider`
- ✅ ThemeProvider được đặt ngoài cùng để toàn bộ app có thể dùng

### 6. Global Styles

**File:** `frontend/src/styles/globals.css`

- ✅ Thêm dark mode styles cho body
- ✅ Transition mượt khi chuyển theme

---

## 🎨 UI Design

### Light Mode
- Background: Trắng (`bg-white`)
- Text: Đen (`text-gray-900`)
- Toggle: Nền xanh (#3B82F6), icon mặt trời xanh trong vòng tròn trắng

### Dark Mode
- Background: Xám đậm (`bg-gray-900` / #111827)
- Text: Trắng (`text-gray-100`)
- Toggle: Nền xám (#374151), icon mặt trăng xám trong vòng tròn trắng

---

## 📋 Cách Sử Dụng

### 1. Sử dụng Theme trong Component

```jsx
import { useTheme } from "../contexts/ThemeContext";

const MyComponent = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
};
```

### 2. Sử dụng Tailwind Dark Mode Classes

```jsx
// Background
<div className="bg-white dark:bg-gray-900">

// Text
<p className="text-gray-900 dark:text-gray-100">

// Border
<div className="border-gray-300 dark:border-gray-600">

// Hover
<button className="hover:bg-gray-50 dark:hover:bg-gray-800">
```

---

## 🔧 Files Đã Tạo/Sửa

### Tạo Mới:
1. ✅ `frontend/src/contexts/ThemeContext.jsx` - Theme context provider
2. ✅ `frontend/src/components/ThemeToggle.jsx` - Toggle component

### Sửa Đổi:
1. ✅ `frontend/tailwind.config.js` - Bật darkMode: "class"
2. ✅ `frontend/src/App.jsx` - Thêm ThemeProvider
3. ✅ `frontend/src/components/Header.jsx` - Thêm ThemeToggle và dark classes
4. ✅ `frontend/src/styles/globals.css` - Thêm dark mode styles

---

## 🎯 Features

### ✅ Đã Implement:
- [x] Toggle button với animation mượt
- [x] Icon mặt trời (light mode) trong vòng tròn xanh
- [x] Icon mặt trăng (dark mode) trong vòng tròn xám
- [x] Lưu theme vào localStorage
- [x] Tự động load theme khi F5
- [x] Thêm/xóa class "dark" vào document.documentElement
- [x] Dark mode cho toàn bộ UI
- [x] Transition mượt khi chuyển theme

---

## 🚀 Testing

1. **Test Toggle:**
   - Click vào toggle button
   - Kiểm tra theme chuyển đổi
   - Kiểm tra animation mượt

2. **Test Persistence:**
   - Chuyển sang dark mode
   - Refresh page (F5)
   - Kiểm tra theme vẫn là dark mode

3. **Test UI:**
   - Kiểm tra background chuyển màu
   - Kiểm tra text chuyển màu
   - Kiểm tra các component khác cũng chuyển màu

---

## 📝 Lưu Ý

1. **Dark Mode Classes:**
   - Luôn thêm `dark:` prefix cho dark mode styles
   - Ví dụ: `bg-white dark:bg-gray-900`

2. **Transition:**
   - Thêm `transition-colors duration-300` để có animation mượt

3. **LocalStorage:**
   - Theme được lưu với key: `"theme"`
   - Giá trị: `"light"` hoặc `"dark"`

4. **Default Theme:**
   - Mặc định là `"light"` nếu chưa có trong localStorage

---

## 🎨 Customization

### Thay đổi màu dark mode:

**File:** `frontend/src/styles/globals.css`

```css
body {
  @apply bg-white dark:bg-gray-900; /* Thay đổi màu nền dark */
  @apply text-gray-900 dark:text-gray-100; /* Thay đổi màu chữ dark */
}
```

### Thay đổi màu toggle:

**File:** `frontend/src/components/ThemeToggle.jsx`

```jsx
// Light mode background
<div className="absolute inset-0 bg-blue-500 ... /> {/* Thay #3B82F6 */}

// Dark mode background
<div className="absolute inset-0 bg-gray-600 ... /> {/* Thay #374151 */}
```

---

## ✅ Kết Quả

Sau khi implement:
- ✅ Toggle button hoạt động mượt mà
- ✅ Theme được lưu và tự động load
- ✅ Toàn bộ UI chuyển đổi theme
- ✅ Animation mượt khi chuyển theme
- ✅ UI đúng như mô tả (icon mặt trời xanh, icon mặt trăng xám)

