import apiClient from './api';

export const predictSolarML = async (data) => {
  const response = await apiClient.post('/ml/solar/predict', data);
  return response.data;
};

export const predictWindML = async (data) => {
  const response = await apiClient.post('/ml/wind/predict', data);
  return response.data;
};

export const predictSuitabilityML = async (data) => {
  const response = await apiClient.post('/ml/suitability/predict', data);
  return response.data;
};

export const rankSitesML = async (candidateSites) => {
  const response = await apiClient.post('/ml/rank-sites', { candidate_sites: candidateSites });
  return response.data;
};

export const predictEnergyForecastML = async (data) => {
  const response = await apiClient.post('/ml/forecast/predict', data);
  return response.data;
};

export const predictInvestmentML = async (data) => {
  const response = await apiClient.post('/ml/investment/predict', data);
  return response.data;
};

export const recommendTechnologyML = async (data) => {
  const response = await apiClient.post('/ml/technology/recommend', data);
  return response.data;
};
