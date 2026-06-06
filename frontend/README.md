
### **Cách tải thư viện trước khi chạy:**

```bash
npm install
```

**Hoặc nếu dùng các công cụ khác:**
```bash
pnpm install
# hoặc
bun install
```

**Yêu cầu:** Node.js 24.15.0 trở lên

### **Các thư viện chính (Dependencies):**
- **React 19** + TypeScript - Framework UI
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **GSAP** - Animation (scroll trigger, timeline)
- **Lenis** - Smooth scroll library
- **Framer Motion** - Motion animations
- **Three.js** - 3D graphics
- **Notiflix** - Notification system
- **Lucide-react** - Icon library
- **Axios** - HTTP requests
- **Zustand** - State management
- **PDF-parse, Mammoth, OfficeParser** - Document parsing

---

## ** Tóm tắt các Class/Component chính:**

### **1. LoginPanel (src/components/LoginPage/LoginPanel.tsx)**
- **Chức năng:** Component form chính xử lý đăng nhập/đăng ký/quên mật khẩu
- **Features:**
  - 3 chế độ: Login, Signup, Forgot Password
  - Kiểm tra độ mạnh mật khẩu (weak/medium/strong/very strong)
  - Validation email (@gmail.com)
  - OAuth login (Google, GitHub)
  - GSAP animations khi chuyển form
  - Notiflix notifications
  - Show/hide password toggle

### **2. Orb3D (src/components/LoginPage/Orb3D.tsx)**
- **Chức năng:** Hiển thị quả cầu 3D năng động bên cạnh login panel
- **Features:**
  - Core orb gradient (#6FFF00 neon green)
  - 3 rotating rings (rotateX, rotateZ, rotateY khác nhau)
  - Orbiting dot animation xung quanh quả cầu
  - Pure CSS animations (không dùng Three.js)

### **3. Field (src/components/LoginPage/Field.tsx)**
- **Chức năng:** Reusable input field component (standalone)
- **Features:**
  - Glass-morphism style
  - Icon support (Mail, Lock, User, etc.)
  - Placeholder styling

### **4. OrbisLanding (src/components/LoginPage/OrbisLanding.tsx)**
- **Chức năng:** Main landing page (left side) - trước khi đăng nhập
- **Features:**
  - Smooth scroll với Lenis + GSAP ScrollTrigger
  - 4 sections: Hero, Objectives, Creators (NFT grid), CTA
  - Lazy-load video (phát video chỉ khi visible)
  - Master play/pause/mute buttons
  - Navigation menu với smooth scroll
  - NFT card grid với hover effects
  - Footer with system status info

### **5. App (src/App.tsx)**
- **Chức năng:** Root component
- **Features:**
  - Layout: 65% left (OrbisLanding) + 35% right (LoginPanel)
  - State management: isLoggedIn, isLoading
  - localStorage persistence
  - Loader component during auth
  - Route to Dashboard after login

### **6. Thêm các component khác:**
- **HeroSection** - Video hero section
- **Header** - Top navigation
- **SocialBtn** - Glass button for social links
- **Footer** - System info footer
- **Loader** - Loading animation during login
- **Dashboard** - Main app after login

---

## ** Để chạy được project:**

```bash
npm install
npm run dev
# Mở http://localhost:5173
```

Dự án **3D animated login interface** với landing page sử dụng GSAP animations, Lenis smooth scroll, và Tailwind CSS glass morphism design! 
