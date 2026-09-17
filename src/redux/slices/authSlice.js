import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authService } from "../../services";

export const login = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    return await authService.login(email, password);
  } catch (error) {
    return rejectWithValue({ message: error.message, code: error.code, status: error.status });
  }
});

export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    return await authService.me();
  } catch (error) {
    return rejectWithValue({ message: error.message, code: error.code, status: error.status });
  }
});

export const logout = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
    return null;
  } catch (error) {
    return rejectWithValue({ message: error.message, code: error.code, status: error.status });
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState: {
    admin: null,
    status: "idle",
    error: null,
    checked: false,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.admin = action.payload?.admin ?? action.payload;
        state.checked = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || "No se pudo iniciar sesión";
        state.admin = null;
        state.checked = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.admin = action.payload;
        state.checked = true;
        state.status = "succeeded";
      })
      .addCase(fetchMe.rejected, (state) => {
        state.admin = null;
        state.checked = true;
        state.status = "idle";
      })
      .addCase(logout.fulfilled, (state) => {
        state.admin = null;
        state.status = "idle";
        state.checked = true;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
