import apiClient from './api';

export const getUsersApi = async () => {
  const response = await apiClient.get('/admin/users');
  return response.data;
};

export const updateUserRoleApi = async (userId, roleId) => {
  const response = await apiClient.patch(`/admin/users/${userId}/role`, { role_id: roleId });
  return response.data;
};

export const toggleUserStatusApi = async (userId, isActive) => {
  const response = await apiClient.patch(`/admin/users/${userId}/status`, { is_active: isActive });
  return response.data;
};

export const getAuditLogsApi = async () => {
  const response = await apiClient.get('/admin/audit-logs');
  return response.data;
};

export const getSystemStatsApi = async () => {
  const response = await apiClient.get('/admin/system-stats');
  return response.data;
};
