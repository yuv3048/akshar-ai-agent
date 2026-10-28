import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversation",
  initialState: {
    conversations: [],
    selectedConversation: null,
    conversationsCursor: null,
    hasMoreConversations: false,
    loadingMoreConversations: false,
  },
  reducers: {
    setConversations: (state, action) => {
      state.conversations = action.payload;
    },
    appendConversations: (state, action) => {
      const knownIds = new Set(state.conversations.map((item) => item._id));
      for (const item of action.payload) {
        if (!knownIds.has(item._id)) {
          state.conversations.push(item);
          knownIds.add(item._id);
        }
      }
    },
    setConversationPagination: (state, action) => {
      state.conversationsCursor = action.payload.nextCursor ?? null;
      state.hasMoreConversations = Boolean(action.payload.hasMore);
    },
    setLoadingMoreConversations: (state, action) => {
      state.loadingMoreConversations = action.payload;
    },
    addConversation: (state, action) => {
      state.conversations = [
        action.payload,
        ...state.conversations.filter((item) => item._id !== action.payload._id),
      ];
    },
    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },
    setConvTitle: (state, action) => {
      const { title, conversationId } = action.payload;
      state.conversations = state.conversations.map((conv) =>
        conv._id === conversationId ? { ...conv, title } : conv
      );
      if (state.selectedConversation?._id === conversationId) {
        state.selectedConversation = { ...state.selectedConversation, title };
      }
    },
  },
});

export const {
  setConversations,
  appendConversations,
  setConversationPagination,
  setLoadingMoreConversations,
  addConversation,
  setSelectedConversation,
  setConvTitle,
} = conversationSlice.actions;
export default conversationSlice.reducer;
