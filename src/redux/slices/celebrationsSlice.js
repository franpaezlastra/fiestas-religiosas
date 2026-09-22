import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { celebrationsService } from "../../services";
import localFiestas from "../../data/fiestas.json";
import { shouldFetchPublic } from "../stale";
import { selectFiestasForUi } from "../../utils/celebrationsAdapter";

export const fetchPublicCelebrations = createAsyncThunk(
  "celebrations/fetchPublic",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await celebrationsService.publicList(params);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue({ message: error.message, code: error.code });
    }
  },
  {
    condition: (_, { getState }) => {
      const { status, lastFetchedAt } = getState().celebrations;
      return shouldFetchPublic(status, lastFetchedAt);
    },
  },
);

export const fetchAdminCelebrations = createAsyncThunk(
  "celebrations/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return await celebrationsService.adminList();
    } catch (error) {
      return rejectWithValue({ message: error.message, code: error.code, status: error.status });
    }
  },
);

export const createCelebration = createAsyncThunk(
  "celebrations/create",
  async (body, { rejectWithValue }) => {
    try {
      return await celebrationsService.create(body);
    } catch (error) {
      return rejectWithValue({ message: error.message, code: error.code, details: error.details });
    }
  },
);

export const updateCelebration = createAsyncThunk(
  "celebrations/update",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await celebrationsService.update(id, body);
    } catch (error) {
      return rejectWithValue({ message: error.message, code: error.code, details: error.details });
    }
  },
);

export const archiveCelebration = createAsyncThunk(
  "celebrations/archive",
  async (id, { rejectWithValue }) => {
    try {
      await celebrationsService.archive(id);
      return id;
    } catch (error) {
      return rejectWithValue({ message: error.message, code: error.code });
    }
  },
);

const celebrationsSlice = createSlice({
  name: "celebrations",
  initialState: {
    publicItems: [],
    /** Fallback estático del sitio mientras la API no tenga datos publicados */
    localItems: localFiestas,
    adminItems: [],
    status: "idle",
    lastFetchedAt: null,
    adminStatus: "idle",
    error: null,
    source: "local",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicCelebrations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPublicCelebrations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.lastFetchedAt = Date.now();
        state.publicItems = action.payload;
        state.source = action.payload.length > 0 ? "api" : "local";
      })
      .addCase(fetchPublicCelebrations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Error al cargar fiestas";
        state.source = "local";
      })
      .addCase(fetchAdminCelebrations.pending, (state) => {
        state.adminStatus = "loading";
      })
      .addCase(fetchAdminCelebrations.fulfilled, (state, action) => {
        state.adminStatus = "succeeded";
        state.adminItems = action.payload;
      })
      .addCase(fetchAdminCelebrations.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.error = action.payload?.message;
      })
      .addCase(createCelebration.fulfilled, (state, action) => {
        state.adminItems = [action.payload, ...state.adminItems];
      })
      .addCase(updateCelebration.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.map((item) =>
          item.id === action.payload.id ? action.payload : item,
        );
      })
      .addCase(archiveCelebration.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter((item) => item.id !== action.payload);
      });
  },
});

export default celebrationsSlice.reducer;

/** Fiestas listas para mapa/calendario (API o fallback local) — memoizado */
export const selectCelebrationsState = (state) => state.celebrations;

export const selectFiestasUi = createSelector([selectCelebrationsState], (c) =>
  selectFiestasForUi({
    publicItems: c.publicItems,
    localItems: c.localItems,
    source: c.source,
  }),
);

/** Re-export del adaptador puro (tests / uso sin store) */
export { selectFiestasForUi } from "../../utils/celebrationsAdapter";

