import React, { useState } from "react";
import { AppModule, APP_MODULE_CATALOG } from "@a2order/shared";
import { Panel, Button, Icon } from "@/components/ui";
import { toast } from "@/stores/notificationStore";
import { CmsStoreSettingsProps } from "@/types/cms.types";

export const CmsStoreSettings: React.FC<CmsStoreSettingsProps> = ({
  enabledModules = [AppModule.CORE_POS],
  onSaveModules,
}) => {
  const [activeTab, setActiveTab] = useState<"store_info" | "modules_license">("store_info");

  // Tab 1: Store info state
  const [storeName, setStoreName] = useState("Phở Bò Nam Định - Chi Nhánh 1");
  const [phone, setPhone] = useState("0912 345 678");
  const [address, setAddress] = useState("Số 88 Phố Trần Thái Tông, Cầu Giấy, Hà Nội");
  const [bankBin, setBankBin] = useState("970415"); // VietinBank Napas
  const [bankAccount, setBankAccount] = useState("113366668888");
  const [bankOwnerName, setBankOwnerName] = useState("NGUYEN THANH AN");
  const [vatRate, setVatRate] = useState("8");

  // Tab 2: Modules state
  const [selectedModules, setSelectedModules] = useState<AppModule[]>(enabledModules);
  const [durationMonths, setDurationMonths] = useState<number>(6);

  const handleSaveStoreInfo = () => {
    toast.success("Đã lưu cấu hình tài khoản VietQR và thông tin quán thành công!");
  };

  const toggleModule = (modId: AppModule) => {
    if (modId === AppModule.CORE_POS) {
      toast.info("Vận hành Bàn & Đơn (Core POS) là module cốt lõi bắt buộc.");
      return;
    }

    if (selectedModules.includes(modId)) {
      setSelectedModules((prev) => prev.filter((m) => m !== modId));
    } else {
      setSelectedModules((prev) => [...prev, modId]);
    }
  };

  const handleApplyModules = () => {
    onSaveModules(selectedModules);
    toast.success("Đã cập nhật các module tính năng cho quán thành công! Menu thanh bên đã được làm mới.");
  };

  // Tính tiền gói thuê
  const monthlySum = selectedModules.reduce((sum, modId) => {
    const item = APP_MODULE_CATALOG.find((m) => m.id === modId);
    return sum + (item ? item.monthlyPrice : 0);
  }, 0);

  let discountPercent = 0;
  if (durationMonths >= 24) discountPercent = 30;
  else if (durationMonths >= 12) discountPercent = 20;
  else if (durationMonths >= 6) discountPercent = 10;
  else if (durationMonths >= 3) discountPercent = 5;

  const rawTotal = monthlySum * durationMonths;
  const discountAmount = Math.round((rawTotal * discountPercent) / 100);
  const finalTotal = rawTotal - discountAmount;

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-2xl font-black text-ink-primary tracking-tight">
            Cài Đặt Hệ Thống & Gói Cước
          </h2>
          <p className="text-xs text-ink-muted mt-0.5 line-clamp-1 sm:line-clamp-none">
            Quản lý tài khoản VietQR nhận tiền, thông tin in bill và gói bản quyền phần mềm.
          </p>
        </div>

        {/* Tab navigation buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-surface-muted rounded-2xl border border-surface-border overflow-x-auto no-scrollbar shrink-0 max-w-full">
          <button
            onClick={() => setActiveTab("store_info")}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === "store_info"
                ? "bg-white text-brand-900 shadow-sm"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Icon name="store" className="w-3.5 h-3.5" />
            <span className="sm:hidden">Quán & VietQR</span>
            <span className="hidden sm:inline">Thông Tin Quán & VietQR</span>
          </button>

          <button
            onClick={() => setActiveTab("modules_license")}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeTab === "modules_license"
                ? "bg-white text-brand-900 shadow-sm"
                : "text-ink-muted hover:text-ink-primary"
            }`}
          >
            <Icon name="key" className="w-3.5 h-3.5" />
            <span className="sm:hidden">Bản Quyền</span>
            <span className="hidden sm:inline">Gói Tính Năng & Bản Quyền</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Store & VietQR Settings */}
      {activeTab === "store_info" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex justify-end">
            <Button
              size="sm"
              className="rounded-full gap-2 text-xs bg-brand-900 text-white shadow-sm"
              onClick={handleSaveStoreInfo}
            >
              <Icon name="save" className="w-3.5 h-3.5" />
              <span>Lưu Cấu Hình Quán</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Thông tin VietQR */}
            <Panel variant="default" padding="lg" className="space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <Icon name="vietqr" className="w-4 h-4 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-ink-primary">
                  Tài Khoản Ngân Hàng Nhận Tiền (VietQR Napas)
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">
                  Ngân hàng thụ hưởng:
                </label>
                <select
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
                >
                  <option value="970415">VietinBank (Ngân hàng TMCP Công thương Việt Nam)</option>
                  <option value="970436">Vietcombank (Ngân hàng Ngoại thương Việt Nam)</option>
                  <option value="970407">Techcombank (Ngân hàng Kỹ thương Việt Nam)</option>
                  <option value="970422">MBBank (Ngân hàng Quân đội)</option>
                  <option value="970418">BIDV (Ngân hàng Đầu tư và Phát triển)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">
                  Số tài khoản ngân hàng:
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold font-mono text-ink-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">
                  Tên chủ tài khoản (Viết hoa không dấu):
                </label>
                <input
                  type="text"
                  value={bankOwnerName}
                  onChange={(e) => setBankOwnerName(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3.5 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary uppercase"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
                <Icon name="checkCircle" className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tiền khách quét mã QR sẽ vào trực tiếp tài khoản này mà không qua trung gian.</span>
              </div>
            </Panel>

            {/* Thông tin nhà hàng & Thuế */}
            <Panel variant="default" padding="lg" className="space-y-4">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <Icon name="building" className="w-4 h-4 text-brand-800" />
                <h3 className="font-extrabold text-sm text-ink-primary">
                  Thông Tin Quán & Hóa Đơn Nhiệt
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">Tên quán ăn / nhà hàng:</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">Số điện thoại liên hệ:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">Địa chỉ quán:</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-2xl bg-surface-canvas border border-surface-border text-xs font-semibold text-ink-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-muted mb-1">Thuế VAT (% in hóa đơn):</label>
                <div className="flex items-center gap-3">
                  {["0", "8", "10"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setVatRate(r)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        vatRate === r ? "bg-brand-900 text-white" : "bg-surface-canvas border border-surface-border text-ink-muted"
                      }`}
                    >
                      {r}% VAT
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* Tab 2: Modules & License Subscription */}
      {activeTab === "modules_license" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Card trạng thái bản quyền hiện tại */}
          <Panel variant="featured" padding="lg" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-brand-200">Bản Quyền Quán Đang Sử Dụng</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400 text-brand-950">
                  Đang Hoạt Động
                </span>
              </div>
              <div className="text-xl font-black text-white flex items-center gap-3">
                <span>Khóa Bản Quyền:</span>
                <span className="font-mono bg-white/15 px-2.5 py-0.5 rounded-lg text-emerald-200">
                  A2-PRO-9F8A2B
                </span>
              </div>
              <p className="text-xs text-brand-200 mt-1">
                Gói dịch vụ: <strong>Chuyên Nghiệp (PRO)</strong> • Thời hạn còn lại: <strong>28 ngày</strong> (Hết hạn: 26/10/2026)
              </p>
            </div>

            <Button
              size="sm"
              className="rounded-full bg-white text-brand-900 hover:bg-brand-50 text-xs font-bold shrink-0 shadow-sm"
              onClick={() => toast.info("Vui lòng liên hệ Super Admin hoặc quét VietQR để gia hạn hợp đồng")}
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
              <span>Gia Hạn Bản Quyền</span>
            </Button>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái: Tùy biến Module theo nhu cầu */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black uppercase tracking-wider text-ink-muted">
                  CÁC MODULE TÍNH NĂNG (BẬT/TẮT THEO QUY MÔ QUÁN):
                </span>
                <span className="text-xs text-brand-800 font-bold">
                  Đang dùng: {selectedModules.length} / {APP_MODULE_CATALOG.length} module
                </span>
              </div>

              <div className="space-y-3">
                {APP_MODULE_CATALOG.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  const isCore = mod.id === AppModule.CORE_POS;

                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-start gap-4 ${
                        isChecked
                          ? "bg-white border-brand-800 shadow-sm"
                          : "bg-surface-canvas/60 border-surface-border opacity-70 hover:opacity-100"
                      }`}
                    >
                      <div className="pt-0.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                            isChecked
                              ? "bg-brand-900 text-white"
                              : "border-2 border-surface-border bg-white"
                          }`}
                        >
                          {isChecked && <Icon name="check" className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-ink-primary flex items-center gap-2">
                            <span>{mod.name}</span>
                            {isCore && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-surface-muted text-ink-muted">
                                Bắt buộc
                              </span>
                            )}
                          </h4>
                          <span className="font-black text-xs text-brand-900">
                            {mod.monthlyPrice.toLocaleString("vi-VN")} đ/tháng
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted mt-1 leading-relaxed">{mod.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cột phải: Tổng kết chi phí & Lưu áp dụng */}
            <div>
              <Panel variant="default" padding="lg" className="space-y-4 sticky top-6">
                <div className="border-b border-surface-border pb-3">
                  <h3 className="font-black text-sm text-ink-primary">Dự Toán Chi Phí Phần Mềm</h3>
                  <p className="text-xs text-ink-muted mt-0.5">Tính toán tự động theo số module đã chọn</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-muted mb-1.5">
                    Kỳ hạn thuê phần mềm:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    {[1, 6, 12, 24].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setDurationMonths(m)}
                        className={`py-2 px-3 rounded-2xl border text-center transition-all ${
                          durationMonths === m
                            ? "bg-brand-900 text-white border-brand-900"
                            : "bg-surface-canvas border-surface-border text-ink-muted"
                        }`}
                      >
                        {m} tháng {m >= 6 && <span className="text-[10px] block opacity-80">Giảm {m >= 24 ? 30 : m >= 12 ? 20 : 10}%</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border space-y-2 text-xs">
                  <div className="flex justify-between text-ink-muted">
                    <span>Đơn giá tháng:</span>
                    <span className="font-bold text-ink-primary">{monthlySum.toLocaleString("vi-VN")} đ</span>
                  </div>
                  <div className="flex justify-between text-ink-muted">
                    <span>Kỳ hạn thanh toán:</span>
                    <span>{durationMonths} tháng</span>
                  </div>
                  {discountPercent > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Ưu đãi kỳ hạn ({discountPercent}%):</span>
                      <span>-{discountAmount.toLocaleString("vi-VN")} đ</span>
                    </div>
                  )}
                  <div className="border-t border-surface-border pt-2 flex justify-between items-baseline font-black">
                    <span className="text-xs text-ink-primary">Tổng tiền thanh toán:</span>
                    <span className="text-lg text-brand-900">{finalTotal.toLocaleString("vi-VN")} đ</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-full gap-2 text-xs bg-brand-900 hover:bg-brand-950 text-white font-bold shadow-md"
                  onClick={handleApplyModules}
                >
                  <Icon name="checkCircle" className="w-4 h-4" />
                  <span>Áp Dụng Gói Tính Năng</span>
                </Button>

                <p className="text-[10px] text-ink-muted text-center leading-tight">
                  💡 Các tính năng chưa chọn sẽ tự động ẩn khỏi Menu để tinh gọn giao diện cho quán của bạn.
                </p>
              </Panel>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
