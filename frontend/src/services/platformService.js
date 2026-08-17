import apiClient from './api';

// ─── Notifications ────────────────────────────────────────────────────────────

export const getNotificationsApi = async (unreadOnly = false) => {
  const endpoint = unreadOnly ? '/notifications/unread' : '/notifications';
  const response = await apiClient.get(endpoint);
  return response.data;
};

export const getUnreadCountApi = async () => {
  const response = await apiClient.get('/notifications/unread-count');
  return response.data;
};

export const markNotificationReadApi = async (notificationId) => {
  const response = await apiClient.put(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsReadApi = async () => {
  const response = await apiClient.put('/notifications/read-all');
  return response.data;
};

export const deleteNotificationApi = async (notificationId) => {
  await apiClient.delete(`/notifications/${notificationId}`);
};


// ─── Reports ─────────────────────────────────────────────────────────────────

export const generateReportApi = async (reportType, siteId, projectId = null) => {
  const payload = { site_id: siteId, project_id: projectId };
  let endpoint = '/reports/feasibility';

  switch (reportType) {
    case 'site-assessment':
    case 'SITE_ASSESSMENT':
      endpoint = '/reports/site-assessment';
      break;
    case 'solar':
    case 'SOLAR_POTENTIAL':
      endpoint = '/reports/solar';
      break;
    case 'wind':
    case 'WIND_POTENTIAL':
      endpoint = '/reports/wind';
      break;
    case 'feasibility':
    case 'FEASIBILITY':
    case 'FULL_FEASIBILITY':
      endpoint = '/reports/feasibility';
      break;
    case 'investment':
    case 'INVESTMENT':
      endpoint = '/reports/investment';
      break;
    default:
      endpoint = '/reports/feasibility';
  }

  const response = await apiClient.post(endpoint, payload);
  return response.data;
};

export const generateSiteReportApi = async (siteId, reportType = 'FULL_FEASIBILITY') => {
  return generateReportApi(reportType, siteId);
};


export const getAllReportsApi = async (limit = 50, offset = 0) => {
  const response = await apiClient.get('/reports', { params: { limit, offset } });
  return response.data;
};

export const getReportDetailApi = async (reportId) => {
  const response = await apiClient.get(`/reports/${reportId}`);
  return response.data;
};

export const downloadReportFileApi = async (reportId, format = 'pdf') => {
  const response = await apiClient.get(`/reports/${reportId}/download`, {
    params: { format },
    responseType: 'blob',
  });
  return response;
};

export const deleteReportApi = async (reportId) => {
  await apiClient.delete(`/reports/${reportId}`);
};

// ─── Site Comparison ──────────────────────────────────────────────────────────

export const compareSitesDirectApi = async (siteIds) => {
  const response = await apiClient.post('/sites/compare', { site_ids: siteIds });
  return response.data;
};

export const createComparisonApi = async (comparisonName, siteIds, description = null) => {
  const response = await apiClient.post('/comparisons', {
    comparison_name: comparisonName,
    site_ids: siteIds,
    description,
  });
  return response.data;
};

export const listComparisonsApi = async () => {
  const response = await apiClient.get('/comparisons');
  return response.data;
};

export const getComparisonDetailApi = async (comparisonId) => {
  const response = await apiClient.get(`/comparisons/${comparisonId}`);
  return response.data;
};

export const deleteComparisonApi = async (comparisonId) => {
  await apiClient.delete(`/comparisons/${comparisonId}`);
};

