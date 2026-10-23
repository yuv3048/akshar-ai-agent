import { useEffect } from "react";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import Nav from "./Nav";
import { useDispatch, useSelector } from "react-redux";
import getMessages from "../features/getMessages";
import { setArtifacts, setMessages } from "../redux/messageSlice";

function ChatArea() {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages: currentMessages } = useSelector((state) => state.message);
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      const isCurrentDraft =
        selectedConversation?.title === "New Chat" &&
        currentMessages.some((message) => message.conversationId === selectedConversation?._id);

      if (isCurrentDraft) return;

      dispatch(setMessages([]));
      dispatch(setArtifacts([]));

      if (!selectedConversation?._id || selectedConversation.title === "New Chat") return;

      try {
        const data = await getMessages(selectedConversation._id);
        if (cancelled) return;

        const messages = Array.isArray(data) ? data : [];
        dispatch(setMessages(messages));

        const latestArtifactMessage = [...messages]
          .reverse()
          .find((message) => Array.isArray(message.artifacts) && message.artifacts.length > 0);

        dispatch(setArtifacts(latestArtifactMessage?.artifacts ?? []));
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load conversation messages:", error.response?.data || error.message);
          dispatch(setMessages([]));
          dispatch(setArtifacts([]));
        }
      }
    };

    loadMessages();
    return () => {
      cancelled = true;
    };
  }, [selectedConversation?._id, dispatch]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Nav />
      <MessageList />
      <ChatInput />
    </div>
  );
}

export default ChatArea;
