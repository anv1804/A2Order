/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      spacing: {
        "11": "2.75rem", // 44px: Touch Target tối thiểu
        "13": "3.25rem", // 52px: Nút hành động ngón cái
      },
      borderRadius: {
        "xl": "0.75rem",   // 12px
        "2xl": "1rem",     // 16px
        "3xl": "1.5rem",   // 24px: Thẻ Panel chuẩn Donezo
      },
      colors: {
        // Hệ màu Forest Green & Sage chuẩn Donezo
        brand: {
          50: "#F2F9F5",
          100: "#E8F5EE",
          200: "#A3DBCE",
          400: "#5EB695",
          500: "#48B182",
          600: "#2E795E",
          700: "#22604B",
          800: "#194B3A", // Màu nút chính & điểm nhấn
          900: "#12372A", // Thẻ Card Hero nổi bật
          950: "#0B241B",
        },
        surface: {
          canvas: "#F4F5F6", // Nền tổng thể dịu mắt
          card: "#FFFFFF",   // Nền thẻ trắng tinh khiết
          muted: "#ECEEED",  // Nền search pill & nút phụ
          border: "#E3E5E5", // Viền mảnh tinh tế
        },
        ink: {
          primary: "#161918", // Chữ chính
          muted: "#69706D",   // Chữ mô tả
          subtle: "#9CA29F",  // Chữ phụ
        },
      },
      boxShadow: {
        card: "0 2px 12px rgba(0, 0, 0, 0.03)",
        elevated: "0 10px 30px rgba(18, 55, 42, 0.08)",
      },
    },
  },
  plugins: [],
}
