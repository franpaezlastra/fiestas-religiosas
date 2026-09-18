import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { peopleService } from "../../services";

export const fetchPublicPeople = createAsyncThunk(
  "people/fetchPublic",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await peopleService.publicList(params);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
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
  initialState: { publicItems: [], adminItems: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicPeople.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchPublicPeople.fulfilled, (state, action) => {
        state.publicItems = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchPublicPeople.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "Error al cargar personas";
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
