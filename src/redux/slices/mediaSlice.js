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
  async (arg, { rejectWithValue }) => {
    try {
      // Compat: FileList | File[] | { files, metadata }
      const files = arg?.files ?? arg;
      const metadata = arg?.metadata ?? {};
      return await mediaService.upload(files, metadata);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const updateMedia = createAsyncThunk(
  "media/update",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await mediaService.update(id, body);
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
      .addCase(updateMedia.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated?.id) return;
        state.items = state.items.map((m) => (m.id === updated.id ? updated : m));
      })
      .addCase(removeMedia.fulfilled, (state, action) => {
        state.items = state.items.filter((m) => m.id !== action.payload);
      });
  },
});

export default mediaSlice.reducer;
