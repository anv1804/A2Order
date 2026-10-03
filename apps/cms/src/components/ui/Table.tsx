import React from "react";
import { twMerge } from "tailwind-merge";
import { Icon, IconName } from "./Icon";

export const TableContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div
    className={twMerge(
      "w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs",
      className
    )}
    {...props}
  >
    <div className="overflow-x-auto no-scrollbar">{children}</div>
  </div>
);

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  ...props
}) => (
  <table
    className={twMerge("w-full text-left text-xs border-collapse", className)}
    {...props}
  />
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <thead
    className={twMerge(
      "bg-slate-50/80 border-b border-slate-200/90 text-[10.5px] font-black uppercase tracking-wider text-slate-500 select-none",
      className
    )}
    {...props}
  />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  ...props
}) => (
  <tbody
    className={twMerge("divide-y divide-slate-100 font-medium text-slate-900", className)}
    {...props}
  />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  ...props
}) => (
  <tr
    className={twMerge("hover:bg-emerald-50/30 transition-colors", className)}
    {...props}
  />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <th
    className={twMerge(
      "py-3 px-3.5 sm:px-4 text-[10.5px] font-black text-slate-600 tracking-wider whitespace-nowrap align-middle",
      className
    )}
    {...props}
  />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  ...props
}) => (
  <td
    className={twMerge("py-3 px-3.5 sm:px-4 align-middle text-xs", className)}
    {...props}
  />
);

export interface TableEmptyProps {
  colSpan: number;
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan,
  icon = "clipboard",
  title,
  description,
  action,
}) => (
  <tr>
    <td colSpan={colSpan} className="py-12 sm:py-16 text-center">
      <div className="flex flex-col items-center justify-center space-y-2 max-w-sm mx-auto px-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs mb-1">
          <Icon name={icon} size={22} />
        </div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        {description && (
          <p className="text-xs text-slate-500 font-medium leading-relaxed">{description}</p>
        )}
        {action && <div className="pt-2">{action}</div>}
      </div>
    </td>
  </tr>
);
