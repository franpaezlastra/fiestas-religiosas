import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import celebrationsReducer from "./slices/celebrationsSlice";
import peopleReducer from "./slices/peopleSlice";
import timelinesReducer from "./slices/timelinesSlice";
import videosReducer from "./slices/videosSlice";
import booksReducer from "./slices/booksSlice";
import socialReducer from "./slices/socialSlice";
import mediaReducer from "./slices/mediaSlice";
import provincesReducer from "./slices/provincesSlice";
import shopReducer from "./slices/shopSlice";
import cartReducer, { saveCart } from "./slices/cartSlice";
import ordersReducer from "./slices/ordersSlice";
import userAuthReducer from "./slices/userAuthSlice";
import communityReducer from "./slices/communitySlice";
import communityAdminReducer from "./slices/communityAdminSlice";
import novedadesReducer from "./slices/novedadesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    celebrations: celebrationsReducer,
    people: peopleReducer,
    timelines: timelinesReducer,
    videos: videosReducer,
    books: booksReducer,
    social: socialReducer,
    media: mediaReducer,
    provinces: provincesReducer,
    shop: shopReducer,
    cart: cartReducer,
    orders: ordersReducer,
    userAuth: userAuthReducer,
    community: communityReducer,
    communityAdmin: communityAdminReducer,
    novedades: novedadesReducer,
  },
});

/* El carrito sobrevive a recargas: se guarda cada vez que cambian sus ítems. */
let lastCartItems = store.getState().cart.items;
store.subscribe(() => {
  const items = store.getState().cart.items;
  if (items !== lastCartItems) {
    lastCartItems = items;
    saveCart(items);
  }
});
