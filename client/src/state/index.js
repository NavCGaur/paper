import { createSlice } from "@reduxjs/toolkit";

const paperSlice = createSlice({
    name: 'paper',
    initialState: {
      generatedPaper: null,
      loading: false,
      error: null,
    },
    reducers: {
      clearPaper: (state) => {
        state.generatedPaper = null;
      },
    },
  });
  
  export const { clearPaper } = paperSlice.actions;
  export default paperSlice.reducer;