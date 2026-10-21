import axios from"axios";

export const getMessages = async(conversationId)=>{
    try{
        const {data} =  await axios.get(`${process.env.CHAT_SERVICE_URL}/get-messages/${conversationId}`)
        
        return data
        
    } catch (error) {
    console.error("Agent error:", error.response?.data || error);

    return res.status(500).json({
        message: "Agent request failed",
        error: error.response?.data || error.message
    });
    }
}