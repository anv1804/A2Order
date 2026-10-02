import React, { useState } from "react";
import { Panel, Button, Badge, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { StoreLandingPageData } from "@a2order/shared";

import { CmsLandingPageEditorProps } from "@/types/cms.types";
import { useUnsavedChanges } from "@/stores/unsavedChangesStore";

const LANDING_PAGE_STORAGE_KEY = "a2order_landing_page_editor";

export const CmsLandingPageEditor: React.FC<CmsLandingPageEditorProps> = ({
  isUnlocked,
  onUpgradeClick,
}) => {
  const [devicePreview, setDevicePreview] = useState<"desktop" | "mobile">("desktop");
  const [pageData, setPageData] = useState<StoreLandingPageData>(() => {
    try {
      const saved = localStorage.getItem(LANDING_PAGE_STORAGE_KEY);
      if (saved) return JSON.parse(saved) as StoreLandingPageData;
    } catch {}
    return {
    storeId: "store-1",
    storeName: "Phở Bò Nam Định - Chi Nhánh 1",
    customDomain: "phobonamdinh.vn",
    slug: "pho-bo-nam-dinh",
    heroTitle: "Phở Bò Nam Định - Gia Truyền 30 Năm",
    heroSubtitle: "Hương vị truyền thống từ nước dùng ninh xương tươi 18 tiếng",
    heroBannerUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=1200&auto=format&fit=crop",
    storyContent: "Khởi nguồn từ gánh phở rong phố cổ năm 1995, Phở Bò Nam Định gìn giữ trọn vẹn hương vị nước dùng trong, ngọt thanh từ tủy bò tự nhiên cùng bánh phở tươi tráng tay mỗi sáng.",
    openingHours: "06:00 - 14:00 & 17:00 - 22:30",
    hotline: "0912 345 678",
    address: "Số 88 Phố Trần Thái Tông, Cầu Giấy, Hà Nội",
    googleMapsUrl: "https://maps.google.com",
    isBookingOpen: true,
    isPublished: true,
    publicMenuCategories: [
      {
        name: "Phở Bò Truyền Thống",
        items: [
          { id: "m1", name: "Phở Bò Tái Nạm", price: 65000, description: "Bò tái mềm mọng kèm nạm giòn thơm nức" },
          { id: "m2", name: "Phở Bò Tái Lăn", price: 75000, description: "Thịt bò xào lăn tỏi lửa lớn dậy mùi" },
          { id: "m3", name: "Phở Đặc Biệt", price: 90000, description: "Đầy đặn tinh hoa bát phở truyền thống" },
        ],
      },
      {
        name: "Đồ Uống & Tráng Miệng",
        items: [
          { id: "d1", name: "Trà Đào Cam Sả", price: 35000, description: "Trà ủ lạnh trái cây thanh mát" },
          { id: "d2", name: "Trứng Trần Nước Béo", price: 15000, description: "Trứng trần lòng đào béo ngậy" },
        ],
      },
    ],
    };
  });
  const [savedPageData, setSavedPageData] = useState(() => JSON.stringify(pageData));
  useUnsavedChanges("landing_page_editor", isUnlocked && JSON.stringify(pageData) !== savedPageData);

  // MÀN HÌNH KHÓA TRẢ PHÍ (PAYWALL) NẾU CHƯA THUÊ MODULE LANDING PAGE
  if (!isUnlocked) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-brand-900 text-white flex items-center justify-center mx-auto shadow-elevated">
          <Icon name="lock" className="w-7 h-7" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full text-xs font-black bg-brand-50 text-brand-900 border border-brand-200">
            TÍNH NĂNG TRẢ PHÍ (ADD-ON)
          </span>
          <h2 className="text-2xl font-black text-ink-primary tracking-tight mt-3">
            Website & Landing Page Thương Hiệu Riêng
          </h2>
          <p className="text-xs text-ink-muted max-w-md mx-auto mt-2 leading-relaxed">
            Sở hữu website riêng với tên miền thương hiệu (ví dụ: <span className="font-bold text-ink-primary">phobonamdinh.vn</span>), giới thiệu câu chuyện quán, thực đơn xem trước và nhận đặt bàn trước tự động.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-surface-border max-w-md mx-auto shadow-card text-left space-y-3">
          <div className="flex items-baseline justify-between border-b border-surface-border pb-3">
            <span className="text-xs font-bold text-ink-muted">Chi phí mở rộng:</span>
            <span className="text-xl font-black text-brand-900">
              49.000 đ<span className="text-xs font-normal text-ink-muted">/tháng</span>
            </span>
          </div>

          <ul className="text-xs space-y-2 text-ink-muted">
            <li className="flex items-center gap-2">
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Gắn tên miền riêng hoặc nhận subdomain miễn phí</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hiển thị thực đơn kèm giá công khai chuẩn SEO</span>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="checkCircle" className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Khách đặt bàn trước nhận ngay thông báo tại quầy</span>
            </li>
          </ul>

          <div className="pt-2">
            <Button
              size="md"
              className="w-full rounded-2xl bg-brand-900 hover:bg-brand-950 text-white font-extrabold text-xs gap-2"
              onClick={onUpgradeClick}
            >
              <span>Kích Hoạt Trong Gói Tính Năng</span>
              <Icon name="arrowRight" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    localStorage.setItem(LANDING_PAGE_STORAGE_KEY, JSON.stringify(pageData));
    setSavedPageData(JSON.stringify(pageData));
    toast.success("Đã lưu và xuất bản trang Landing Page thương hiệu thành công!");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">
              Trang Web Của Quán
            </h2>
            <Badge variant="success" className="font-extrabold text-[10px]">
              Website
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Giới thiệu quán, thực đơn xem trước và nhận đặt bàn trực tuyến
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-2 text-xs"
            onClick={() => window.open(`http://localhost:4000/api/landing/public/${pageData.slug}`, "_blank")}
          >
            <Icon name="externalLink" className="w-3.5 h-3.5" />
            <span>Xem Thực Tế</span>
          </Button>

          <Button
            size="sm"
            className="rounded-full gap-2 text-xs bg-brand-900 hover:bg-brand-950 text-white shadow-sm"
            onClick={handleSave}
          >
            <Icon name="save" className="w-3.5 h-3.5" />
            <span>Lưu & Xuất Bản</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form biên tập nội dung */}
        <div className="lg:col-span-5 space-y-4">
          <Panel variant="default" padding="md" className="space-y-4">
            <h3 className="font-black text-sm text-ink-primary flex items-center gap-2 border-b border-surface-border pb-2.5">
              <Icon name="globe" className="w-4 h-4 text-brand-800" />
              <span>Tên Miền & Định Danh</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1">
                Tên miền riêng (Custom Domain):
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pageData.customDomain || ""}
                  onChange={(e) => setPageData({ ...pageData, customDomain: e.target.value })}
                  placeholder="phobonamdinh.vn"
                  className="w-full h-10 px-3.5 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>
              <p className="text-[10px] text-ink-subtle mt-1">
                Trỏ bản ghi CNAME về <span className="font-mono font-bold text-ink-primary">cname.a2order.vn</span> để nhận SSL miễn phí.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1">
                Đường dẫn phụ (Slug A2Order):
              </label>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-ink-subtle">a2order.vn/s/</span>
                <input
                  type="text"
                  value={pageData.slug}
                  onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                  className="flex-1 h-9 px-3 rounded-xl bg-surface-canvas border border-surface-border font-semibold text-ink-primary"
                />
              </div>
            </div>
          </Panel>

          <Panel variant="default" padding="md" className="space-y-4">
            <h3 className="font-black text-sm text-ink-primary flex items-center gap-2 border-b border-surface-border pb-2.5">
              <Icon name="sparkles" className="w-4 h-4 text-brand-800" />
              <span>Nội Dung Giới Thiệu & Không Gian</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1">
                Tiêu đề chính (Hero Headline):
              </label>
              <input
                type="text"
                value={pageData.heroTitle}
                onChange={(e) => setPageData({ ...pageData, heroTitle: e.target.value })}
                className="w-full h-10 px-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1">
                Mô tả ngắn:
              </label>
              <input
                type="text"
                value={pageData.heroSubtitle || ""}
                onChange={(e) => setPageData({ ...pageData, heroSubtitle: e.target.value })}
                className="w-full h-10 px-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1">
                Câu chuyện thương hiệu (About Story):
              </label>
              <textarea
                rows={3}
                value={pageData.storyContent || ""}
                onChange={(e) => setPageData({ ...pageData, storyContent: e.target.value })}
                className="w-full p-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">
                  Hotline đặt bàn:
                </label>
                <input
                  type="text"
                  value={pageData.hotline || ""}
                  onChange={(e) => setPageData({ ...pageData, hotline: e.target.value })}
                  className="w-full h-10 px-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">
                  Giờ mở cửa:
                </label>
                <input
                  type="text"
                  value={pageData.openingHours}
                  onChange={(e) => setPageData({ ...pageData, openingHours: e.target.value })}
                  className="w-full h-10 px-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-muted mb-1">
                Địa chỉ quán:
              </label>
              <input
                type="text"
                value={pageData.address || ""}
                onChange={(e) => setPageData({ ...pageData, address: e.target.value })}
                className="w-full h-10 px-3 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
              />
            </div>
          </Panel>
        </div>

        {/* Right Column: Trình mô phỏng xem trước Live Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-ink-muted flex items-center gap-1.5">
              <Icon name="eye" className="w-3.5 h-3.5 text-brand-800" />
              <span>Xem trước giao diện khách nhìn thấy:</span>
            </span>

            {/* Device Switcher */}
            <div className="p-1 bg-surface-muted rounded-full flex gap-1 text-xs">
              <button
                onClick={() => setDevicePreview("desktop")}
                className={`px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold transition-all ${
                  devicePreview === "desktop"
                    ? "bg-white text-ink-primary shadow-sm"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                <Icon name="monitor" className="w-3.5 h-3.5" />
                <span>Máy tính</span>
              </button>
              <button
                onClick={() => setDevicePreview("mobile")}
                className={`px-3 py-1 rounded-full flex items-center gap-1 text-xs font-bold transition-all ${
                  devicePreview === "mobile"
                    ? "bg-white text-ink-primary shadow-sm"
                    : "text-ink-muted hover:text-ink-primary"
                }`}
              >
                <Icon name="smartphone" className="w-3.5 h-3.5" />
                <span>Điện thoại</span>
              </button>
            </div>
          </div>

          {/* Browser Mockup Window */}
          <div
            className={`mx-auto bg-white rounded-3xl border border-surface-border overflow-hidden shadow-2xl transition-all ${
              devicePreview === "mobile" ? "max-w-sm" : "w-full"
            }`}
          >
            {/* Browser top pill */}
            <div className="bg-surface-canvas px-4 py-2 border-b border-surface-border flex items-center gap-2 select-none">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="flex-1 text-center">
                <span className="px-3 py-0.5 rounded-full bg-white text-[10px] font-mono font-bold text-ink-muted border border-surface-border">
                  https://{pageData.customDomain || `a2order.vn/s/${pageData.slug}`}
                </span>
              </div>
            </div>

            {/* Live Landing Preview Content */}
            <div className="max-h-[580px] overflow-y-auto font-sans select-none">
              {/* Store Header */}
              <div className="p-4 bg-white flex items-center justify-between border-b border-surface-border sticky top-0 z-10">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/logo-symbol.jpg"
                    alt="Logo"
                    className="w-8 h-8 rounded-xl object-cover shadow-sm"
                  />
                  <div>
                    <h4 className="font-black text-xs text-ink-primary leading-tight">
                      {pageData.storeName}
                    </h4>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      ● Đang mở cửa ({pageData.openingHours})
                    </span>
                  </div>
                </div>

                <button className="px-3 py-1.5 rounded-full bg-brand-900 text-white text-[11px] font-bold shadow-sm">
                  Đặt bàn trước
                </button>
              </div>

              {/* Hero Banner */}
              <div className="relative h-44 bg-brand-950 text-white p-6 flex flex-col justify-end overflow-hidden">
                <img
                  src={pageData.heroBannerUrl}
                  alt="Banner"
                  className="absolute inset-0 w-full h-full object-cover opacity-40"
                />
                <div className="relative z-10">
                  <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold text-brand-200 backdrop-blur-sm">
                    Ẩm Thực Truyền Thống
                  </span>
                  <h3 className="text-xl font-black tracking-tight text-white mt-1 leading-tight">
                    {pageData.heroTitle}
                  </h3>
                  <p className="text-xs text-brand-200 mt-1 max-w-md line-clamp-2">
                    {pageData.heroSubtitle}
                  </p>
                </div>
              </div>

              {/* Story */}
              <div className="p-5 bg-surface-canvas text-xs leading-relaxed text-ink-muted border-b border-surface-border">
                <span className="text-[10px] font-black uppercase text-brand-800 tracking-wider block mb-1">
                  CÂU CHUYỆN CỦA QUÁN
                </span>
                <p>{pageData.storyContent}</p>
              </div>

              {/* Public Menu Preview */}
              <div className="p-5 space-y-4">
                <span className="text-xs font-black uppercase text-ink-primary tracking-wider block">
                  THỰC ĐƠN ĐẶC SẮC
                </span>

                {pageData.publicMenuCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-2">
                    <h5 className="font-extrabold text-xs text-brand-900">{cat.name}</h5>
                    <div className="space-y-2">
                      {cat.items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between"
                        >
                          <div>
                            <h6 className="font-bold text-xs text-ink-primary">{item.name}</h6>
                            <p className="text-[10px] text-ink-muted">{item.description}</p>
                          </div>
                          <span className="font-black text-xs text-brand-900 shrink-0">
                            {item.price.toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer info */}
              <div className="p-4 bg-brand-950 text-white text-center text-xs space-y-1">
                <p className="font-bold">{pageData.address}</p>
                <p className="text-brand-300 text-[11px]">Hotline: {pageData.hotline}</p>
                <p className="text-[10px] text-white/40 pt-2">Powered by A2Order Platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
