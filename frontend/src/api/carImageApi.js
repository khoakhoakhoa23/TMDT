import axiosClient from "./axiosClient";

const carImageApi = {
  getAll(params) {
    return axiosClient.get("car-image/", { params });
  },

  getById(id) {
    return axiosClient.get(`car-image/${id}/`);
  },

  getByCarId(carId) {
    return axiosClient.get("car-image/", { params: { xe_id: carId } });
  },

  create(data) {
    const formData = new FormData();
    formData.append("xe", data.xe);
    formData.append("image", data.image);
    if (data.is_primary) formData.append("is_primary", data.is_primary);
    if (data.order) formData.append("order", data.order);
    
    return axiosClient.post("car-image/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  bulkUpload(carId, images) {
    const formData = new FormData();
    formData.append("xe_id", carId);
    images.forEach((image) => {
      formData.append("images", image);
    });
    
    return axiosClient.post("car-image/bulk-upload/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update(id, data) {
    const formData = new FormData();
    if (data.image) formData.append("image", data.image);
    if (data.is_primary !== undefined) formData.append("is_primary", data.is_primary);
    if (data.order !== undefined) formData.append("order", data.order);
    
    return axiosClient.patch(`car-image/${id}/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete(id) {
    return axiosClient.delete(`car-image/${id}/`);
  },

  setPrimary(id) {
    return axiosClient.post(`car-image/${id}/set-primary/`);
  },
};

export default carImageApi;

