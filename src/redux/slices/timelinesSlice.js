import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { timelinesService } from "../../services";

export const fetchPublicTimelines = createAsyncThunk(
  "timelines/fetchPublic",
  async (_, { rejectWithValue }) => {
    try {
      const data = await timelinesService.publicList();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const fetchAdminTimelines = createAsyncThunk(
  "timelines/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return await timelinesService.adminList();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const createTimeline = createAsyncThunk(
  "timelines/create",
  async (body, { rejectWithValue }) => {
    try {
      return await timelinesService.create(body);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const updateTimeline = createAsyncThunk(
  "timelines/update",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await timelinesService.update(id, body);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const archiveTimeline = createAsyncThunk(
  "timelines/archive",
  async (id, { rejectWithValue }) => {
    try {
      await timelinesService.archive(id);
      return id;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

const timelinesSlice = createSlice({
  name: "timelines",
  initialState: { publicItems: [], adminItems: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicTimelines.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPublicTimelines.fulfilled, (state, action) => {
        state.publicItems = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchPublicTimelines.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Error al cargar timelines";
      })
      .addCase(fetchAdminTimelines.fulfilled, (state, action) => {
        state.adminItems = action.payload;
        state.status = "succeeded";
      })
      .addCase(createTimeline.fulfilled, (state, action) => {
        state.adminItems = [action.payload, ...state.adminItems];
      })
      .addCase(updateTimeline.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.map((t) =>
          t.id === action.payload.id ? action.payload : t,
        );
      })
      .addCase(archiveTimeline.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter((t) => t.id !== action.payload);
      });
  },
});

export default timelinesSlice.reducer;
