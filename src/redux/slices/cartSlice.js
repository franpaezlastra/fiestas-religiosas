import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { shopService } from "../../services";

export const CART_KEY = "fr-carrito-v1";

/** Solo se guardan ids, cantidad y datos para mostrar. El precio real lo calcula el backend. */
function loadItems() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
}

/** Tope de unidades: stock conocido para físicos, 1 licencia para digitales. */
function maxFor(item) {
  if (item.fulfillment === "digital") return 1;
  return item.stock == null ? Infinity : Math.max(0, item.stock);
}

function clamp(item, quantity) {
  return Math.max(1, Math.min(Math.floor(quantity) || 1, maxFor(item)));
}

/** Revalida contra el catálogo: marca lo que ya no existe o no tiene stock. */
export const validateCart = createAsyncThunk(
  "cart/validate",
  async (_, { getState, rejectWithValue }) => {
    const items = getState().cart.items.map(({ variantId, quantity }) => ({ variantId, quantity }));
    if (!items.length) return { items: [] };
    try {
      return await shopService.validateCart(items);
    } catch (error) {
      return rejectWithValue({ message: error.message, code: error.code });
    }
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: loadItems(),
    drawerOpen: false,
    validationStatus: "idle",
    error: null,
  },
  reducers: {
    addItem(state, action) {
      const { item, quantity = 1 } = action.payload;
      const existing = state.items.find((i) => i.variantId === item.variantId);
      if (existing) {
        Object.assign(existing, { ...item, quantity: existing.quantity });
        existing.quantity = clamp(existing, existing.quantity + quantity);
        existing.issue = null;
      } else {
        const next = { ...item, issue: null };
        next.quantity = clamp(next, quantity);
        if (maxFor(next) > 0) state.items.push(next);
      }
      state.drawerOpen = true;
    },
    setQuantity(state, action) {
      const { variantId, quantity } = action.payload;
      const item = state.items.find((i) => i.variantId === variantId);
      if (!item) return;
      item.quantity = clamp(item, quantity);
      if (item.issue === "insufficient_stock" && item.quantity <= maxFor(item)) item.issue = null;
    },
    removeItem(state, action) {
      state.items = state.items.filter((i) => i.variantId !== action.payload);
    },
    clearCart(state) {
      state.items = [];
    },
    openDrawer(state) {
      state.drawerOpen = true;
    },
    closeDrawer(state) {
      state.drawerOpen = false;
    },
    /** Marca productos sin stock a partir de error.details.items de OUT_OF_STOCK. */
    markOutOfStock(state, action) {
      for (const { variantId, available } of action.payload || []) {
        const item = state.items.find((i) => i.variantId === variantId);
        if (!item) continue;
        item.stock = available ?? 0;
        item.issue = item.stock > 0 ? "insufficient_stock" : "out_of_stock";
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(validateCart.pending, (state) => {
        state.validationStatus = "loading";
        state.error = null;
      })
      .addCase(validateCart.fulfilled, (state, action) => {
        state.validationStatus = "succeeded";
        const byId = new Map((action.payload?.items || []).map((r) => [r.variantId, r]));
        for (const item of state.items) {
          const result = byId.get(item.variantId);
          if (!result) continue;
          if (result.status === "unavailable") {
            item.issue = "unavailable";
            continue;
          }
          item.stock = result.stock;
          if (result.price != null) item.price = result.price;
          item.issue = result.status === "ok" ? null : result.status;
        }
      })
      .addCase(validateCart.rejected, (state, action) => {
        state.validationStatus = "failed";
        state.error = action.payload?.message || null;
      });
  },
});

export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) =>
  state.cart.items.reduce((acc, i) => acc + i.quantity, 0);
/** Subtotal solo para mostrar. */
export const selectCartSubtotal = (state) =>
  state.cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
export const selectCartHasIssues = (state) => state.cart.items.some((i) => i.issue);
export const selectCartHasPhysical = (state) =>
  state.cart.items.some((i) => i.fulfillment === "physical");

export const {
  addItem,
  setQuantity,
  removeItem,
  clearCart,
  openDrawer,
  closeDrawer,
  markOutOfStock,
} = cartSlice.actions;
export default cartSlice.reducer;
