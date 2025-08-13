import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '../../types/order';

interface OrdersState {
  orders: Order[];
  currentOrder: Order | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  totalPages: 0,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<{ orders: Order[]; meta: any }>) => {
      state.orders = action.payload.orders;
      state.totalCount = action.payload.meta.total;
      state.currentPage = action.payload.meta.page;
      state.totalPages = action.payload.meta.totalPages;
    },
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.unshift(action.payload);
      state.totalCount += 1;
    },
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = action.payload;
      }
    },
    removeOrder: (state, action: PayloadAction<number>) => {
      state.orders = state.orders.filter(o => o.id !== action.payload);
      state.totalCount -= 1;
      if (state.currentOrder?.id === action.payload) {
        state.currentOrder = null;
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
  setOrders,
  setCurrentOrder,
  addOrder,
  updateOrder,
  removeOrder,
  setLoading,
  setError,
  clearError,
} = ordersSlice.actions;

export default ordersSlice.reducer;
