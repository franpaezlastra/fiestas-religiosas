import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { booksService } from "../../services";
import { shouldFetchPublic } from "../stale";

export const fetchPublicBooks = createAsyncThunk(
  "books/fetchPublic",
  async (_, { rejectWithValue }) => {
    try {
      const data = await booksService.publicList();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
  {
    condition: (_, { getState }) => {
      const { publicStatus, lastFetchedAt } = getState().books;
      return shouldFetchPublic(publicStatus, lastFetchedAt);
    },
  },
);

export const fetchAdminBooks = createAsyncThunk(
  "books/fetchAdmin",
  async (_, { rejectWithValue }) => {
    try {
      return await booksService.adminList();
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const createBook = createAsyncThunk(
  "books/create",
  async (body, { rejectWithValue }) => {
    try {
      return await booksService.create(body);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const updateBook = createAsyncThunk(
  "books/update",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await booksService.update(id, body);
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

export const archiveBook = createAsyncThunk(
  "books/archive",
  async (id, { rejectWithValue }) => {
    try {
      await booksService.archive(id);
      return id;
    } catch (error) {
      return rejectWithValue({ message: error.message });
    }
  },
);

const booksSlice = createSlice({
  name: "books",
  initialState: {
    publicItems: [],
    publicStatus: "idle",
    lastFetchedAt: null,
    adminItems: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPublicBooks.pending, (state) => {
        state.publicStatus = "loading";
      })
      .addCase(fetchPublicBooks.fulfilled, (state, action) => {
        state.publicItems = action.payload;
        state.publicStatus = "succeeded";
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchPublicBooks.rejected, (state, action) => {
        state.publicStatus = "failed";
        state.error = action.payload?.message || null;
      })
      .addCase(fetchAdminBooks.fulfilled, (state, action) => {
        state.adminItems = action.payload;
        state.status = "succeeded";
      })
      .addCase(createBook.fulfilled, (state, action) => {
        state.adminItems = [action.payload, ...state.adminItems];
      })
      .addCase(updateBook.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.map((b) =>
          b.id === action.payload.id ? action.payload : b,
        );
      })
      .addCase(archiveBook.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter((b) => b.id !== action.payload);
      });
  },
});

export default booksSlice.reducer;
