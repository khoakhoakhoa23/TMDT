import axiosClient from "./axiosClient";

const statsApi = {
  getRevenueToday() {
    return axiosClient.get("thongke/doanhthu-homnay/");
  },

  getRevenueByMonth(year, month) {
    return axiosClient.get(`thongke/doanhthu/${year}/${month}/`);
  },

  getTotalCarsSold() {
    return axiosClient.get("thongke/tong-xe-da-ban/");
  },

  getTopSellingCars() {
    return axiosClient.get("thongke/top-xe-ban-chay/");
  },
};

export default statsApi;

