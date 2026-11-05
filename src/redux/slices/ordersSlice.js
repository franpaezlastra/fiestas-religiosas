import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { adminOrdersService } from "../../services";

const reject = (error) => ({ message: error.message, code: error.code });

export const fetchAdminOrders = createAsyncThunk(
  "orders/fetchAdmin",
  async (params = {}, { rejectWithValue }) => {
    try {
      return await adminOrdersService.list(params);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ id, status, note }, { rejectWithValue }) => {
    try {
      return await adminOrdersService.updateStatus(id, { status, note });
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

export const createOrderShipment = createAsyncThunk(
  "orders/createShipment",
  async (id, { rejectWithValue }) => {
    try {
      return await adminOrdersService.createShipment(id);
    } catch (error) {
      return rejectWithValue(reject(error));
    }
  },
);

function replaceOrder(state, order) {
  state.adminItems = state.adminItems.map((o) => (o.id === order.id ? order : o));
}

const ordersSlice = createSlice({
  name: "orders",
  initialState: {
    adminItems: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.adminItems = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload?.message || null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        replaceOrder(state, action.payload);
      })
      .addCase(createOrderShipment.fulfilled, (state, action) => {
        replaceOrder(state, action.payload);
      });
  },
});

export default ordersSlice.reducer;
