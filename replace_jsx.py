import re

with open("apps/cms/src/features/cms/components/CmsAdminPricingManager.tsx", "r") as f:
    content = f.read()

jsx_start = content.find("  return (")

new_jsx = """  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* HEADER TỐI GIẢN CHUẨN A2ORDER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-ink-primary tracking-tight">
              Cấu Hình Giá Tính Năng & Khuyến Mại (Super Admin)
            </h2>
            <Badge variant="success" className="font-extrabold text-[10px]">
              Platform Pricing Engine
            </Badge>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Cài đặt mức giá thuê hàng tháng cho từng module, chiết khấu kỳ hạn và tạo mã voucher khuyến mại.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-full gap-2 text-xs bg-brand-900 text-white"
            onClick={() => setIsVoucherModalOpen(true)}
          >
            <Icon name="plus" className="w-3.5 h-3.5" />
            <span>+ Tạo Voucher Mới</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ========================================== */}
        {/* LEFT COLUMN: MODULES & DISCOUNTS */}
        {/* ========================================== */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CATALOG */}
          <Panel variant="default" padding="lg">
            <h3 className="font-extrabold text-sm text-ink-primary flex items-center gap-2 border-b border-surface-border pb-3 mb-4">
              <Icon name="grid" className="w-4 h-4 text-brand-800" /> Bảng Giá Cơ Sở Từng Module (VND/Tháng)
            </h3>
            <div className="space-y-3">
              {catalog.map((mod) => (
                <div key={mod.id} className="p-3.5 rounded-2xl bg-surface-canvas border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-700 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <Icon name={mod.isCore ? "checkCircle" : "grid"} size={18} className="text-brand-800" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="font-extrabold text-xs text-ink-primary">{mod.name}</h4>
                        {mod.isCore && <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-brand-100 text-brand-900">Bắt buộc</span>}
                      </div>
                      <p className="text-[11px] text-ink-muted">{mod.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {editingModuleId === mod.id ? (
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <input type="number" value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} className="w-28 h-9 pl-3 pr-8 rounded-lg border border-surface-border font-black text-xs text-ink-primary outline-none focus:border-brand-800" autoFocus />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-ink-subtle">đ</span>
                        </div>
                        <button onClick={handleCancelEdit} className="w-8 h-8 rounded-lg bg-surface-muted text-ink-muted hover:bg-surface-border flex items-center justify-center"><Icon name="x" size={14} /></button>
                        <button onClick={() => handleSavePrice(mod.id)} className="w-8 h-8 rounded-lg bg-brand-900 text-white hover:bg-brand-950 flex items-center justify-center"><Icon name="check" size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-black text-ink-primary group-hover:text-brand-800 transition">{formatCurrency(mod.monthlyPrice)}</span>
                        <button onClick={() => handleEditPrice(mod)} className="w-8 h-8 rounded-lg bg-white border border-surface-border text-ink-muted hover:text-brand-800 hover:border-brand-200 flex items-center justify-center transition"><Icon name="edit2" size={14} /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* PERIOD DISCOUNTS */}
          <Panel variant="default" padding="lg">
            <h3 className="font-extrabold text-sm text-ink-primary flex items-center gap-2 border-b border-surface-border pb-3 mb-4">
              <Icon name="percent" className="w-4 h-4 text-brand-800" /> Khung Chiết Khấu Theo Kỳ Hạn
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {periodDiscounts.map((rule) => (
                <div key={rule.durationMonths} className="p-3 rounded-2xl border border-surface-border bg-surface-canvas text-center flex flex-col items-center justify-center group hover:border-brand-300 transition">
                  <span className="text-[10px] font-extrabold uppercase text-ink-muted mb-1">{rule.durationMonths} Tháng</span>
                  {editingDiscountMonths === rule.durationMonths ? (
                    <div className="flex items-center gap-1 mt-1">
                      <input type="number" value={discountPercentInput} onChange={(e) => setDiscountPercentInput(Number(e.target.value))} className="w-12 h-7 text-center rounded border border-brand-500 font-black text-xs outline-none" autoFocus />
                      <button onClick={() => setEditingDiscountMonths(null)} className="text-ink-muted hover:text-ink-primary"><Icon name="x" size={12} /></button>
                      <button onClick={() => handleSaveDiscount(rule.durationMonths)} className="text-brand-800 hover:text-brand-900"><Icon name="check" size={12} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1 cursor-pointer" onClick={() => handleEditDiscount(rule)}>
                      <span className={`text-lg font-black ${rule.discountPercent > 0 ? "text-emerald-600" : "text-ink-subtle"}`}>
                        {rule.discountPercent === 0 ? "0%" : `-${rule.discountPercent}%`}
                      </span>
                      <Icon name="edit2" size={12} className="text-surface-border group-hover:text-brand-800 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          {/* VOUCHERS */}
          <Panel variant="default" padding="lg">
            <div className="flex items-center justify-between border-b border-surface-border pb-3 mb-4">
              <h3 className="font-extrabold text-sm text-ink-primary flex items-center gap-2">
                <Icon name="tag" className="w-4 h-4 text-brand-800" /> Quản Lý Mã Khuyến Mại
              </h3>
              <span className="text-[10px] font-bold text-ink-muted bg-surface-muted px-2 py-1 rounded-full">{vouchers.length} mã đang lưu</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map((v) => (
                <div key={v.id} className={`relative rounded-xl border-2 border-dashed p-4 flex flex-col justify-between transition-all ${v.isActive ? "border-surface-border bg-white shadow-sm" : "border-surface-border bg-surface-muted/50 grayscale opacity-60"}`}>
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-canvas rounded-full border-r-2 border-dashed border-surface-border"></div>
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-canvas rounded-full border-l-2 border-dashed border-surface-border"></div>
                  
                  <div className="flex items-start justify-between mb-3">
                    <span className="inline-block px-2.5 py-1 bg-brand-900 text-white font-mono font-black text-xs rounded shadow-sm tracking-widest">{v.code}</span>
                    <button onClick={() => handleToggleVoucher(v.id, v.code, v.isActive)} className="text-ink-muted hover:text-ink-primary"><Icon name={v.isActive ? "ban" : "check"} size={14} /></button>
                  </div>
                  <div>
                    <p className="text-sm font-black text-brand-800 leading-none mb-1.5">
                      {v.discountType === "PERCENT" ? `Giảm ${v.discountValue}%` : `Giảm ${formatCurrency(v.discountValue)}`}
                    </p>
                    <p className="text-[10px] font-bold text-ink-muted">Kỳ hạn tối thiểu: {v.minContractMonths} tháng</p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-surface-border">
                    <div className="flex items-center justify-between text-[10px] font-bold text-ink-muted mb-1">
                      <span>Đã dùng: {v.usageCount} / {v.maxUsage}</span>
                      <span>{(v.usageCount/v.maxUsage * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-muted rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500" style={{ width: `${(v.usageCount/v.maxUsage)*100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ========================================== */}
        {/* RIGHT COLUMN: SIMULATOR (A2Order Style) */}
        {/* ========================================== */}
        <div className="lg:col-span-4">
          <Panel variant="default" padding="lg" className="sticky top-20 border-2 border-brand-100 bg-brand-50/30">
            <h3 className="text-sm font-black text-brand-900 flex items-center gap-2 border-b border-brand-200/50 pb-3 mb-4">
              <Icon name="monitor" className="text-brand-700 w-4 h-4" />
              Công Cụ Giả Lập Tính Giá
            </h3>
            
            <div className="space-y-5">
              {/* Chọn Module */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-brand-800 mb-2">1. Chọn tính năng (Khách hàng)</label>
                <div className="space-y-1.5">
                  {catalog.map(mod => (
                    <label key={mod.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer transition">
                      <input 
                        type="checkbox" 
                        checked={simSelectedModules.includes(mod.id)}
                        disabled={mod.isCore}
                        onChange={(e) => {
                          if (e.target.checked) setSimSelectedModules(prev => [...prev, mod.id]);
                          else setSimSelectedModules(prev => prev.filter(id => id !== mod.id));
                        }}
                        className="rounded border-surface-border text-brand-800 focus:ring-brand-800"
                      />
                      <span className="text-xs font-bold text-ink-primary flex-1">{mod.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Chọn Kỳ Hạn */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-brand-800 mb-2">2. Chọn kỳ hạn thanh toán</label>
                <div className="flex flex-wrap gap-2">
                  {[1, 3, 6, 12, 24].map(m => (
                    <button key={m} onClick={() => setSimMonths(m)} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${simMonths === m ? "bg-brand-900 border-brand-900 text-white shadow-sm" : "bg-white border-surface-border text-ink-muted hover:border-brand-300 hover:text-brand-800"}`}>
                      {m}T
                    </button>
                  ))}
                </div>
              </div>

              {/* Mã Voucher */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-brand-800 mb-2">3. Áp dụng Voucher (Tùy chọn)</label>
                <input type="text" value={simVoucherCode} onChange={(e) => setSimVoucherCode(e.target.value.toUpperCase())} placeholder="Nhập mã..." className="w-full bg-white border border-surface-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-ink-primary outline-none focus:border-brand-800 uppercase" />
                {simulation.vError && <p className="text-[10px] text-rose-600 mt-1 font-bold">{simulation.vError}</p>}
                {simulation.appliedVoucher && <p className="text-[10px] text-emerald-600 mt-1 font-bold">Mã hợp lệ! Đã áp dụng ưu đãi.</p>}
              </div>
            </div>

            {/* KẾT QUẢ TÍNH TOÁN */}
            <div className="mt-6 pt-4 border-t border-brand-200/50">
              <label className="block text-[10px] font-extrabold uppercase text-brand-800 mb-3">Phiếu Tính Tiền (Mô phỏng)</label>
              <div className="space-y-2 text-xs font-medium text-ink-secondary">
                <div className="flex justify-between">
                  <span>Giá gốc ({simMonths} tháng x {formatCurrency(simulation.baseMo)})</span>
                  <span>{formatCurrency(simulation.subtotal)}</span>
                </div>
                {simulation.pDiscAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Chiết khấu kỳ hạn ({simulation.pDiscPercent}%)</span>
                    <span>-{formatCurrency(simulation.pDiscAmount)}</span>
                  </div>
                )}
                {simulation.vDiscAmount > 0 && (
                  <div className="flex justify-between text-brand-700">
                    <span>Voucher [{simulation.appliedVoucher?.code}]</span>
                    <span>-{formatCurrency(simulation.vDiscAmount)}</span>
                  </div>
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-brand-200/50 flex items-end justify-between">
                <span className="text-sm font-bold text-ink-primary">Tổng thanh toán</span>
                <span className="text-xl font-black text-brand-900">{formatCurrency(simulation.total)}</span>
              </div>
            </div>
            
          </Panel>
        </div>
      </div>

      {/* MODAL TẠO VOUCHER */}
      {isVoucherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-primary/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-elevated p-6 space-y-4 border border-surface-border animate-scaleUp">
            <div className="flex items-center justify-between border-b border-surface-border pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
                  <Icon name="tag" className="w-5 h-5 text-brand-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-ink-primary">Phát Hành Voucher</h3>
                  <p className="text-xs text-ink-muted">Tạo mã ưu đãi cho quán mới</p>
                </div>
              </div>
              <button onClick={requestCloseVoucher} className="w-8 h-8 rounded-full flex items-center justify-center text-ink-subtle hover:bg-surface-muted hover:text-ink-primary"><Icon name="x" size={16} /></button>
            </div>

            <form onSubmit={handleCreateVoucherSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary mb-1">Mã Voucher (Ví dụ: TET2026)</label>
                <input type="text" value={newVoucherCode} onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase())} placeholder="MÃ VIẾT HOA..." required className="w-full h-11 px-3.5 rounded-xl border border-surface-border text-sm font-mono font-black uppercase focus:border-brand-800 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-secondary mb-1">Hình Thức Giảm</label>
                  <select value={newVoucherType} onChange={(e) => setNewVoucherType(e.target.value as "PERCENT" | "FIXED_AMOUNT")} className="w-full h-11 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 outline-none">
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED_AMOUNT">Số tiền (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-secondary mb-1">Giá Trị Giảm</label>
                  <input type="number" value={newVoucherValue} onChange={(e) => setNewVoucherValue(Number(e.target.value))} min={1} required className="w-full h-11 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-ink-secondary mb-1">Kỳ Hạn Tối Thiểu</label>
                  <select value={newVoucherMonths} onChange={(e) => setNewVoucherMonths(Number(e.target.value))} className="w-full h-11 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 outline-none">
                    <option value={1}>1 tháng</option>
                    <option value={3}>3 tháng</option>
                    <option value={6}>6 tháng</option>
                    <option value={12}>12 tháng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-secondary mb-1">Số Lượng Mã</label>
                  <input type="number" value={newVoucherLimit} onChange={(e) => setNewVoucherLimit(Number(e.target.value))} min={1} required className="w-full h-11 px-3 rounded-xl border border-surface-border text-xs font-bold focus:border-brand-800 outline-none" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
                <Button type="button" variant="outline" size="md" className="rounded-xl text-xs" onClick={requestCloseVoucher}>Hủy</Button>
                <Button type="submit" size="md" className="rounded-xl bg-brand-900 text-white text-xs px-6 hover:bg-brand-950">Tạo Ngay</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
"""

with open("apps/cms/src/features/cms/components/CmsAdminPricingManager.tsx", "w") as f:
    f.write(content[:jsx_start] + new_jsx)

