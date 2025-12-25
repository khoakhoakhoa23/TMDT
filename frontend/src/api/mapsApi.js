import axiosClient from "./axiosClient";

/**
 * Maps API - Sử dụng backend proxy để tránh CORS
 * Backend sẽ gọi OpenRouteService API
 */

/**
 * Geocoding: Convert địa chỉ thành tọa độ (lat, lng)
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<{lat: number, lng: number, formatted: string}>}
 */
export const geocodeAddress = async (address) => {
  try {
    const response = await axiosClient.post("maps/geocode/", {
      address: address,
    });
    
    if (response.data) {
      return {
        lat: response.data.lat,
        lng: response.data.lng,
        formatted: response.data.formatted || address,
      };
    }
    
    throw new Error("Không tìm thấy địa chỉ");
  } catch (error) {
    console.error("Geocoding error:", error);
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

/**
 * Tính khoảng cách và thời gian giữa 2 điểm
 * @param {number} lat1 - Latitude điểm 1
 * @param {number} lng1 - Longitude điểm 1
 * @param {number} lat2 - Latitude điểm 2
 * @param {number} lng2 - Longitude điểm 2
 * @returns {Promise<{distance: number, duration: number}>}
 * distance: km, duration: giây
 */
export const calculateDistance = async (lat1, lng1, lat2, lng2) => {
  try {
    const response = await axiosClient.post("maps/distance/", {
      lat1,
      lng1,
      lat2,
      lng2,
    });
    
    if (response.data) {
      return {
        distance: response.data.distance,
        duration: response.data.duration,
        geometry: response.data.geometry, // Để vẽ route trên map
      };
    }
    
    throw new Error("Không thể tính khoảng cách");
  } catch (error) {
    console.error("Distance calculation error:", error);
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

/**
 * Tính khoảng cách từ địa chỉ (string) giữa 2 điểm
 * @param {string} address1 - Địa chỉ điểm 1
 * @param {string} address2 - Địa chỉ điểm 2
 * @returns {Promise<{distance: number, duration: number, coords1: {lat, lng}, coords2: {lat, lng}}>}
 */
export const calculateDistanceFromAddresses = async (address1, address2) => {
  try {
    const response = await axiosClient.post("maps/distance-from-addresses/", {
      address1,
      address2,
    });
    
    if (response.data) {
      return {
        distance: response.data.distance,
        duration: response.data.duration,
        geometry: response.data.geometry,
        coords1: response.data.coords1,
        coords2: response.data.coords2,
        address1: response.data.address1,
        address2: response.data.address2,
      };
    }
    
    throw new Error("Không thể tính khoảng cách");
  } catch (error) {
    console.error("Distance from addresses error:", error);
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw error;
  }
};

const mapsApi = {
  geocodeAddress,
  calculateDistance,
  calculateDistanceFromAddresses,
};

export default mapsApi;

