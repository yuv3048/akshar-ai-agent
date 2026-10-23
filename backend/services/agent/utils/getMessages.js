import axios from "axios";

export const getMessages = async (conversationId) => {
  try {
    const { data } = await axios.get(
      `${process.env.CHAT_SERVICE_URL}/get-messages/${conversationId}`
    );

    return data;
  } catch (error) {
    console.error(
      "Failed to fetch conversation messages:",
      error.response?.data || error.message || error
    );

    // This is a utility, not an Express route handler. Propagate the error
    // so the calling controller can send the HTTP response.
    throw error;
  }
};
