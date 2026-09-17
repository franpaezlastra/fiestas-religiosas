import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { provincesService } from "../../services";

export const fetchProvinces = createAsyncThunk(
  "provinces/fetch",
  async (_, { rejectWithValue }) => {
    try {
      return await provincesService.list();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

const provincesSlice = createSlice({
  name: "provinces",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProvinces.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchProvinces.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message;
      });
  },
});

export default provincesSlice.reducer;
