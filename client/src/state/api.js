import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const paperApi = createApi({
  reducerPath: 'paperApi',
  baseQuery: fetchBaseQuery({ baseUrl: process.env.REACT_APP_API_BASE_URL }),
  endpoints: (builder) => ({
    generatePaper: builder.mutation({
      query: (paperDetails) => ({
        url: 'generate-paper',
        method: 'POST',
        body: paperDetails,
      }),
    }),    
    generatePaper3: builder.mutation({
      query: (paperDetails) => ({
        url: 'generate-paper3',
        method: 'POST',
        body: paperDetails,
      }),
    }),    
  }),
});

export const { useGeneratePaperMutation, useGeneratePaper3Mutation } = paperApi;
