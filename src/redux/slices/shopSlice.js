import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminShopService, shopService } from "../../services";
import { shouldFetchPublic } from "../stale";

const reject = (error) => ({ message: error.message, code: error.code, details: error.details });

/* ---------- Público ---------- */

export const fetchShopCategories = createAsyncThunk(
  "shop/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const data = await shopService.listCategories();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
  {
    condition: (_, { getState }) => {
      const { categoriesStatus, categoriesFetchedAt } = getState().shop;
      return shouldFetchPublic(categoriesStatus, categoriesFetchedAt);
    },
  },
);

export const fetchShopProducts = createAsyncThunk(
  "shop/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const data = await shopService.listProducts(params);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const fetchShopProduct = createAsyncThunk(
  "shop/fetchProduct",
  async (slug, { rejectWithValue }) => {
    try {
      return await shopService.getProduct(slug);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

/* ---------- Admin ---------- */

export const fetchAdminShopProducts = createAsyncThunk(
  "shop/fetchAdminProducts",
  async (_, { rejectWithValue }) => {
    try {
      return await adminShopService.listProducts();
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const fetchAdminShopCategories = createAsyncThunk(
  "shop/fetchAdminCategories",
  async (_, { rejectWithValue }) => {
    try {
      return await adminShopService.listCategories();
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const createShopProduct = createAsyncThunk(
  "shop/createProduct",
  async (body, { rejectWithValue }) => {
    try {
      return await adminShopService.createProduct(body);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const updateShopProduct = createAsyncThunk(
  "shop/updateProduct",
  async ({ id, body }, { rejectWithValue }) => {
    try {
      return await adminShopService.updateProduct(id, body);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const archiveShopProduct = createAsyncThunk(
  "shop/archiveProduct",
  async (id, { rejectWithValue }) => {
    try {
      await adminShopService.archiveProduct(id);
      return id;
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const adjustVariantStock = createAsyncThunk(
  "shop/adjustStock",
  async ({ variantId, delta, reason }, { rejectWithValue }) => {
    try {
      return await adminShopService.adjustStock(variantId, { delta, reason });
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const createShopCategory = createAsyncThunk(
  "shop/createCategory",
  async (body, { rejectWithValue }) => {
    try {
      return await adminShopService.createCategory(body);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

function replaceProduct(state, product) {
  state.adminItems = state.adminItems.map((p) => (p.id === product.id ? product : p));
}

const shopSlice = createSlice({
  name: "shop",
  initialState: {
    categories: [],
    categoriesStatus: "idle",
    categoriesFetchedAt: null,
    products: [],
    productsStatus: "idle",
    productsError: null,
    bySlug: {},
    adminItems: [],
    adminCategories: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchShopCategories.pending, (state) => {
        state.categoriesStatus = "loading";
      })
      .addCase(fetchShopCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.categoriesStatus = "succeeded";
        state.categoriesFetchedAt = Date.now();
      })
      .addCase(fetchShopCategories.rejected, (state) => {
        state.categoriesStatus = "failed";
      })
      .addCase(fetchShopProducts.pending, (state) => {
        state.productsStatus = "loading";
        state.productsError = null;
      })
      .addCase(fetchShopProducts.fulfilled, (state, action) => {
        state.products = action.payload;
        state.productsStatus = "succeeded";
      })
      .addCase(fetchShopProducts.rejected, (state, action) => {
        state.productsStatus = "failed";
        state.productsError = action.payload?.message || "No pudimos cargar los productos.";
      })
      .addCase(fetchShopProduct.pending, (state, action) => {
        const slug = action.meta.arg;
        state.bySlug[slug] = { ...state.bySlug[slug], status: "loading", error: null };
      })
      .addCase(fetchShopProduct.fulfilled, (state, action) => {
        state.bySlug[action.meta.arg] = { item: action.payload, status: "succeeded", error: null };
      })
      .addCase(fetchShopProduct.rejected, (state, action) => {
        state.bySlug[action.meta.arg] = {
          item: null,
          status: "failed",
          error: action.payload || { message: "No pudimos cargar el producto." },
        };
      })
      .addCase(fetchAdminShopProducts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAdminShopProducts.fulfilled, (state, action) => {
        state.adminItems = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchAdminShopProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || null;
      })
      .addCase(fetchAdminShopCategories.fulfilled, (state, action) => {
        state.adminCategories = action.payload;
      })
      .addCase(createShopProduct.fulfilled, (state, action) => {
        state.adminItems = [action.payload, ...state.adminItems];
      })
      .addCase(updateShopProduct.fulfilled, (state, action) => {
        replaceProduct(state, action.payload);
      })
      .addCase(adjustVariantStock.fulfilled, (state, action) => {
        replaceProduct(state, action.payload);
      })
      .addCase(archiveShopProduct.fulfilled, (state, action) => {
        state.adminItems = state.adminItems.filter((p) => p.id !== action.payload);
      })
      .addCase(createShopCategory.fulfilled, (state, action) => {
        state.adminCategories = [...state.adminCategories, action.payload];
        state.categoriesFetchedAt = null;
      });
  },
});

export default shopSlice.reducer;
