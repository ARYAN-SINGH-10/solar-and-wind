import apiClient from './api';

// Deterministic Solar Calculation (Client side preview)
export const calculateSolarYield = (areaSqM, effPct, ghi, pr = 0.82) => {
  const effDecimal = effPct / 100.0;
  const annualKwh = areaSqM * effDecimal * ghi * pr;
  const annualMwh = annualKwh / 1000.0;
  const capacityFactor = (annualKwh / (areaSqM * effDecimal * 8760)) * 100;
  return {
    annualKwh: Math.round(annualKwh * 100) / 100,
    annualMwh: Math.round(annualMwh * 100) / 100,
    capacityFactorPct: Math.min(100, Math.round(capacityFactor * 100) / 100),
    performanceRatio: pr,
    peakSunHours: Math.round((ghi / 365.0) * 100) / 100,
  };
};

// Deterministic Wind Power Density Calculation (Client side preview)
export const calculateWindDensity = (speedMS, elevationM = 100, tempC = 15) => {
  const P0 = 101325.0;
  const R = 287.05;
  const g = 9.80665;
  const T = tempC + 273.15;
  const rho = (P0 / (R * T)) * Math.exp(- (g * elevationM) / (R * T));
  const wpd = 0.5 * rho * Math.pow(speedMS, 3);
  let windClass = 'Class I (Low / Unsuitable)';
  if (wpd >= 800) windClass = 'Class V (Outstanding)';
  else if (wpd >= 600) windClass = 'Class IV (Excellent)';
  else if (wpd >= 400) windClass = 'Class III (Good)';
  else if (wpd >= 200) windClass = 'Class II (Moderate)';

  return {
    airDensityKgM3: Math.round(rho * 10000) / 10000,
    wpdW2: Math.round(wpd * 100) / 100,
    windClass,
    capacityFactorPct: Math.min(55, Math.round((speedMS / 14.0) * 45 * 100) / 100),
  };
};

// Deterministic Weighted Site Scoring
export const calculateDeterministicScore = (res, geo, infra, env, econ) => {
  const score = (res * 0.35) + (geo * 0.25) + (infra * 0.15) + (env * 0.15) + (econ * 0.10);
  const roundedScore = Math.round(score * 100) / 100;
  let category = 'Unsuitable';
  if (roundedScore >= 90) category = 'Excellent';
  else if (roundedScore >= 80) category = 'Highly Suitable';
  else if (roundedScore >= 65) category = 'Moderately Suitable';
  else if (roundedScore >= 50) category = 'Low Suitability';

  return {
    resourceScore: res,
    geographicScore: geo,
    infrastructureScore: infra,
    environmentalScore: env,
    economicScore: econ,
    overallScore: roundedScore,
    category,
    weights: { resource: 0.35, geographic: 0.25, infrastructure: 0.15, environmental: 0.15, economic: 0.10 }
  };
};

// Data Collection APIs
export const checkDataSourcesHealthApi = async () => {
  const response = await apiClient.get('/data-sources/health');
  return response.data;
};

export const fetchSiteEnvDataApi = async (siteId) => {
  const response = await apiClient.post(`/sites/${siteId}/environmental-data/fetch`);
  return response.data;
};

export const getSiteEnvDataApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/environmental-data`);
  return response.data;
};

export const submitManualEnvDataApi = async (siteId, manualData) => {
  const response = await apiClient.post(`/sites/${siteId}/environmental-data/manual`, manualData);
  return response.data;
};

export const analyzeSiteGisDataApi = async (siteId) => {
  const response = await apiClient.post(`/sites/${siteId}/gis-data/analyze`);
  return response.data;
};

export const getSiteGisDataApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/gis-data`);
  return response.data;
};

export const getSiteInfraDataApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/infrastructure`);
  return response.data;
};

// Solar & Wind Analysis Engine APIs
export const runSolarAnalysisApi = async (siteId, payload = {}) => {
  const response = await apiClient.post(`/sites/${siteId}/solar/analyze`, payload);
  return response.data;
};

export const getSolarAssessmentsApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/solar`);
  return response.data;
};

export const runWindAnalysisApi = async (siteId, payload = {}) => {
  const response = await apiClient.post(`/sites/${siteId}/wind/analyze`, payload);
  return response.data;
};

export const getWindAssessmentsApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/wind`);
  return response.data;
};

// Site Suitability & Scoring Engine APIs
export const calculateSiteSuitabilityApi = async (siteId) => {
  const response = await apiClient.post(`/sites/${siteId}/suitability/calculate`);
  return response.data;
};

export const getSiteSuitabilityApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/suitability`);
  return response.data;
};

export const calculateSiteScoreApi = async (siteId, payload) => {
  const response = await apiClient.post(`/sites/${siteId}/score/calculate`, payload);
  return response.data;
};

export const getSiteScoreApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/score`);
  return response.data;
};

// Energy Forecasting Engine APIs
export const calculateEnergyForecastApi = async (siteId, payload) => {
  const response = await apiClient.post(`/sites/${siteId}/forecast/calculate`, payload);
  return response.data;
};

export const getEnergyForecastApi = async (siteId, params = {}) => {
  const response = await apiClient.get(`/sites/${siteId}/forecast`, { params });
  return response.data;
};

export const getMonthlyForecastApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/forecast/monthly`);
  return response.data;
};

export const getAnnualForecastApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/forecast/annual`);
  return response.data;
};

// Deployment Optimization & Recommendation Engine APIs
export const runOptimizationApi = async (siteId) => {
  const response = await apiClient.post(`/sites/${siteId}/optimization/run`);
  return response.data;
};

export const getOptimizationApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/optimization`);
  return response.data;
};

export const generateRecommendationApi = async (siteId) => {
  const response = await apiClient.post(`/sites/${siteId}/recommendation/generate`);
  return response.data;
};

export const getRecommendationApi = async (siteId) => {
  const response = await apiClient.get(`/sites/${siteId}/recommendation`);
  return response.data;
};
