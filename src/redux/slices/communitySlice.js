import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { communityService, meService } from "../../services";
import { shouldFetchPublic } from "../stale";
import { deleteAccount, loginUser, logoutUser, registerUser } from "./userAuthSlice";

/**
 * Comunidad pública. A diferencia de shopSlice, las publicaciones se guardan una sola vez
 * (postsById) y las listas guardan ids: así un "me gusta" se ve igual en el feed y en el detalle.
 */

const reject = (error) => ({ message: error.message, code: error.code, details: error.details, status: error.status });

/** Clave estable de una lista según sus filtros. */
export function claveLista(params = {}) {
  const keys = ["sort", "celebration", "province", "person", "author", "q"];
  return keys
    .filter((k) => params[k])
    .map((k) => `${k}=${params[k]}`)
    .join("&") || "todo";
}

export const MIS_PUBLICACIONES = "mine";

const listaVacia = { ids: [], nextCursor: null, status: "idle", error: null, fetchedAt: null, loadingMore: false };

/* ---------- Thunks ---------- */

export const fetchPosts = createAsyncThunk(
  "community/fetchPosts",
  async ({ params = {}, append = false } = {}, { getState, rejectWithValue }) => {
    try {
      const lista = getState().community.listas[claveLista(params)];
      const cursor = append ? lista?.nextCursor : undefined;
      return await communityService.listPosts({ ...params, cursor, limit: 12 });
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
  {
    condition: ({ params = {}, append = false } = {}, { getState }) => {
      const lista = getState().community.listas[claveLista(params)];
      if (!lista) return true;
      if (lista.status === "loading" || lista.loadingMore) return false;
      if (append) return Boolean(lista.nextCursor);
      return shouldFetchPublic(lista.status, lista.fetchedAt);
    },
  },
);

export const fetchMyPosts = createAsyncThunk(
  "community/fetchMyPosts",
  async ({ append = false } = {}, { getState, rejectWithValue }) => {
    try {
      const lista = getState().community.listas[MIS_PUBLICACIONES];
      return await meService.myPosts({ cursor: append ? lista?.nextCursor : undefined });
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const fetchPost = createAsyncThunk("community/fetchPost", async (slug, { rejectWithValue }) => {
  try {
    return await communityService.getPost(slug);
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const fetchUserPublic = createAsyncThunk("community/fetchUser", async (username, { rejectWithValue }) => {
  try {
    return await communityService.getUser(username);
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const fetchCelebrationSummary = createAsyncThunk(
  "community/fetchSummary",
  async (slug, { rejectWithValue }) => {
    try {
      return await communityService.celebrationSummary(slug);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
  {
    condition: (slug, { getState }) => {
      const r = getState().community.resumenes[slug];
      return !r || shouldFetchPublic(r.status, r.fetchedAt);
    },
  },
);

/** Optimista: el pending suma o resta en el momento; si falla, se revierte. */
export const toggleLike = createAsyncThunk("community/toggleLike", async ({ id, liked }, { rejectWithValue }) => {
  try {
    return await (liked ? communityService.unlike(id) : communityService.like(id));
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const createPost = createAsyncThunk("community/createPost", async (body, { rejectWithValue }) => {
  try {
    return await communityService.createPost(body);
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const updatePost = createAsyncThunk("community/updatePost", async ({ id, body }, { rejectWithValue }) => {
  try {
    return await communityService.updatePost(id, body);
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const deletePost = createAsyncThunk("community/deletePost", async (id, { rejectWithValue }) => {
  try {
    await communityService.deletePost(id);
    return id;
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const fetchComments = createAsyncThunk(
  "community/fetchComments",
  async ({ postId, append = false }, { getState, rejectWithValue }) => {
    try {
      const actual = getState().community.comentarios[postId];
      return await communityService.listComments(postId, { cursor: append ? actual?.nextCursor : undefined });
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const fetchReplies = createAsyncThunk(
  "community/fetchReplies",
  async ({ commentId }, { rejectWithValue }) => {
    try {
      return await communityService.listReplies(commentId);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const createComment = createAsyncThunk(
  "community/createComment",
  async ({ postId, body, parentId }, { rejectWithValue }) => {
    try {
      return await communityService.createComment(postId, { body, parentId: parentId || undefined });
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const editComment = createAsyncThunk("community/editComment", async ({ id, body }, { rejectWithValue }) => {
  try {
    return await communityService.editComment(id, { body });
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const deleteComment = createAsyncThunk("community/deleteComment", async ({ id }, { rejectWithValue }) => {
  try {
    await communityService.deleteComment(id);
    return id;
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

export const reportContent = createAsyncThunk("community/report", async (body, { rejectWithValue }) => {
  try {
    return await communityService.report(body);
  } catch (error) {
    return rejectWithValue(reject(error));
  }
});

/* ---------- Helpers del estado ---------- */

function upsert(state, post) {
  if (!post?.id) return;
  state.postsById[post.id] = { ...state.postsById[post.id], ...post };
  state.bySlug[post.slug] = { id: post.id, status: "succeeded", error: null };
}

function invalidarListas(state) {
  Object.values(state.listas).forEach((l) => {
    l.fetchedAt = null;
  });
  Object.values(state.resumenes).forEach((r) => {
    r.fetchedAt = null;
  });
}

function buscarComentario(items, id) {
  for (const c of items) {
    if (c.id === id) return { comment: c, parent: null };
    const reply = c.replies?.find((r) => r.id === id);
    if (reply) return { comment: reply, parent: c };
  }
  return null;
}

function sumarComentarios(state, postId, delta) {
  const post = state.postsById[postId];
  if (post) post.commentCount = Math.max(0, (post.commentCount || 0) + delta);
}

const initialState = {
  postsById: {},
  listas: {},
  bySlug: {},
  usuarios: {},
  resumenes: {},
  comentarios: {},
};

const communitySlice = createSlice({
  name: "community",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* Listas */
      .addCase(fetchPosts.pending, (state, action) => {
        const key = claveLista(action.meta.arg?.params);
        const lista = (state.listas[key] ||= { ...listaVacia });
        if (action.meta.arg?.append) lista.loadingMore = true;
        else lista.status = "loading";
        lista.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        const key = claveLista(action.meta.arg?.params);
        const lista = state.listas[key];
        action.payload.items.forEach((p) => upsert(state, p));
        const ids = action.payload.items.map((p) => p.id);
        lista.ids = action.meta.arg?.append ? [...new Set([...lista.ids, ...ids])] : ids;
        lista.nextCursor = action.payload.nextCursor;
        lista.status = "succeeded";
        lista.loadingMore = false;
        lista.fetchedAt = Date.now();
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        const lista = state.listas[claveLista(action.meta.arg?.params)];
        if (!lista) return;
        lista.loadingMore = false;
        if (action.meta.arg?.append) lista.error = action.payload?.message;
        else {
          lista.status = "failed";
          lista.error = action.payload?.message || "No pudimos cargar las publicaciones.";
        }
      })
      .addCase(fetchMyPosts.pending, (state, action) => {
        const lista = (state.listas[MIS_PUBLICACIONES] ||= { ...listaVacia });
        if (action.meta.arg?.append) lista.loadingMore = true;
        else lista.status = "loading";
      })
      .addCase(fetchMyPosts.fulfilled, (state, action) => {
        const lista = state.listas[MIS_PUBLICACIONES];
        action.payload.items.forEach((p) => upsert(state, p));
        const ids = action.payload.items.map((p) => p.id);
        lista.ids = action.meta.arg?.append ? [...new Set([...lista.ids, ...ids])] : ids;
        lista.nextCursor = action.payload.nextCursor;
        lista.status = "succeeded";
        lista.loadingMore = false;
        lista.fetchedAt = Date.now();
      })
      .addCase(fetchMyPosts.rejected, (state, action) => {
        const lista = state.listas[MIS_PUBLICACIONES];
        lista.status = "failed";
        lista.loadingMore = false;
        lista.error = action.payload?.message;
      })

      /* Detalle */
      .addCase(fetchPost.pending, (state, action) => {
        const entry = state.bySlug[action.meta.arg];
        state.bySlug[action.meta.arg] = { id: entry?.id || null, status: "loading", error: null };
      })
      .addCase(fetchPost.fulfilled, (state, action) => {
        upsert(state, { ...action.payload, full: true });
      })
      .addCase(fetchPost.rejected, (state, action) => {
        state.bySlug[action.meta.arg] = { id: null, status: "failed", error: action.payload };
      })

      .addCase(fetchUserPublic.pending, (state, action) => {
        const u = state.usuarios[action.meta.arg];
        state.usuarios[action.meta.arg] = { item: u?.item || null, status: "loading", error: null };
      })
      .addCase(fetchUserPublic.fulfilled, (state, action) => {
        state.usuarios[action.meta.arg] = { item: action.payload, status: "succeeded", error: null };
      })
      .addCase(fetchUserPublic.rejected, (state, action) => {
        state.usuarios[action.meta.arg] = { item: null, status: "failed", error: action.payload };
      })

      .addCase(fetchCelebrationSummary.pending, (state, action) => {
        const r = state.resumenes[action.meta.arg];
        state.resumenes[action.meta.arg] = { ...(r || { ids: [], postCount: 0 }), status: "loading", error: null };
      })
      .addCase(fetchCelebrationSummary.fulfilled, (state, action) => {
        action.payload.latest.forEach((p) => upsert(state, p));
        state.resumenes[action.meta.arg] = {
          ids: action.payload.latest.map((p) => p.id),
          postCount: action.payload.postCount,
          status: "succeeded",
          error: null,
          fetchedAt: Date.now(),
        };
      })
      .addCase(fetchCelebrationSummary.rejected, (state, action) => {
        state.resumenes[action.meta.arg] = {
          ids: [],
          postCount: 0,
          status: "failed",
          error: action.payload?.message,
          fetchedAt: null,
        };
      })

      /* Me gusta (optimista) */
      .addCase(toggleLike.pending, (state, action) => {
        const post = state.postsById[action.meta.arg.id];
        if (!post) return;
        post.likedByMe = !action.meta.arg.liked;
        post.likeCount = Math.max(0, post.likeCount + (action.meta.arg.liked ? -1 : 1));
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.postsById[action.meta.arg.id];
        if (!post) return;
        post.likedByMe = action.payload.liked;
        post.likeCount = action.payload.likeCount;
      })
      .addCase(toggleLike.rejected, (state, action) => {
        const post = state.postsById[action.meta.arg.id];
        if (!post) return;
        post.likedByMe = action.meta.arg.liked;
        post.likeCount = Math.max(0, post.likeCount + (action.meta.arg.liked ? 1 : -1));
      })

      /* Publicar */
      .addCase(createPost.fulfilled, (state, action) => {
        upsert(state, { ...action.payload, full: true });
        invalidarListas(state);
        const mias = state.listas[MIS_PUBLICACIONES];
        if (mias) mias.ids = [action.payload.id, ...mias.ids];
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        upsert(state, { ...action.payload, full: true });
        invalidarListas(state);
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const post = state.postsById[action.payload];
        if (post) state.bySlug[post.slug] = { id: null, status: "failed", error: { code: "NOT_FOUND" } };
        delete state.postsById[action.payload];
        Object.values(state.listas).forEach((l) => {
          l.ids = l.ids.filter((id) => id !== action.payload);
        });
        Object.values(state.resumenes).forEach((r) => {
          r.ids = r.ids.filter((id) => id !== action.payload);
        });
      })

      /* Comentarios */
      .addCase(fetchComments.pending, (state, action) => {
        const { postId, append } = action.meta.arg;
        const actual = (state.comentarios[postId] ||= { items: [], nextCursor: null, status: "idle", error: null });
        if (append) actual.loadingMore = true;
        else actual.status = "loading";
        actual.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        const { postId, append } = action.meta.arg;
        const actual = state.comentarios[postId];
        actual.items = append ? [...actual.items, ...action.payload.items] : action.payload.items;
        actual.nextCursor = action.payload.nextCursor;
        actual.status = "succeeded";
        actual.loadingMore = false;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        const actual = state.comentarios[action.meta.arg.postId];
        actual.loadingMore = false;
        actual.status = action.meta.arg.append ? actual.status : "failed";
        actual.error = action.payload?.message || "No pudimos cargar los comentarios.";
      })
      .addCase(fetchReplies.fulfilled, (state, action) => {
        const { postId, commentId } = action.meta.arg;
        const found = buscarComentario(state.comentarios[postId]?.items || [], commentId);
        if (found) found.comment.replies = action.payload.items;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        const { postId, parentId } = action.meta.arg;
        const actual = (state.comentarios[postId] ||= { items: [], nextCursor: null, status: "succeeded", error: null });
        if (parentId) {
          const found = buscarComentario(actual.items, parentId);
          if (found) {
            found.comment.replies = [...(found.comment.replies || []), action.payload];
            found.comment.replyCount = (found.comment.replyCount || 0) + 1;
          }
        } else {
          actual.items.push(action.payload);
        }
        sumarComentarios(state, postId, 1);
      })
      .addCase(editComment.fulfilled, (state, action) => {
        const actual = state.comentarios[action.payload.postId];
        const found = actual && buscarComentario(actual.items, action.payload.id);
        if (found) Object.assign(found.comment, { body: action.payload.body, editedAt: action.payload.editedAt });
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        const { postId } = action.meta.arg;
        const actual = state.comentarios[postId];
        const found = actual && buscarComentario(actual.items, action.payload);
        if (!found) return;
        if (found.parent) {
          found.parent.replies = found.parent.replies.filter((r) => r.id !== action.payload);
          found.parent.replyCount = Math.max(0, found.parent.replyCount - 1);
          if (found.parent.deleted && found.parent.replyCount === 0) {
            actual.items = actual.items.filter((c) => c.id !== found.parent.id);
          }
        } else if (found.comment.replyCount > 0) {
          Object.assign(found.comment, { deleted: true, body: null, author: null, isMine: false });
        } else {
          actual.items = actual.items.filter((c) => c.id !== action.payload);
        }
        sumarComentarios(state, postId, -1);
      });

    /* Al cambiar de usuario, likedByMe e isMine cambian: se vuelve a pedir todo */
    for (const t of [loginUser, registerUser, logoutUser, deleteAccount]) {
      builder.addCase(t.fulfilled, () => initialState);
    }
  },
});

/* ---------- Selectores ---------- */

export const selectLista = (state, key) => state.community.listas[key] || listaVacia;

export const selectPostPorSlug = (state, slug) => {
  const entry = state.community.bySlug[slug];
  return entry?.id ? state.community.postsById[entry.id] : null;
};

export default communitySlice.reducer;
