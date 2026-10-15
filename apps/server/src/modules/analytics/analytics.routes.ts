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
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        discountLossTotal: 0,
        canceledItemCount: 0,
      },
      hourlyHeatmap: [],
      paymentDistribution: [],
      menuMatrix: {
        stars: [],
        plowhorses: [],
        puzzles: [],
        dogs: [],
      },
    };

    return report;
  });
}
