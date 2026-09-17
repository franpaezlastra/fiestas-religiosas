import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { socialService } from "../../services";

export const fetchPublicSocial = createAsyncThunk(
  "social/fetchPublic",
  async (_, { rejectWithValue }) => {
    try {
      return await socialService.publicList();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const fetchAdminSocial = createAsyncThunk(
  "social/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return await socialService.adminList();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const upsertSocial = createAsyncThunk(
  "social/upsert",
  async (body, { rejectWithValue }) => {
    try {
      return await socialService.upsert(body);
    } catch (error) {
      return rejectWithValue({ message: error.message });
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
      return rejectWithValue({ message: error.message });
    }
  },
);

const socialSlice = createSlice({
  name: "social",
  initialState: { publicItems: [], adminItems: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicSocial.fulfilled, (state, action) => {
        state.publicItems = action.payload;
      })
      .addCase(fetchAdminSocial.fulfilled, (state, action) => {
        state.adminItems = action.payload;
        state.status = "succeeded";
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
