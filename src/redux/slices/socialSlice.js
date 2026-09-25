import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { socialService } from "../../services";
import { shouldFetchPublic } from "../stale";

function asList(payload) {
  return Array.isArray(payload) ? payload : [];
}

export const fetchPublicSocial = createAsyncThunk(
  "social/fetchPublic",
  async (_, { rejectWithValue }) => {
    try {
      return asList(await socialService.publicList());
    } catch (error) {
      return rejectWithValue({ message: error.message, status: error.status });
    }
  },
  {
    condition: (_, { getState }) => {
      const { status, lastFetchedAt } = getState().social;
      return shouldFetchPublic(status, lastFetchedAt);
    },
  },
);

export const fetchAdminSocial = createAsyncThunk(
  "social/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return asList(await socialService.adminList());
    } catch (error) {
      return rejectWithValue({ message: error.message, status: error.status });
    }
  },
);

export const upsertSocial = createAsyncThunk(
  "social/upsert",
  async (body, { rejectWithValue }) => {
    try {
      return await socialService.upsert(body);
    } catch (error) {
      return rejectWithValue({ message: error.message, status: error.status });
    }
  },
);

export const removeSocial = createAsyncThunk(
  "social/remove",
  async (id, { rejectWithValue }) => {
    try {
      await socialService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue({ message: error.message, status: error.status });
    }
  },
);

const socialSlice = createSlice({
  name: "social",
  initialState: {
    publicItems: [],
    adminItems: [],
    status: "idle",
    adminStatus: "idle",
    lastFetchedAt: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicSocial.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchPublicSocial.fulfilled, (state, action) => {
        state.publicItems = asList(action.payload);
        state.status = "succeeded";
        state.lastFetchedAt = Date.now();
        state.error = null;
      })
      .addCase(fetchPublicSocial.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || null;
      })
      .addCase(fetchAdminSocial.pending, (state) => {
        state.adminStatus = "loading";
      })
      .addCase(fetchAdminSocial.fulfilled, (state, action) => {
        state.adminItems = asList(action.payload);
        state.adminStatus = "succeeded";
        state.error = null;
      })
      .addCase(fetchAdminSocial.rejected, (state, action) => {
        state.adminStatus = "failed";
        state.error = action.payload?.message || null;
      })
      .addCase(upsertSocial.fulfilled, (state, action) => {
        const idx = state.adminItems.findIndex((s) => s.platform === action.payload.platform);
        if (idx >= 0) state.adminItems[idx] = action.payload;
        else state.adminItems.push(action.payload);
      })
      .addCase(removeSocial.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter((s) => s.id !== action.payload);
      });
  },
});

export default socialSlice.reducer;
