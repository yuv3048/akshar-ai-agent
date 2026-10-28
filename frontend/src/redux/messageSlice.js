import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    artifacts: [],
    messagesCursor: null,
    hasMoreMessages: false,
    loadingOlderMessages: false,
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    prependMessages: (state, action) => {
      const knownIds = new Set(state.messages.map((item) => item._id).filter(Boolean));
      const older = action.payload.filter((item) => !item._id || !knownIds.has(item._id));
      state.messages = [...older, ...state.messages];
    },
    setMessagePagination: (state, action) => {
      state.messagesCursor = action.payload.nextCursor ?? null;
      state.hasMoreMessages = Boolean(action.payload.hasMore);
    },
    setLoadingOlderMessages: (state, action) => {
      state.loadingOlderMessages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setArtifacts: (state, action) => {
      state.artifacts = action.payload;
    },
    clearArtifacts: (state) => {
      state.artifacts = [];
    },
  },
});

export const {
  setMessages,
  prependMessages,
  setMessagePagination,
  setLoadingOlderMessages,
  addMessage,
  setArtifacts,
  clearArtifacts,
} = messageSlice.actions;
export default messageSlice.reducer;
