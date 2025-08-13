import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '../../types/project';

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
