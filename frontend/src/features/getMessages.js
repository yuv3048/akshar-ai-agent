import api from "../../utils/axios";

const getMessages = async (conversationId, { cursor, limit = 20 } = {}) => {
  const params = { limit };
  if (cursor?.createdAt && cursor?.id) {
    params.beforeCreatedAt = cursor.createdAt;
    params.beforeId = cursor.id;
  }

  const response = await api.get(
    `/api/chat/get-messages/${conversationId}`,
    { params },
  );
  const data = response.data;
  return Array.isArray(data)
    ? { items: data, hasMore: false, nextCursor: null }
    : data;
};

export default getMessages;
