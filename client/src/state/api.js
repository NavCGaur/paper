import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const paperApi = createApi({
  reducerPath: 'paperApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000' }),
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
