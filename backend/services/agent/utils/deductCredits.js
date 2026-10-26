import axios from "axios";

export const deductCredits = async (userId, agent) => {
  if (!userId || !agent) {
    throw new Error("userId and agent are required to deduct credits");
  }

  const authServiceUrl = process.env.AUTH_SERVICE_URL?.replace(/\/+$/, "");
  if (!authServiceUrl) {
    throw new Error("AUTH_SERVICE_URL is not configured");
  }

  try {
    const { data } = await axios.post(
      `${authServiceUrl}/deduct-credits`,
      { userId, agent },
      { timeout: 10000 }
    );

    if (!data?.success || typeof data.credits !== "number") {
      throw new Error("Auth service did not confirm credit deduction");
    }

    return data;
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unknown credit deduction error";
    throw new Error(`Credit deduction failed for ${agent}: ${message}`, {
      cause: error,
    });
  }
};
