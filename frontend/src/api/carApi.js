import axiosClient from "./axiosClient";

const carApi = {
  getAll(params) {
    return axiosClient.get("xe/", { params });
  },

  getById(id) {
    return axiosClient.get(`xe/${id}/`);
  },

  getCategories() {
    return axiosClient.get("loaixe/");
  },

  search(query) {
    return axiosClient.get("xe/", { params: { search: query } });
  },

  create(data) {
    // Sử dụng FormData nếu có file upload
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'image_file' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else if (typeof data[key] === 'boolean') {
          // Xử lý boolean values
          formData.append(key, data[key] ? 'true' : 'false');
        } else if (typeof data[key] === 'number') {
          // Xử lý number values - chuyển thành string
          formData.append(key, data[key].toString());
        } else if (data[key] !== '') {
          // Chỉ append nếu không phải string rỗng
          formData.append(key, data[key]);
        }
      }
    });
    
    // Debug: log FormData contents
    console.log("FormData contents:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }
    
    return axiosClient.post("xe/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update(id, data) {
    // Sử dụng FormData nếu có file upload
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        if (key === 'image_file' && data[key] instanceof File) {
          formData.append(key, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      }
    });
    return axiosClient.put(`xe/${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete(id) {
    return axiosClient.delete(`xe/${id}/`);
  },

  // Loại xe APIs
  getAllCarTypes() {
    return axiosClient.get("loaixe/");
  },

  getCarTypeById(id) {
    return axiosClient.get(`loaixe/${id}/`);
  },

  createCarType(data) {
    return axiosClient.post("loaixe/", data);
  },

  updateCarType(id, data) {
    return axiosClient.put(`loaixe/${id}/`, data);
  },

  deleteCarType(id) {
    return axiosClient.delete(`loaixe/${id}/`);
  },
};

export default carApi;

