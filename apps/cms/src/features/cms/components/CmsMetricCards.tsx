import React from "react";
import { Panel, Icon } from "@/components/ui";
import { CmsMetric, CmsMetricCardsProps } from "@/types";

export const CmsMetricCards: React.FC<CmsMetricCardsProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        if (metric.isFeatured) {
          return (
            <Panel
              key={metric.id}
              variant="featured"
              padding="lg"
              className="flex flex-col justify-between min-h-[160px] relative overflow-hidden group cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-brand-200">{metric.title}</span>
                <div className="w-8 h-8 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-brand-900 transition-all">
                  <Icon name="arrowUpRight" className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-4xl font-black text-white tracking-tight mb-2">
                  {metric.value}
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-brand-200">
                  <span className="px-1.5 py-0.5 rounded-md bg-white/15 text-white">5%</span>
                  <span>{metric.changeText}</span>
                </div>
              </div>
            </Panel>
          );
        }

        return (
          <Panel
            key={metric.id}
            variant="default"
            padding="lg"
            className="flex flex-col justify-between min-h-[160px] group cursor-pointer hover:border-brand-500/40"
          >
            <div className="flex items-start justify-between">
              <span className="text-xs font-bold text-ink-muted">{metric.title}</span>
              <div className="w-8 h-8 rounded-full border border-surface-border bg-surface-muted flex items-center justify-center text-ink-muted group-hover:bg-brand-900 group-hover:text-white transition-all">
                <Icon name="arrowUpRight" className="w-4 h-4" />
              </div>
            </div>

            <div>
              <h3 className="text-4xl font-black text-ink-primary tracking-tight mb-2">
                {metric.value}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-muted">
                <span className="px-1.5 py-0.5 rounded-md bg-surface-muted text-ink-primary">
                  {metric.id === "paid" ? "6+" : "2"}
                </span>
                <span>{metric.changeText}</span>
              </div>
            </div>
          </Panel>
        );
      })}
    </div>
  );
};
