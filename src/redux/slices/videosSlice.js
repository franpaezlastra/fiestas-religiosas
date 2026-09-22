import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { videosService } from "../../services";

export const fetchPublicVideos = createAsyncThunk(
  "videos/fetchPublic",
  async (_, { rejectWithValue }) => {
    try {
      return await videosService.publicList();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
  {
    condition: (_, { getState }) => {
      const s = getState().videos.status;
      return s === "idle" || s === "failed";
    },
  },
);

export const fetchAdminVideos = createAsyncThunk(
  "videos/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return await videosService.adminList();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const createVideo = createAsyncThunk(
  "videos/create",
  async (body, { rejectWithValue }) => {
    try {
      return await videosService.create(body);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const updateVideo = createAsyncThunk(
  "videos/update",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await videosService.update(id, body);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const archiveVideo = createAsyncThunk(
  "videos/archive",
  async (id, { rejectWithValue }) => {
    try {
      await videosService.archive(id);
      return id;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

const videosSlice = createSlice({
  name: "videos",
  initialState: { publicItems: [], adminItems: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicVideos.fulfilled, (state, action) => {
        state.publicItems = action.payload;
      })
      .addCase(fetchAdminVideos.fulfilled, (state, action) => {
        state.adminItems = action.payload;
        state.status = "succeeded";
      })
      .addCase(createVideo.fulfilled, (state, action) => {
        state.adminItems = [action.payload, ...state.adminItems];
      })
      .addCase(updateVideo.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.map((v) =>
          v.id === action.payload.id ? action.payload : v,
        );
      })
      .addCase(archiveVideo.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter((v) => v.id !== action.payload);
      });
  },
});

export default videosSlice.reducer;
