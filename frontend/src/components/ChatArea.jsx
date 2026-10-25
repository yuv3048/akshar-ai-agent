import { useCallback, useEffect, useState } from "react";
import ChatInput from "./ChatInput";
import MessageList from "./MessageList";
import Nav from "./Nav";
import { useDispatch, useSelector } from "react-redux";
import getMessages from "../features/getMessages";
import { setArtifacts, setMessages } from "../redux/messageSlice";

function ChatArea({ onOpenSidebar }) {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const dispatch = useDispatch();
  const [suggestedAction, setSuggestedAction] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const clearSuggestedAction = useCallback(() => setSuggestedAction(null), []);

  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      if (!selectedConversation?._id) {
        dispatch(setMessages([]));
        dispatch(setArtifacts([]));
        return;
      }

      // Sidebar selection clears state before switching to a draft conversation.
      // Preserve an optimistic first message while the new chat is running.
      if (selectedConversation.title === "New Chat") return;

      dispatch(setMessages([]));
      dispatch(setArtifacts([]));

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
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <Nav onOpenSidebar={onOpenSidebar} />
      <MessageList onSuggestionSelect={setSuggestedAction} isGenerating={isGenerating} />
      <ChatInput
        suggestedAction={suggestedAction}
        onSuggestionConsumed={clearSuggestedAction}
        onSendingChange={setIsGenerating}
      />
    </div>
  );
}

export default ChatArea;
