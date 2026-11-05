import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { communityAdminService } from "../../services";

/**
 * Moderación de la Comunidad (panel admin, sesión del admin).
 * Separado de communitySlice como ordersSlice de shopSlice: otra sesión y solo se usa en el chunk del admin.
 */

const reject = (error) => ({ message: error.message, code: error.code, details: error.details });

function thunk(type, fn) {
  return createAsyncThunk(`communityAdmin/${type}`, async (arg, { rejectWithValue }) => {
    try {
      return await fn(arg);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  });
}

export const fetchCommunityStats = thunk("stats", () => communityAdminService.stats());
export const fetchModerationPosts = thunk("posts", (params) => communityAdminService.listPosts(params));
export const fetchAdminPostDetail = thunk("postDetail", (id) => communityAdminService.getPost(id));
export const approvePost = thunk("approve", (id) => communityAdminService.approve(id));
export const rejectPost = thunk("reject", ({ id, note }) => communityAdminService.reject(id, { note }));
export const removePost = thunk("remove", ({ id, note }) => communityAdminService.remove(id, { note }));
export const restorePost = thunk("restore", (id) => communityAdminService.restore(id));
export const adminDeleteComment = thunk("deleteComment", (id) => communityAdminService.deleteComment(id));
export const adminRestoreComment = thunk("restoreComment", (id) => communityAdminService.restoreComment(id));
export const fetchReports = thunk("reports", (params) => communityAdminService.listReports(params));
export const resolveReport = thunk("resolveReport", ({ id, action, note }) =>
  communityAdminService.resolveReport(id, { action, note }),
);
export const fetchCommunityUsers = thunk("users", (params) => communityAdminService.listUsers(params));
export const fetchAdminUserDetail = thunk("userDetail", (id) => communityAdminService.getUser(id));
export const suspendCommunityUser = thunk("suspend", ({ id, days, reason }) =>
  communityAdminService.suspend(id, { days, reason }),
);
export const reactivateCommunityUser = thunk("reactivate", (id) => communityAdminService.reactivate(id));
export const setUserTrusted = thunk("trust", ({ id, canPublishDirectly }) =>
  communityAdminService.updateUser(id, { canPublishDirectly }),
);
export const fetchBlockedWords = thunk("blockedWords", () => communityAdminService.getBlockedWords());
export const saveBlockedWords = thunk("saveBlockedWords", (words) => communityAdminService.setBlockedWords({ words }));

const lista = () => ({ items: [], status: "idle", error: null });

function reemplazarUsuario(state, user) {
  state.usuarios.items = state.usuarios.items.map((u) => (u.id === user.id ? { ...u, ...user } : u));
}

const communityAdminSlice = createSlice({
  name: "communityAdmin",
  initialState: {
    stats: null,
    statsStatus: "idle",
    cola: lista(),
    reportes: lista(),
    usuarios: lista(),
    palabras: { words: [], status: "idle", error: null },
  },
  reducers: {},
  extraReducers: (builder) => {
    const listas = [
      [fetchModerationPosts, "cola"],
      [fetchReports, "reportes"],
      [fetchCommunityUsers, "usuarios"],
    ];
    for (const [t, key] of listas) {
      builder
        .addCase(t.pending, (state) => {
          state[key].status = "loading";
          state[key].error = null;
        })
        .addCase(t.fulfilled, (state, action) => {
          state[key].status = "succeeded";
          state[key].items = action.payload.items;
        })
        .addCase(t.rejected, (state, action) => {
          state[key].status = "failed";
          state[key].error = action.payload?.message || "No pudimos cargar los datos.";
        });
    }
    builder
      .addCase(fetchCommunityStats.pending, (state) => {
        state.statsStatus = "loading";
      })
      .addCase(fetchCommunityStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        state.statsStatus = "succeeded";
      })
      .addCase(fetchCommunityStats.rejected, (state) => {
        state.statsStatus = "failed";
      })
      .addCase(fetchBlockedWords.pending, (state) => {
        state.palabras.status = "loading";
      })
      .addCase(fetchBlockedWords.fulfilled, (state, action) => {
        state.palabras = { words: action.payload.words, status: "succeeded", error: null };
      })
      .addCase(fetchBlockedWords.rejected, (state, action) => {
        state.palabras.status = "failed";
        state.palabras.error = action.payload?.message;
      })
      .addCase(saveBlockedWords.fulfilled, (state, action) => {
        state.palabras.words = action.payload.words;
      });

    /* Una publicación moderada sale de la cola si cambió de estado */
    for (const t of [approvePost, rejectPost, removePost, restorePost]) {
      builder.addCase(t.fulfilled, (state, action) => {
        state.cola.items = state.cola.items
          .map((p) => (p.id === action.payload.id ? action.payload : p))
          .filter((p) => p.id !== action.payload.id || p.status === "PENDING");
        if (state.stats && t === approvePost) state.stats.pendingPosts = Math.max(0, state.stats.pendingPosts - 1);
        if (state.stats && t === rejectPost) state.stats.pendingPosts = Math.max(0, state.stats.pendingPosts - 1);
      });
    }
    builder.addCase(resolveReport.fulfilled, (state, action) => {
      state.reportes.items = state.reportes.items.filter((g) => g.id !== action.meta.arg.id);
      if (state.stats) state.stats.openReports = Math.max(0, state.stats.openReports - 1);
    });
    for (const t of [suspendCommunityUser, reactivateCommunityUser, setUserTrusted]) {
      builder.addCase(t.fulfilled, (state, action) => reemplazarUsuario(state, action.payload));
    }
  },
});

export default communityAdminSlice.reducer;
