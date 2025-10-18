import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { analyticsAPI } from '../../services/api';

export interface AnalyticsState {
  summary: any | null;
  trends: { range: string; points: any[] } | null;
  loadingSummary: boolean;
  loadingTrends: boolean;
  error?: string;
  anomalies: any | null;
  loadingAnomalies: boolean;
  anomaliesError?: string;
  forecast: any | null;
  loadingForecast: boolean;
  forecastError?: string;
}

const initialState: AnalyticsState = {
  summary: null,
  trends: null,
  loadingSummary: false,
  loadingTrends: false,
  anomalies: null,
  loadingAnomalies: false,
  forecast: null,
  loadingForecast: false,
};

export const fetchAnalyticsSummary = createAsyncThunk('analytics/fetchSummary', async () => {
  const res = await analyticsAPI.getSummary();
  return res.data;
});

export const fetchAnalyticsTrends = createAsyncThunk('analytics/fetchTrends', async (range: '30d'|'90d'|'365d' = '30d') => {
  const res = await analyticsAPI.getTrends(range);
  return res.data;
});

export const fetchAnalyticsAnomalies = createAsyncThunk(
  'analytics/fetchAnomalies',
  async ({ range, threshold }: { range?: '30d'|'90d'; threshold?: number } = {}) => {
    const res = await analyticsAPI.getAnomalies(range || '30d', threshold);
    return res.data;
  }
);

export const fetchAnalyticsForecast = createAsyncThunk(
  'analytics/fetchForecast',
  async ({ metric, horizon }: { metric?: 'quotesSent'|'quotesAccepted'|'ordersCreated'|'ordersDelivered'|'inventoryNetChange'; horizon?: number } = {}) => {
    const res = await analyticsAPI.getForecast(metric || 'ordersCreated', horizon || 14);
    return res.data;
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsSummary.pending, (state) => {
        state.loadingSummary = true;
        state.error = undefined;
      })
      .addCase(fetchAnalyticsSummary.fulfilled, (state, action) => {
        state.loadingSummary = false;
        state.summary = action.payload;
      })
      .addCase(fetchAnalyticsSummary.rejected, (state, action) => {
        state.loadingSummary = false;
        state.error = action.error.message;
      })
      .addCase(fetchAnalyticsTrends.pending, (state) => {
        state.loadingTrends = true;
        state.error = undefined;
      })
      .addCase(fetchAnalyticsTrends.fulfilled, (state, action) => {
        state.loadingTrends = false;
        state.trends = action.payload;
      })
      .addCase(fetchAnalyticsTrends.rejected, (state, action) => {
        state.loadingTrends = false;
        state.error = action.error.message;
      })
      .addCase(fetchAnalyticsAnomalies.pending, (state) => {
        state.loadingAnomalies = true;
        state.anomaliesError = undefined;
      })
      .addCase(fetchAnalyticsAnomalies.fulfilled, (state, action) => {
        state.loadingAnomalies = false;
        state.anomalies = action.payload;
      })
      .addCase(fetchAnalyticsAnomalies.rejected, (state, action) => {
        state.loadingAnomalies = false;
        state.anomaliesError = action.error.message;
      })
      .addCase(fetchAnalyticsForecast.pending, (state) => {
        state.loadingForecast = true;
        state.forecastError = undefined;
      })
      .addCase(fetchAnalyticsForecast.fulfilled, (state, action) => {
        state.loadingForecast = false;
        state.forecast = action.payload;
      })
      .addCase(fetchAnalyticsForecast.rejected, (state, action) => {
        state.loadingForecast = false;
        state.forecastError = action.error.message;
      });
  }
});

export default analyticsSlice.reducer;
