import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Quote } from '../../types/quote';

interface QuotesState {
  quotes: Quote[];
  currentQuote: Quote | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const initialState: QuotesState = {
  quotes: [],
  currentQuote: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  totalPages: 0,
};

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    setQuotes: (state, action: PayloadAction<{ quotes: Quote[]; meta: any }>) => {
      state.quotes = action.payload.quotes;
      state.totalCount = action.payload.meta.total;
      state.currentPage = action.payload.meta.page;
      state.totalPages = action.payload.meta.totalPages;
    },
    setCurrentQuote: (state, action: PayloadAction<Quote | null>) => {
      state.currentQuote = action.payload;
    },
    addQuote: (state, action: PayloadAction<Quote>) => {
      state.quotes.unshift(action.payload);
      state.totalCount += 1;
    },
    updateQuote: (state, action: PayloadAction<Quote>) => {
      const index = state.quotes.findIndex(q => q.id === action.payload.id);
      if (index !== -1) {
        state.quotes[index] = action.payload;
      }
      if (state.currentQuote?.id === action.payload.id) {
        state.currentQuote = action.payload;
      }
    },
    removeQuote: (state, action: PayloadAction<number>) => {
      state.quotes = state.quotes.filter(q => q.id !== action.payload);
      state.totalCount -= 1;
      if (state.currentQuote?.id === action.payload) {
        state.currentQuote = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setQuotes,
  setCurrentQuote,
  addQuote,
  updateQuote,
  removeQuote,
  setLoading,
  setError,
  clearError,
} = quotesSlice.actions;

export default quotesSlice.reducer;
