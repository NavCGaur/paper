import { configureStore } from '@reduxjs/toolkit';
import paperReducer from '../state/index';
import { paperApi } from '../state/api';

 const store = configureStore({
  reducer: {
    paper: paperReducer,
    [paperApi.reducerPath]: paperApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(paperApi.middleware),
});

export default store