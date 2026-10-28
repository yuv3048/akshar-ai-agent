import {
  Code2,
  FileText,
  Globe2,
  ImageIcon,
  MessageSquare,
  AudioLines,
  MicOff,
  Paperclip,
  Presentation,
  Send,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import sendMessage from "../features/sendMessage.js";
import getCurrentUser from "../features/getCurrentUser.js";
import { setUserdata } from "../redux/userSlice.js";
import { useDispatch, useSelector } from "react-redux";
import { addMessage, setArtifacts, setMessages } from "../redux/messageSlice";
import { createConversation } from "../features/createConversation.js";
import {
  addConversation,
  setConvTitle,
  setSelectedConversation,
} from "../redux/conversationSlice.js";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function ChatInput({ suggestedAction = null, onSuggestionConsumed, onSendingChange }) {
  const [value, setValue] = useState("");
  const lastHandledAction = useRef(null);
  const [selectedAgent, setSelectedAgent] = useState("Auto");
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { selectedConversation } = useSelector((state) => state.conversation);
  const [selectedFile, setSelectedFile] = useState(null);
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef(null);
  const listeningRef = useRef(false);
  const speechBaseValueRef = useRef("");
  const fileRef = useRef(null);
  const dispatch = useDispatch();

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const supported =
      file.type === "application/pdf" || file.type.startsWith("image/");
    if (!supported) {
      setErrorMessage("Choose a PDF or an image file.");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage("Files must be 20 MB or smaller.");
      return;
    }

    setErrorMessage("");
    setSelectedFile(file);
  };

  const handleSendMessage = async (promptOverride, agentOverride) => {
    const prompt = (promptOverride ?? value).trim();
    if ((!prompt && !selectedFile) || sending) return;

    if (listeningRef.current) {
      recognitionRef.current?.stop();
      listeningRef.current = false;
      setListening(false);
    }

    const attachedFile = selectedFile;
    const finalPrompt =
      prompt ||
      (attachedFile?.type === "application/pdf"
        ? "Summarize this PDF and identify its key points."
        : "Describe this image and analyze its important details.");

    setSending(true);
    onSendingChange?.(true);
    setErrorMessage("");

    try {
      let conversation = selectedConversation;

      if (!conversation?._id) {
        conversation = await createConversation();
        dispatch(addConversation(conversation));
        dispatch(setSelectedConversation(conversation));
        dispatch(setMessages([]));
        dispatch(setArtifacts([]));
      }

      const visiblePrompt = attachedFile
        ? `${finalPrompt}\n\n_Attached: ${attachedFile.name}_`
        : finalPrompt;
      dispatch(
        addMessage({
          role: "user",
          content: visiblePrompt,
          conversationId: conversation._id,
        }),
      );
      setValue("");

      const data = await sendMessage({
        prompt: finalPrompt,
        conversationId: conversation._id,
        agent: (agentOverride || selectedAgent).toLowerCase(),
        generateTitle: conversation.title === "New Chat",
        file: attachedFile,
      });

      if (!data || typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error("Akshar AI did not return a response. Please try again.");
      }

      if (data.title && data.title !== "New Chat") {
        dispatch(
          setConvTitle({
            conversationId: conversation._id,
            title: data.title,
          }),
        );
      }

      dispatch(setArtifacts(data.artifacts ?? []));
      dispatch(
        addMessage({
          role: "assistant",
          content: data.answer,
          conversationId: conversation._id,
          images: data.images ?? [],
          artifacts: data.artifacts ?? [],
        }),
      );
      setSelectedFile(null);

      // A profile refresh failure must not hide a response that already succeeded.
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) dispatch(setUserdata(currentUser));
      } catch (refreshError) {
        console.warn("Could not refresh account credits:", refreshError.message);
      }
    } catch (error) {
      setValue((previous) => previous || prompt);
      console.error(
        "Failed to send message:",
        error.response?.data || error.message || error,
      );
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Message failed to send. Please try again.",
      );
    } finally {
      setSending(false);
      onSendingChange?.(false);
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      listeningRef.current = true;
      setListening(true);
      setErrorMessage("");
    };

    recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        speechBaseValueRef.current = `${speechBaseValueRef.current}${speechBaseValueRef.current ? " " : ""}${finalTranscript}`.trim();
      }

      const combined = [speechBaseValueRef.current, interimTranscript]
        .filter(Boolean)
        .join(" ")
        .trim();
      setValue(combined);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") return;

      const messages = {
        "not-allowed": "Microphone access is blocked. Allow microphone access in your browser settings.",
        "service-not-allowed": "Speech recognition is blocked by your browser.",
        "audio-capture": "No microphone was found. Check your microphone connection.",
        network: "Speech recognition needs a working network connection.",
      };
      setErrorMessage(
        messages[event.error] || "Voice input stopped. Please try again.",
      );
    };

    recognition.onend = () => {
      listeningRef.current = false;
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      listeningRef.current = false;
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const toggleMic = useCallback(() => {
    const recognition = recognitionRef.current;

    if (!speechSupported || !recognition) {
      setErrorMessage(
        "Voice input isn't supported in this browser. Try the latest Chrome or Edge.",
      );
      return;
    }

    if (listeningRef.current) {
      recognition.stop();
      listeningRef.current = false;
      setListening(false);
      return;
    }

    // Keep text already typed in the composer and append dictated words.
    speechBaseValueRef.current = value.trim();
    try {
      recognition.start();
    } catch (error) {
      console.warn("Could not start speech recognition:", error);
      setErrorMessage("Couldn't start the microphone. Please try again.");
    }
  }, [speechSupported, value]);

  useEffect(() => {
    if (!suggestedAction || lastHandledAction.current === suggestedAction) return;

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
    <div className="w-full shrink-0 bg-[#000000] px-3 pb-4 pt-2 sm:px-5">
      <div className="mx-auto w-full max-w-4xl">
        <div className="group flex flex-col gap-3 rounded-2xl border border-white/[0.10] bg-[#0D0F14] px-3 pb-3 pt-3 shadow-[0_12px_45px_rgba(0,0,0,0.28)] transition-colors focus-within:border-orange-500/35 sm:px-4">
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
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 py-2 font-inter text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isActive
                      ? "border-transparent bg-linear-to-r from-orange-700 to-red-600 text-white shadow-[0_1px_8px_rgba(234,70,35,0.25)]"
                      : "border-white/[0.06] bg-white/[0.03] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200"
                  }`}
                >
                  <Icon
                    size={14}
                    className={isActive ? "text-white" : "text-slate-500"}
                  />
                  {agent.label}
                </button>
              );
            })}
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-500/[0.06] px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-300">
                {selectedFile.type === "application/pdf" ? (
                  <FileText size={18} />
                ) : (
                  <ImageIcon size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-200">
                  {selectedFile.name}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">
                  {selectedFile.type === "application/pdf"
                    ? "PDF · Ready to analyze"
                    : "Image · Ready to analyze"}
                  {" · "}
                  {selectedFile.size < 1024 * 1024
                    ? `${Math.max(1, Math.round(selectedFile.size / 1024))} KB`
                    : `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove attachment"
                title="Remove attachment"
                disabled={sending}
                onClick={() => setSelectedFile(null)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <textarea
            placeholder={
              selectedFile?.type === "application/pdf"
                ? "Ask a question about this PDF..."
                : selectedFile
                  ? "Ask something about this image..."
                  : listening
                    ? "Listening… speak now"
                    : "Ask anything..."
            }
            onChange={(event) => {
              setValue(event.target.value);
              if (!listeningRef.current) {
                speechBaseValueRef.current = event.target.value;
              }
            }}
            value={value}
            disabled={sending}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            className="w-full resize-none bg-transparent text-[14px] leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden disabled:opacity-50"
            rows={2}
          />

          {errorMessage && (
            <p role="alert" className="px-1 text-xs text-red-400">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <input
                type="file"
                accept=".pdf,application/pdf,image/*"
                hidden
                ref={fileRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                aria-label="Attach PDF or image"
                title="Attach PDF or image"
                disabled={sending}
                onClick={() => fileRef.current?.click()}
                className="flex h-9 max-w-[190px] cursor-pointer items-center gap-2 rounded-xl border border-transparent bg-transparent px-2 text-slate-400 transition-all hover:bg-white/[0.06] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Paperclip size={18} className="shrink-0" />
                <span className="truncate text-[10px] text-slate-500">
                  PDF or image · Max 20 MB
                </span>
              </button>

              <button
                type="button"
                aria-label={
                  listening ? "Stop voice input" : "Start voice input"
                }
                title={
                  !speechSupported
                    ? "Voice input isn't supported in this browser"
                    : listening
                      ? "Stop voice input"
                      : "Start voice input"
                }
                disabled={sending || !speechSupported}
                onClick={toggleMic}
                className={`ml-1 flex cursor-pointer items-center gap-1.5 bg-transparent px-1 text-xs disabled:cursor-not-allowed disabled:opacity-40 ${
                  listening ? "text-orange-600" : "text-slate-500"
                }`}
              >
                {listening ? <AudioLines size={18} /> : <MicOff size={18} />}
                <span>{listening ? "Listening" : "Mic off"}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={(!value.trim() && !selectedFile) || sending}
              onClick={() => handleSendMessage()}
              aria-label={sending ? "Sending message" : "Send message"}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-none transition-all duration-150 ${
                (value.trim() || selectedFile) && !sending
                  ? "cursor-pointer bg-linear-to-br from-orange-500 to-red-600 text-white shadow-[0_4px_18px_rgba(234,70,35,0.18)] hover:brightness-110"
                  : "cursor-not-allowed bg-white/[0.05] text-slate-600"
              }`}
            >
              {sending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Send size={19} />
              )}
            </button>
          </div>
        </div>
        <p className="mt-2 text-center font-inter text-[10px] text-slate-600">
          Akshar AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}

export default ChatInput;
