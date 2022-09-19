import socket from "../../socket.conf";
import { apiSlice } from "../api/apiSlice";

export const messagesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query({
      query: (id) =>
        `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=1&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`,
      transformResponse(apiResponse, meta) {
        const totalCount = meta.response.headers.get("X-Total-Count");
        return {
          data: apiResponse,
          totalCount,
        };
      },
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
      ) {
        try {
          await cacheDataLoaded;
          const { auth } = getState();
          const { email } = auth?.user;
          socket.on("message", (data) => {
            updateCachedData((draft) => {
              const isDataPush = Boolean(data.data.receiver.email === email);
              if (isDataPush) {
                draft.data.push(data.data);
              }
            });
          });
        } catch (err) {
          console.log("socket err: ", err);
        }
        await cacheEntryRemoved;
        socket.close();
      },
    }),
    getMoreMessages: builder.query({
      query: ({ id, page }) => {
        return `/messages?conversationId=${id}&_sort=timestamp&_order=desc&_page=${page}&_limit=${process.env.REACT_APP_MESSAGES_PER_PAGE}`;
      },
      async onQueryStarted({ id }, { queryFulfilled, dispatch }) {
        try {
          const messages = await queryFulfilled;

          if (messages?.data?.length > 0) {
            dispatch(
              apiSlice.util.updateQueryData("getMessages", id, (draft) => {
                return {
                  data: [...draft.data, ...messages.data],
                  totalCount: Number(draft.totalCount),
                };
              })
            );
          }
        } catch (err) {}
      },
    }),
    addMessage: builder.mutation({
      query: (data) => {
        return {
          url: "/messages",
          method: "POST",
          body: data,
        };
      },
    }),
  }),
});

export const { useGetMessagesQuery, useAddMessageMutation } = messagesApi;
