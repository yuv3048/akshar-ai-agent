import { Code2, FileText, Globe2, ImageIcon, MessageSquare, MicAudioLines, Paperclip, Presentation, Send, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import sendMessage from "../features/sendMessage.js";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, setArtifacts, setMessages } from "../redux/messageSlice";
import { createConversation } from "../features/createConversation.js";
import { addConversation, setConvTitle, setSelectedConversation } from "../redux/conversationSlice.js";

function ChatInput({ suggestedAction = null, onSuggestionConsumed, onSendingChange }) {
  const [value, setValue] = useState("");
  const lastHandledAction = useRef(null);
  const [selectedAgent, setSelectedAgent] = useState("Auto");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { selectedConversation } = useSelector((state) => state.conversation);
  const dispatch = useDispatch();

  const handleSendMessage = async (promptOverride, agentOverride) => {
    const prompt = (promptOverride ?? value).trim();
    if (!prompt || sending) return;

    setSending(true);
    onSendingChange?.(true);
    setErrorMessage("");

    try {
      let conversation = selectedConversation;

      // A null selection represents the New Chat screen. Create the conversation
      // only when its first message is actually sent.
      if (!conversation?._id) {
        conversation = await createConversation();
        dispatch(addConversation(conversation));
        dispatch(setSelectedConversation(conversation));
        dispatch(setMessages([]));
        dispatch(setArtifacts([]));
      }

      dispatch(addMessage({ role: "user", content: prompt, conversationId: conversation._id }));
      setValue("");

      const data = await sendMessage({
        prompt,
        conversationId: conversation._id,
        agent: (agentOverride || selectedAgent).toLowerCase(),
        generateTitle: conversation.title === "New Chat",
      });

      if (!data || typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error("Akshar AI did not return a response. Please try again.");
      }

      if (data.title && data.title !== "New Chat") {
        dispatch(setConvTitle({ conversationId: conversation._id, title: data.title }));
      }

      dispatch(setArtifacts(data.artifacts ?? []));
      dispatch(addMessage({
        role: "assistant",
        content: data.answer,
        conversationId: conversation._id,
        images: data.images ?? [],
        artifacts: data.artifacts ?? [],
      }));
    } catch (error) {
      console.error("Failed to send message:", error.response?.data || error.message || error);
      setErrorMessage(
        error.response?.data?.message ||
        error.message ||
        "Message failed to send. Please try again."
      );
    } finally {
      setSending(false);
      onSendingChange?.(false);
    }
  };

  useEffect(() => {
    if (!suggestedAction || lastHandledAction.current === suggestedAction) return;

    // Prevent React Strict Mode's development effect replay from sending twice.
    lastHandledAction.current = suggestedAction;
    const { prompt, agent } = suggestedAction;
    if (!prompt) return;

    setValue(prompt);
    const agentLabels = {
      coding: "Coding",
      search: "Search",
      pdf: "PDF",
      ppt: "PPT",
      vision: "Vision",
    };
    if (agentLabels[agent]) setSelectedAgent(agentLabels[agent]);

    onSuggestionConsumed?.();
  }, [suggestedAction, onSuggestionConsumed]);

  const agents = [
    { id: "auto", icon: Zap, label: "Auto" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
    { id: "coding", icon: Code2, label: "Coding" },
    { id: "pdf", icon: FileText, label: "PDF" },
    { id: "ppt", icon: Presentation, label: "PPT" },
    { id: "search", icon: Globe2, label: "Search" },
    { id: "vision", icon: ImageIcon, label: "Vision" },
  ];

  return (
    <div className="w-full shrink-0 bg-[#000000] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pb-4">
      <div className="mx-auto w-full max-w-4xl">
      <div className="group flex flex-col gap-2 rounded-2xl sm:gap-3 border border-white/[0.10] bg-[#0D0F14] px-3 pt-3 pb-3 shadow-[0_12px_45px_rgba(0,0,0,0.28)] transition-colors focus-within:border-orange-500/35 sm:px-4">


        <div className="flex w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label;
            const Icon = agent.icon;
            return (
              <button
                type="button"
                key={agent.id}
                disabled={sending}
                onClick={() => setSelectedAgent(agent.label)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-inter text-xs font-medium cursor-pointer border transition-all disabled:opacity-50 ${
                  isActive
                    ? "bg-linear-to-r from-orange-700 to-red-600 text-white border-transparent shadow-[0_1px_8px_rgba(234,70,35,0.35)] hover:shadow-[0_2px_14px_rgba(234,70,35,0.5)]"
                    : "bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07]"
                }`}
              >
                <Icon size={14} className={isActive ? "text-white" : "text-slate-500"} />
                {agent.label}
              </button>
            );
          })}
        </div>

        <textarea
          placeholder="Ask anything..."
          onChange={(event) => setValue(event.target.value)}
          value={value}
          disabled={sending}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSendMessage();
            }
          }}
          className="max-h-[18dvh] min-h-[44px] w-full resize-none overflow-y-auto bg-transparent text-[14px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
          rows={2}
        />


        {errorMessage && (
          <p role="alert" className="px-1 text-xs text-red-400">{errorMessage}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button type="button" aria-label="Attach file" className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] border border-transparent transition-all duration-150 bg-transparent cursor-pointer">
              <Paperclip size={18} />
            </button>
            <button type="button" aria-label="Voice input" className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-300 hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-150 bg-transparent cursor-pointer">
              <MicAudioLines size={18} />
            </button>
          </div>
          <button
            type="button"
            disabled={!value.trim() || sending}
            onClick={() => handleSendMessage()}
            className={`flex items-center justify-center w-10 h-10 rounded-xl border-none transition-all duration-150 ${
              value.trim() && !sending
                ? "bg-linear-to-br from-orange-500 to-red-600 hover:brightness-110 text-white shadow-[0_4px_18px_rgba(234,70,35,0.18)] cursor-pointer"
                : "bg-white/[0.05] text-slate-600 cursor-not-allowed"
            }`}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] font-inter text-slate-600">Akshar AI can make mistakes. Verify important information.</p>
      </div>
    </div>
  );
}

export default ChatInput;
