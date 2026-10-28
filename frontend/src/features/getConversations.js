import api from "../../utils/axios";

export const getConversations = async ({ cursor, limit = 4 } = {}) => {
  const params = { limit };
  if (cursor?.updatedAt && cursor?.id) {
    params.beforeUpdatedAt = cursor.updatedAt;
    params.beforeId = cursor.id;
  }

  const { data } = await api.get("/api/chat/get-conversation", { params });
  // Support the old array response while deployments update.
  return Array.isArray(data)
    ? { items: data, hasMore: false, nextCursor: null }
    : data;
};
