import axios from "axios";

export const getMessages = async (conversationId, userId) => {
  try {
    const { data } = await axios.get(
      `${process.env.CHAT_SERVICE_URL}/get-messages/${conversationId}`,
      { headers: { "x-user-id": userId } }
    );

    return data;
  } catch (error) {
    console.error(
      "Failed to fetch conversation messages:",
      error.response?.data || error.message || error
    );
    throw error;
  }
};
