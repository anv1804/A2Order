import { FastifyInstance } from "fastify";
import { DeepAnalyticsReport, MenuCategoryType } from "@a2order/shared";

export async function analyticsRoutes(fastify: FastifyInstance) {
  /**
   * BÁO CÁO PHÂN TÍCH DOANH SỐ ĐA CHIỀU CHUYÊN SÂU F&B
   * - Phân tích giờ vàng (Rush-hour Heatmap)
   * - Ma trận kỹ thuật menu (Stars, Plowhorses, Puzzles, Dogs)
   * - Phân bổ tiền mặt vs VietQR
   * - Chỉ số AOV, thất thoát chiết khấu
   */
  fastify.get("/:storeId/deep-reports", async (request, reply) => {
    const { storeId } = request.params as { storeId: string };
    const { period } = request.query as { period?: "today" | "week" | "month" };

    const selectedPeriod = period || "today";

    const report: DeepAnalyticsReport = {
      period: selectedPeriod,
      summary: {
        totalRevenue: 14850000,
        totalOrders: 112,
        averageOrderValue: 132589, // AOV
        discountLossTotal: 450000,
        canceledItemCount: 3,
      },
      // 1. Hourly Heatmap (Giờ vàng cao điểm)
      hourlyHeatmap: [
        { hourLabel: "06:00 - 08:00", revenue: 1850000, orderCount: 22, isPeak: false },
        { hourLabel: "08:00 - 11:00", revenue: 2400000, orderCount: 18, isPeak: false },
        { hourLabel: "11:00 - 13:30", revenue: 5600000, orderCount: 42, isPeak: true }, // Đỉnh trưa
        { hourLabel: "13:30 - 17:30", revenue: 1200000, orderCount: 9, isPeak: false },
        { hourLabel: "17:30 - 21:00", revenue: 3800000, orderCount: 21, isPeak: true }, // Đỉnh tối
      ],
      // 2. Cơ cấu thanh toán
      paymentDistribution: [
        { method: "VIETQR", label: "Chuyển khoản VietQR", totalAmount: 10400000, transactionCount: 78, percentage: 70 },
        { method: "CASH", label: "Tiền mặt tại quầy", totalAmount: 3950000, transactionCount: 30, percentage: 26.6 },
        { method: "CARD", label: "Thẻ POS ngân hàng", totalAmount: 500000, transactionCount: 4, percentage: 3.4 },
      ],
      // 3. Ma trận kỹ thuật Menu (Menu Engineering)
      menuMatrix: {
        stars: [
          {
            id: "m1",
            name: "Phở Bò Tái Nạm",
            price: 65000,
            costPrice: 26000,
            marginPercent: 60,
            totalSold: 64,
            revenue: 4160000,
            categoryType: MenuCategoryType.STARS,
            advice: "Món đinh mang lại doanh số & lợi nhuận cao nhất. Duy trì chất lượng chuẩn vị.",
          },
          {
            id: "m2",
            name: "Bún Chả Hà Nội Đặc Biệt",
            price: 60000,
            costPrice: 22000,
            marginPercent: 63,
            totalSold: 45,
            revenue: 2700000,
            categoryType: MenuCategoryType.STARS,
            advice: "Bán rất chạy vào buổi trưa. Tiếp tục giữ vị trí nổi bật trên thực đơn.",
          },
        ],
        plowhorses: [
          {
            id: "m3",
            name: "Bò Tái Thăn",
            price: 55000,
            costPrice: 38000,
            marginPercent: 30,
            totalSold: 38,
            revenue: 2090000,
            categoryType: MenuCategoryType.PLOWHORSES,
            advice: "Bán chạy nhưng biên lãi thấp do giá thịt thăn cao. Đề xuất tăng giá lên 60k hoặc tinh chỉnh định lượng.",
          },
        ],
        puzzles: [
          {
            id: "m4",
            name: "Lẩu Đuôi Bò Nồi Đất",
            price: 350000,
            costPrice: 120000,
            marginPercent: 65,
            totalSold: 4,
            revenue: 1400000,
            categoryType: MenuCategoryType.PUZZLES,
            advice: "Biên lợi nhuận cực cao (65%) nhưng ít khách gọi. Cần nhân viên tư vấn cho nhóm đông hoặc thêm ảnh banner.",
          },
        ],
        dogs: [
          {
            id: "m5",
            name: "Bún Bò Giò Heo",
            price: 60000,
            costPrice: 39000,
            marginPercent: 35,
            totalSold: 3,
            revenue: 180000,
            categoryType: MenuCategoryType.DOGS,
            advice: "Biên lãi thấp và rất ít người gọi. Dễ tồn đọng giò heo, nên cân nhắc bỏ khỏi thực đơn để tối ưu kho.",
          },
        ],
      },
    };

    return report;
  });
}
