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
  },
});
