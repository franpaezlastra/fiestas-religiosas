import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { peopleService } from "../../services";

/**
 * Preferí /public/people/holiness (solo santidad).
 * Si viene vacío o falla, cae a /public/people.
 * Los isFeatured (Maradona/Messi/…) se excluyen acá — van a /people/featured.
 */
export const fetchPublicPeople = createAsyncThunk(
  "people/fetchPublic",
  async (params = {}, { rejectWithValue }) => {
    try {
      let fromHoliness = false;
      let data = [];
      try {
        const holiness = await peopleService.publicHoliness(params);
        if (Array.isArray(holiness) && holiness.length > 0) {
          data = holiness;
          fromHoliness = true;
        }
      } catch {
        // endpoint viejo / 404 → listado general
      }
      if (data.length === 0) {
        const list = await peopleService.publicList(params);
        data = Array.isArray(list) ? list : [];
      }
      // Nunca mezclar destacados culturales en el slice de santos
      data = data.filter((p) => {
        if (p?.canonizationStage) return true;
        const roles = (p?.roles || []).map((r) => r.role);
        if (roles.some((r) => ["SAINT", "BLESSED"].includes(r))) return true;
        if (p?.isFeatured) return false;
        return true;
      });
      return { items: data, fromHoliness };
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
  {
    condition: (_, { getState }) => {
      const s = getState().people.status;
      return s === "idle" || s === "failed";
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
      const s = getState().people.featuredStatus;
      return s === "idle" || s === "failed";
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
    adminItems: [],
    status: "idle",
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
