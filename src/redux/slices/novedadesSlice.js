import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminNovedadesService, novedadesService } from "../../services";
import { shouldFetchPublic } from "../stale";

/** Novedades del libro: presentaciones, muestras y prensa. */

const reject = (error) => ({ message: error.message, code: error.code, details: error.details });

export const fetchNovedades = createAsyncThunk(
  "novedades/fetchPublic",
  async (_, { rejectWithValue }) => {
    try {
      const data = await novedadesService.list();
      return Array.isArray(data) ? data : data?.items || [];
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { status, lastFetchedAt } = getState().novedades;
      return shouldFetchPublic(status, lastFetchedAt);
    },
  },
);

export const fetchNovedad = createAsyncThunk("novedades/fetchOne", async (slug, { rejectWithValue }) => {
  try {
    return await novedadesService.get(slug);
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const fetchAdminNovedades = createAsyncThunk("novedades/fetchAdmin", async (_, { rejectWithValue }) => {
  try {
    const data = await adminNovedadesService.list();
    return Array.isArray(data) ? data : data?.items || [];
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const createNovedad = createAsyncThunk("novedades/create", async (body, { rejectWithValue }) => {
  try {
    return await adminNovedadesService.create(body);
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const updateNovedad = createAsyncThunk("novedades/update", async ({ id, body }, { rejectWithValue }) => {
  try {
    return await adminNovedadesService.update(id, body);
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const archiveNovedad = createAsyncThunk("novedades/archive", async (id, { rejectWithValue }) => {
  try {
    await adminNovedadesService.archive(id);
    return id;
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

/** Lo que se edita en el admin se ve enseguida en el sitio. */
function invalidarPublico(state) {
  state.lastFetchedAt = null;
  state.bySlug = {};
}

const novedadesSlice = createSlice({
  name: "novedades",
  initialState: {
    publicItems: [],
    status: "idle",
    error: null,
    lastFetchedAt: null,
    bySlug: {},
    adminItems: [],
    adminStatus: "idle",
    adminError: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNovedades.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchNovedades.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.publicItems = action.payload;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchNovedades.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "No pudimos cargar las novedades.";
      })
      .addCase(fetchNovedad.pending, (state, action) => {
        const actual = state.bySlug[action.meta.arg];
        state.bySlug[action.meta.arg] = { item: actual?.item || null, status: "loading", error: null };
      })
      .addCase(fetchNovedad.fulfilled, (state, action) => {
        state.bySlug[action.meta.arg] = { item: action.payload, status: "succeeded", error: null };
      })
      .addCase(fetchNovedad.rejected, (state, action) => {
        state.bySlug[action.meta.arg] = { item: null, status: "failed", error: action.payload };
      })
      .addCase(fetchAdminNovedades.pending, (state) => {
        state.adminStatus = "loading";
        state.adminError = null;
      })
      .addCase(fetchAdminNovedades.fulfilled, (state, action) => {
        state.adminStatus = "succeeded";
        state.adminItems = action.payload;
      })
      .addCase(fetchAdminNovedades.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.adminError = action.payload?.message || "No pudimos cargar las novedades.";
      })
      .addCase(createNovedad.fulfilled, (state, action) => {
        state.adminItems.unshift(action.payload);
        invalidarPublico(state);
      })
      .addCase(updateNovedad.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.map((n) => (n.id === action.payload.id ? action.payload : n));
        invalidarPublico(state);
      })
      .addCase(archiveNovedad.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter((n) => n.id !== action.payload);
        invalidarPublico(state);
      });
  },
});

export default novedadesSlice.reducer;
