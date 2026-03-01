import axiosClient from "./axiosClient";

const statsApi = {
  getRevenueToday() {
    return axiosClient.get("thongke/doanhthu-homnay/");
  },

  getRevenueByMonth(year: number | string, month: number | string) {
    return axiosClient.get(`thongke/doanhthu/${year}/${month}/`);
  },

  getTotalCarsSold() {
    return axiosClient.get("thongke/tong-xe-da-ban/");
  },

  getTopSellingCars() {
    return axiosClient.get("thongke/top-xe-ban-chay/");
  },

  getCouponAnalytics() {
    return axiosClient.get("thongke/coupon-analytics/");
  },

  getCouponUsageOverTime() {
    return axiosClient.get("thongke/coupon-usage-over-time/");
  },

  getCouponPerformance() {
    return axiosClient.get("thongke/coupon-performance/");
  },
};

export default statsApi;

