import React, { Component, ErrorInfo, ReactNode } from "react";
import { Icon } from "./Icon";
import { Button } from "./Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in component tree:", error, errorInfo);
  }

  private handleReset = () => {
    sessionStorage.removeItem("chunk_load_failed_reload");
    sessionStorage.removeItem("dynamic_import_reload");
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-4 shadow-sm">
            <Icon name="refresh" className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-ink-primary mb-1">
            Giao diện đang được cập nhật
          </h3>
          <p className="text-xs text-ink-muted max-w-md mb-5 leading-relaxed">
            Hệ thống vừa cập nhật phiên bản mới hoặc kết nối tạm thời bị gián đoạn.
            Vui lòng nhấn nút bên dưới để làm mới trang.
          </p>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="rounded-xl px-4 py-2 text-xs font-bold bg-brand-900 text-white hover:bg-brand-950 shadow-sm"
              onClick={this.handleReset}
            >
              <Icon name="refresh" className="w-3.5 h-3.5 mr-1.5" />
              Tải lại trang (F5)
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
