import api from "../../utils/axios";

const getMessages = async (conversationId) => {
  const response = await api.get(`/api/chat/get-messages/${conversationId}`);

  return response.data;
};

export default getMessages;
