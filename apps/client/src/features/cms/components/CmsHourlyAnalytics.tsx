import React from "react";
import { Panel } from "@/components/ui";
import { CmsAnalyticsBar } from "@/types";

export const CmsHourlyAnalytics: React.FC = () => {
  const bars: CmsAnalyticsBar[] = [
    { label: "S", heightPercent: 45, isHatched: true },
    { label: "M", heightPercent: 74, isPeak: true, peakLabel: "74%" },
    { label: "T", heightPercent: 60 },
    { label: "W", heightPercent: 95 },
    { label: "T", heightPercent: 50, isHatched: true },
    { label: "F", heightPercent: 35, isHatched: true },
    { label: "S", heightPercent: 65, isHatched: true },
  ];

  return (
    <Panel variant="default" padding="lg" className="flex flex-col justify-between">
      <div>
        <h3 className="text-base font-extrabold text-ink-primary mb-1">Doanh Thu Theo Ngày</h3>
        <p className="text-xs text-ink-muted">Biểu đồ đối soát doanh thu tuần này</p>
      </div>

      <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
        {bars.map((bar, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative">
            {bar.isPeak && (
              <span className="absolute -top-7 px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-[10px] font-black text-brand-900 shadow-sm animate-bounce">
                {bar.peakLabel}
              </span>
            )}

            <div
              style={{ height: `${bar.heightPercent}%` }}
              className={`w-full max-w-[34px] rounded-full transition-all duration-300 ${
                bar.isHatched
                  ? "border-2 border-dashed border-slate-300 bg-slate-100/60"
                  : bar.isPeak
                  ? "bg-brand-500"
                  : "bg-brand-900"
              }`}
            />

            <span className="text-xs font-bold text-ink-subtle">{bar.label}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
};
