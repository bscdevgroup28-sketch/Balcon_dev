import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import integratedAPI from '../../services/integratedAPI';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface UsersState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  totalCount: 0,
};

// Async thunks for fetching users
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params?: { role?: string; search?: string; limit?: number; offset?: number }) => {
    const response = await integratedAPI.getUsers(params);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch users');
    }
    return response.data;
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (id: string) => {
    const response = await integratedAPI.getUser(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch user');
    }
    return response.data;
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    addUser: (state, action: PayloadAction<User>) => {
      state.users.unshift(action.payload);
      state.totalCount += 1;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      if (state.currentUser?.id === action.payload.id) {
        state.currentUser = action.payload;
      }
    },
    removeUser: (state, action: PayloadAction<number>) => {
      state.users = state.users.filter(u => u.id !== action.payload);
      state.totalCount -= 1;
      if (state.currentUser?.id === action.payload) {
        state.currentUser = null;
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
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload;
        // Handle both array response and { users, total } response
        if (Array.isArray(data)) {
          state.users = data;
          state.totalCount = data.length;
        } else {
          state.users = data?.users || [];
          state.totalCount = data?.total || 0;
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch users';
      })
      // fetchUserById
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch user';
      });
  },
});

export const {
  setUsers,
  setCurrentUser,
  addUser,
  updateUser,
  removeUser,
  setLoading,
  setError,
  clearError,
} = usersSlice.actions;

export default usersSlice.reducer;
