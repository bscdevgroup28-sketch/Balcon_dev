import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../../types/project';
import integratedAPI from '../../services/integratedAPI';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  totalPages: 0,
};

// Async thunks for fetching projects
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async (params?: { status?: string; search?: string; limit?: number; offset?: number }) => {
    const response = await integratedAPI.getProjects(params);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch projects');
    }
    return response.data;
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchProjectById',
  async (id: string) => {
    const response = await integratedAPI.getProject(id);
    if (!response.success) {
      throw new Error(response.error || 'Failed to fetch project');
    }
    return response.data;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<{ projects: Project[]; meta: any }>) => {
      state.projects = action.payload.projects;
      state.totalCount = action.payload.meta.total;
      state.currentPage = action.payload.meta.page;
      state.totalPages = action.payload.meta.totalPages;
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload;
    },
    addProject: (state, action: PayloadAction<Project>) => {
      state.projects.unshift(action.payload);
      state.totalCount += 1;
    },
    updateProject: (state, action: PayloadAction<Project>) => {
      const index = state.projects.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = action.payload;
      }
      if (state.currentProject?.id === action.payload.id) {
        state.currentProject = action.payload;
      }
    },
    removeProject: (state, action: PayloadAction<number>) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
      state.totalCount -= 1;
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
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
      // fetchProjects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload?.projects || [];
        state.totalCount = action.payload?.total || 0;
        // Calculate pagination if provided (some endpoints don't have pagination)
        const meta = (action.payload as any)?.meta;
        if (meta) {
          state.currentPage = meta.page || 1;
          state.totalPages = meta.totalPages || 1;
        }
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })
      // fetchProjectById
      .addCase(fetchProjectById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch project';
      });
  },
});

export const {
  setProjects,
  setCurrentProject,
  addProject,
  updateProject,
  removeProject,
  setLoading,
  setError,
  clearError,
} = projectsSlice.actions;

export default projectsSlice.reducer;
