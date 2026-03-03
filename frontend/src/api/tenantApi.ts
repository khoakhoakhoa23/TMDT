import axiosClient from "./axiosClient";

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at?: string;
}

const tenantApi = {
  getAll() {
    return axiosClient.get("tenants/");
  },

  getById(id: number) {
    return axiosClient.get(`tenants/${id}/`);
  },

  create(data: Partial<Tenant>) {
    return axiosClient.post("tenants/", data);
  },

  update(id: number, data: Partial<Tenant>) {
    return axiosClient.put(`tenants/${id}/`, data);
  },

  delete(id: number) {
    return axiosClient.delete(`tenants/${id}/`);
  },
};

export default tenantApi;
