import apiClient from './api';

export const getDashboardAnalyticsApi = async () => {
  const response = await apiClient.get('/analytics/dashboard');
  return response.data;
};

export const getGisLayersAnalyticsApi = async () => {
  const response = await apiClient.get('/analytics/gis-layers');
  return response.data;
};
