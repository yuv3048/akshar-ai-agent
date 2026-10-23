import api from "../../utils/axios";

export const createConversation = async () => {
  const { data } = await api.get("/api/chat/create-conversation");
  if (!data?._id) throw new Error("Invalid conversation response");
  return data;
};
