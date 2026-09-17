import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { mediaService } from "../../services";

export const fetchAdminMedia = createAsyncThunk(
  "media/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return await mediaService.list();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const uploadMedia = createAsyncThunk(
  "media/upload",
  async (files, { rejectWithValue }) => {
    try {
      return await mediaService.upload(files);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const removeMedia = createAsyncThunk(
  "media/remove",
  async (id, { rejectWithValue }) => {
    try {
      await mediaService.remove(id);
      return id;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

const mediaSlice = createSlice({
  name: "media",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminMedia.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "succeeded";
      })
      .addCase(uploadMedia.fulfilled, (state, action) => {
        const uploaded = Array.isArray(action.payload) ? action.payload : [action.payload];
        state.items = [...uploaded, ...state.items];
      })
      .addCase(removeMedia.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload);
      });
  },
});

export default mediaSlice.reducer;
