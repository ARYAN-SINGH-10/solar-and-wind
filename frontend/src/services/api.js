import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('solar_wind_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 Unauthorized errors and auto-clear token
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('solar_wind_token');
    }
    return Promise.reject(error);
  }
);

export const checkSystemHealth = async () => {
  const response = await apiClient.get('/health');
  return response.data;
};

export const fetchProjects = async () => {
  const response = await apiClient.get('/projects');
  return response.data.items || response.data;
};

export const fetchSites = async () => {
  const response = await apiClient.get('/sites');
  return response.data.items || response.data;
};

export const fetchAdminUsers = async (search = '', roleId = null) => {
  const params = {};
  if (search) params.search = search;
  if (roleId) params.role_id = roleId;
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

export const updateUserRoleApi = async (userId, roleId) => {
  const response = await apiClient.put(`/admin/users/${userId}/role`, { role_id: roleId });
  return response.data;
};

export const toggleUserStatusApi = async (userId, isActive) => {
  const response = await apiClient.patch(`/admin/users/${userId}/status`, { is_active: isActive });
  return response.data;
};

export const deleteUserAccountApi = async (userId) => {
  await apiClient.delete(`/admin/users/${userId}`);
};

export const fetchAdminDataSourcesApi = async () => {
  const response = await apiClient.get('/admin/data-sources');
  return response.data;
};

export const toggleDataSourceStatusApi = async (sourceId, isActive) => {
  const response = await apiClient.patch(`/admin/data-sources/${sourceId}/status`, { is_active: isActive });
  return response.data;
};

export const fetchAuditLogsApi = async (action = '') => {
  const params = action ? { action } : {};
  const response = await apiClient.get('/admin/audit-logs', { params });
  return response.data;
};

export const fetchSystemStatsApi = async () => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

export const fetchAdminSystemHealthApi = async () => {
  const response = await apiClient.get('/admin/system-health');
  return response.data;
};

export default apiClient;



