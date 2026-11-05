import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { meService, userAuthService } from "../../services";

/** Usuarios de la Comunidad. Separado del admin (authSlice): otra cookie, otra sesión. */

const reject = (error) => ({ message: error.message, code: error.code, details: error.details, status: error.status });

function thunk(type, fn) {
  return createAsyncThunk(`userAuth/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  });
}

/** Se pide una sola vez por carga; `{ force: true }` vuelve a pedirlo. */
export const fetchUserMe = createAsyncThunk(
  "userAuth/fetchMe",
  async (_arg, { rejectWithValue }) => {
    try {
      return await userAuthService.me();
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
  {
    condition: (arg, { getState }) => {
      const { checked, status } = getState().userAuth;
      if (arg?.force) return true;
      return !checked && status !== "loading";
    },
  },
);

export const registerUser = thunk("register", (body) => userAuthService.register(body));
export const loginUser = thunk("login", (body) => userAuthService.login(body));
export const logoutUser = thunk("logout", () => userAuthService.logout());
export const verifyEmail = thunk("verifyEmail", (token) => userAuthService.verifyEmail(token));
export const resendVerification = thunk("resendVerification", () => userAuthService.resendVerification());
export const forgotPassword = thunk("forgotPassword", (body) => userAuthService.forgotPassword(body));
export const resetPassword = thunk("resetPassword", (body) => userAuthService.resetPassword(body));
export const updateProfile = thunk("updateProfile", (body) => meService.update(body));
export const uploadAvatar = thunk("uploadAvatar", ({ file, onProgress }) => meService.uploadAvatar(file, onProgress));
export const deleteAvatar = thunk("deleteAvatar", () => meService.deleteAvatar());
export const changePassword = thunk("changePassword", (body) => meService.changePassword(body));
export const deleteAccount = thunk("deleteAccount", (body) => meService.deleteAccount(body));

/** Acciones que devuelven el `Me` actualizado. */
const SET_USER = [registerUser, loginUser, verifyEmail, updateProfile, uploadAvatar, deleteAvatar];

const userAuthSlice = createSlice({
  name: "userAuth",
  initialState: { user: null, status: "idle", error: null, checked: false },
  reducers: {
    clearUserAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserMe.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserMe.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload || null;
        state.checked = true;
      })
      .addCase(fetchUserMe.rejected, (state, action) => {
        state.status = "failed";
        state.user = null;
        state.checked = true;
        state.error = action.payload?.message || null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.user = null;
      });
    for (const t of SET_USER) {
      builder.addCase(t.fulfilled, (state, action) => {
        state.user = action.payload;
        state.checked = true;
        state.error = null;
      });
    }
    /* Si cualquier llamada dice que la sesión ya no existe, se cierra también acá */
    builder.addMatcher(
      (action) => action.type.endsWith("/rejected") && action.payload?.code === "UNAUTHENTICATED",
      (state) => {
        state.user = null;
      },
    );
  },
});

export const { clearUserAuthError } = userAuthSlice.actions;
export const selectUser = (state) => state.userAuth.user;
export default userAuthSlice.reducer;
