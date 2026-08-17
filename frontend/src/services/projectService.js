import apiClient from './api';

export const getProjectsApi = async (params = {}) => {
  const response = await apiClient.get('/projects', { params });
  return response.data;
};

export const getProjectStatsApi = async () => {
  const response = await apiClient.get('/projects/stats');
  return response.data;
};

export const getProjectByIdApi = async (id) => {
  const response = await apiClient.get(`/projects/${id}`);
  return response.data;
};

export const createProjectApi = async (projectData) => {
  const response = await apiClient.post('/projects', projectData);
  return response.data;
};

export const updateProjectApi = async (id, projectData) => {
  const response = await apiClient.put(`/projects/${id}`, projectData);
  return response.data;
};

export const deleteProjectApi = async (id) => {
  const response = await apiClient.delete(`/projects/${id}`);
  return response.data;
};
