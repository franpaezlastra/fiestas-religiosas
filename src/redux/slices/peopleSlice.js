import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { peopleService } from "../../services";
import { shouldFetchPublic } from "../stale";

/**
 * GET /public/people/holiness — único endpoint para /santos.
 * Requiere canonizationStage en cada persona (Stefan).
 * Destacados culturales van a /people/featured, no acá.
 */
export const fetchPublicPeople = createAsyncThunk(
  "people/fetchPublic",
  async (params = {}, { rejectWithValue }) => {
    try {
      const holiness = await peopleService.publicHoliness(params);
      const data = (Array.isArray(holiness) ? holiness : []).filter((p) => {
        if (p?.isFeatured && !p?.canonizationStage) return false;
        return Boolean(p?.canonizationStage);
      });
      return { items: data, fromHoliness: true };
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
  {
    condition: (_, { getState }) => {
      const { status, lastFetchedAt } = getState().people;
      return shouldFetchPublic(status, lastFetchedAt);
    },
  },
);

/**
 * GET /public/people/featured — isFeatured true.
 * Si el endpoint falla, filtra el listado general.
 */
export const fetchPublicFeatured = createAsyncThunk(
  "people/fetchFeatured",
  async (params = {}, { rejectWithValue }) => {
    try {
      try {
        const featured = await peopleService.publicFeatured(params);
        if (Array.isArray(featured) && featured.length > 0) return featured;
      } catch {
        // endpoint viejo / 404
      }
      const list = await peopleService.publicList(params);
      return (Array.isArray(list) ? list : []).filter((p) => p.isFeatured);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
  {
    condition: (_, { getState }) => {
      const { featuredStatus, featuredFetchedAt } = getState().people;
      return shouldFetchPublic(featuredStatus, featuredFetchedAt);
    },
  },
);

export const fetchAdminPeople = createAsyncThunk(
  "people/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return await peopleService.adminList();
    } catch (error) {
      return rejectWithValue({ message: error.message, status: error.status });
    }
  },
);

export const createPerson = createAsyncThunk(
  "people/create",
  async (body, { rejectWithValue }) => {
    try {
      return await peopleService.create(body);
    } catch (error) {
      return rejectWithValue({ message: error.message, details: error.details });
    }
  },
);

export const updatePerson = createAsyncThunk(
  "people/update",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await peopleService.update(id, body);
    } catch (error) {
      return rejectWithValue({ message: error.message, details: error.details });
    }
  },
);

export const archivePerson = createAsyncThunk(
  "people/archive",
  async (id, { rejectWithValue }) => {
    try {
      await peopleService.archive(id);
      return id;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

const peopleSlice = createSlice({
  name: "people",
  initialState: {
    publicItems: [],
    fromHoliness: false,
    featuredItems: [],
    featuredStatus: "idle",
    featuredFetchedAt: null,
    adminItems: [],
    status: "idle",
    lastFetchedAt: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicPeople.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPublicPeople.fulfilled, (state, action) => {
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.publicItems = payload;
          state.fromHoliness = false;
        } else {
          state.publicItems = payload.items || [];
          state.fromHoliness = Boolean(payload.fromHoliness);
        }
        state.status = "succeeded";
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchPublicPeople.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Error al cargar personas";
      })
      .addCase(fetchPublicFeatured.pending, (state) => {
        state.featuredStatus = "loading";
      })
      .addCase(fetchPublicFeatured.fulfilled, (state, action) => {
        state.featuredItems = Array.isArray(action.payload) ? action.payload : [];
        state.featuredStatus = "succeeded";
        state.featuredFetchedAt = Date.now();
      })
      .addCase(fetchPublicFeatured.rejected, (state) => {
        state.featuredStatus = "failed";
      })
      .addCase(fetchAdminPeople.fulfilled, (state, action) => {
        state.adminItems = action.payload;
        state.status = "succeeded";
      })
      .addCase(createPerson.fulfilled, (state, action) => {
        state.adminItems = [action.payload, ...state.adminItems];
      })
      .addCase(updatePerson.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        );
      })
      .addCase(archivePerson.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter((p) => p.id !== action.payload);
      });
  },
});

export default peopleSlice.reducer;
