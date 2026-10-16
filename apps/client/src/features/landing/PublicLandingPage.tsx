import React, { useEffect, useState } from "react";
import type { StoreLandingPageData, PublicLandingPageProps } from "@a2order/shared";
import { requestApi } from "@/services/api/apiClient";
import { LoadingScreen } from "@/components/ui";

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ slug }) => {
  const [page, setPage] = useState<StoreLandingPageData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setPage(null); setError("");
    requestApi<StoreLandingPageData>("/landing/public/" + encodeURIComponent(slug)).then(value => { if (active) setPage(value); }, reason => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [slug]);
  if (error) return <div className="p-5 bg-surface-canvas text-ink-muted">{error}</div>;
  if (!page) return <LoadingScreen />;
  return <main className="min-h-screen bg-surface-canvas font-sans">
    <div className="mx-auto max-w-3xl bg-white">
      <div className="p-4 bg-white flex items-center justify-between border-b border-surface-border sticky top-0 z-10">
        <div className="flex items-center gap-2.5">
          <img src="/logo-symbol.jpg" alt="Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm" />
          <div><h1 className="font-black text-xs text-ink-primary leading-tight">{page.storeName}</h1><span className="text-[10px] text-emerald-700 font-bold">Giờ phục vụ: {page.openingHours || "Liên hệ quán"}</span></div>
        </div>
        {page.hotline && <a href={"tel:" + page.hotline.replace(/[^+\d]/g, "")} className="px-3 py-1.5 rounded-full bg-brand-900 text-white text-[11px] font-bold shadow-sm">Gọi quán đặt bàn</a>}
      </div>
      <div className="relative h-44 bg-brand-950 text-white p-6 flex flex-col justify-end overflow-hidden">
        {page.heroBannerUrl && <img src={page.heroBannerUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-40" />}
        <div className="relative z-10"><h2 className="text-xl font-black tracking-tight text-white mt-1 leading-tight">{page.heroTitle}</h2><p className="text-xs text-brand-200 mt-1 max-w-md line-clamp-2">{page.heroSubtitle}</p></div>
      </div>
      <div className="p-5 bg-surface-canvas text-xs leading-relaxed text-ink-muted border-b border-surface-border"><p>{page.storyContent}</p></div>
      <div className="p-5 space-y-4">
        <h2 className="text-xs font-black uppercase text-ink-primary tracking-wider block">Thực đơn</h2>
        {page.publicMenuCategories.map((category, index) => <section key={index} className="space-y-2">
          <h3 className="font-extrabold text-xs text-brand-900">{category.name}</h3>
          <div className="space-y-2">{category.items.map(item => <div key={item.id} className="p-3 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-between">
            <div><h4 className="font-bold text-xs text-ink-primary">{item.name}</h4><p className="text-[10px] text-ink-muted">{item.description}</p></div>
            <span className="font-black text-xs text-brand-900 shrink-0 whitespace-nowrap">{item.price.toLocaleString("vi-VN")} đ</span>
          </div>)}</div>
        </section>)}
      </div>
      <footer className="p-4 bg-brand-950 text-white text-center text-xs space-y-1"><p className="font-bold">{page.address}</p><p className="text-brand-300 text-[11px]">Hotline: {page.hotline || "Chưa cập nhật"}</p></footer>
    </div>
  </main>;
};
