import apiClient from './api';

export const getSitesApi = async (params = {}) => {
  const queryParams = typeof params === 'string' ? { project_id: params } : params;
  const response = await apiClient.get('/sites', { params: queryParams });
  return response.data;
};

export const getSiteByIdApi = async (id) => {
  const response = await apiClient.get(`/sites/${id}`);
  return response.data;
};

export const createSiteApi = async (siteData) => {
  if (siteData.project_id) {
    const response = await apiClient.post(`/projects/${siteData.project_id}/sites`, siteData);
    return response.data;
  }
  const response = await apiClient.post('/sites', siteData);
  return response.data;
};

export const updateSiteApi = async (id, siteData) => {
  const response = await apiClient.put(`/sites/${id}`, siteData);
  return response.data;
};

export const deleteSiteApi = async (id) => {
  const response = await apiClient.delete(`/sites/${id}`);
  return response.data;
};

export const getSiteGisDataApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/gis-data`);
  return response.data;
};

