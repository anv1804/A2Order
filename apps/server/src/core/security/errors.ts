import { ZodError } from "zod";

export class AppError extends Error {
  constructor(public statusCode: number, message: string, public code = "REQUEST_FAILED") {
    super(message);
  }
}

export function requireValue<T>(value: T | null | undefined, message = "Không tìm thấy dữ liệu"): T {
  if (value === null || value === undefined) throw new AppError(404, message, "NOT_FOUND");
  return value;
}

export function safeError(error: unknown) {
  if (error instanceof AppError) return { status: error.statusCode, code: error.code, message: error.message };
  if (error instanceof ZodError) return { status: 400, code: "INVALID_INPUT", message: error.issues[0]?.message || "Dữ liệu không hợp lệ" };
  const code = (error as { code?: string })?.code;
  if (code === "P2002") return { status: 409, code: "CONFLICT", message: "Dữ liệu đã tồn tại hoặc đã được xử lý" };
  if (code === "P2025") return { status: 404, code: "NOT_FOUND", message: "Không tìm thấy dữ liệu" };
  if (code === "P2003") return { status: 409, code: "IN_USE", message: "Dữ liệu đang được sử dụng, không thể xóa" };
  const status = (error as { statusCode?: number })?.statusCode;
  if (status && status >= 400 && status < 500) return { status, code: "INVALID_REQUEST", message: status === 413 ? "Dữ liệu vượt giới hạn" : "Yêu cầu không hợp lệ" };
  return { status: 500, code: "INTERNAL_ERROR", message: "Không thể hoàn tất yêu cầu. Vui lòng thử lại." };
}
