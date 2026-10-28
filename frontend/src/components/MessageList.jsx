import { Code2, FileText, Globe2, ImageIcon, Presentation, Sparkles } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import MessageBubble from "./MessageBubble";
import getMessages from "../features/getMessages";
import { useDispatch } from "react-redux";
import { prependMessages, setMessagePagination, setLoadingOlderMessages } from "../redux/messageSlice";

const loadingMessages = [
  "Hmm, let me think this through…",
  "🐙 Fun fact: Octopuses have three hearts.",
  "🦈 Weird fact: Sharks existed before trees.",

  "Putting the pieces together for you…",
  "🪐 Fun fact: A day on Venus is longer than its year.",
  "🍌 Weird fact: Bananas are berries, but strawberries aren't.",

  "Let me dig a little deeper…",
  "🧠 Fun fact: Your brain has roughly 86 billion neurons.",
  "👁️ Weird fact: Wombats produce cube-shaped poop.",

  "I'm connecting the dots…",
  "🌌 Fun fact: Light from the Sun takes about 8 minutes to reach Earth.",
  "🐌 Weird fact: Some snails can sleep for years under harsh conditions.",

  "Let me make sure this makes sense…",
  "⚡ Fun fact: Lightning can heat the surrounding air hotter than the Sun's surface.",
];

const suggestions = [
  { icon: Code2, label: "Build a website", prompt: "Create a beautiful food delivery website homepage using HTML, CSS, and JavaScript, with an attractive layout, high-quality food images, and stylish restaurant cards.", detail: "Create a food delivery experience", agent: "coding" },
  { icon: Globe2, label: "Explore fashion trends", prompt: "Research the latest 2026 fashion trends for men and women in India, covering outfits, colors, footwear, streetwear, ethnic fusion, and affordable styling tips. Include reliable sources.", detail: "Discover what is trending in India", agent: "search" },
  { icon: FileText, label: "Create a PDF", prompt: "Create a well-structured PDF guide to India, covering its history, culture, states, cuisine, famous destinations, and travel tips.", detail: "Generate a guide to India", agent: "pdf" },
  { icon: Presentation, label: "Create a presentation", prompt: "Create a polished PowerPoint about pet dogs, covering popular breeds, care, nutrition, training, and fun facts, with engaging visuals.", detail: "Make a presentation about pet dogs", agent: "ppt" },
  { icon: ImageIcon, label: "Create an image", prompt: "Create a cinematic, photorealistic image of golden retriever puppies playing in a sunny park, with detailed fur, natural lighting, and professional composition.", detail: "Create a polished AI image", agent: "vision" },
];

function getRandomSuggestions(previous = []) {
  const previousSet = new Set(
    previous.map((suggestion) => suggestions.findIndex(({ label }) => label === suggestion.label))
  );
  let currentSet;

  do {
    currentSet = new Set();

    while (currentSet.size < 3) {
      currentSet.add(Math.floor(Math.random() * suggestions.length));
    }
  } while ([...currentSet].every((index) => previousSet.has(index)));

  return [...currentSet].map((index) => suggestions[index]);
}

function MessageList({ onSuggestionSelect, isGenerating = false }) {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages, messagesCursor, hasMoreMessages, loadingOlderMessages } = useSelector((state) => state.message);
  const dispatch = useDispatch();
  const isEmpty = !selectedConversation || messages.length === 0;
  const [visibleSuggestions, setVisibleSuggestions] = useState(() => getRandomSuggestions());
  const [isHoveringSuggestions, setIsHoveringSuggestions] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(() => loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
  const messageAreaRef = useRef(null);
  const pendingPrependRef = useRef(null);
  const previousCountRef = useRef(0);
  const previousConversationRef = useRef(null);
  const followBottomRef = useRef(true);
  const loadingOlderRef = useRef(false);

  const loadOlderMessages = useCallback(async () => {
    const conversationId = selectedConversation?._id;
    const area = messageAreaRef.current;
    if (!conversationId || !area || !hasMoreMessages || !messagesCursor || loadingOlderRef.current) return;

    loadingOlderRef.current = true;
    dispatch(setLoadingOlderMessages(true));
    pendingPrependRef.current = { scrollHeight: area.scrollHeight, scrollTop: area.scrollTop };

    try {
      const page = await getMessages(conversationId, { cursor: messagesCursor, limit: 20 });
      if (selectedConversation?._id !== conversationId) {
        pendingPrependRef.current = null;
        return;
      }
      dispatch(prependMessages(Array.isArray(page?.items) ? page.items : []));
      dispatch(setMessagePagination(page));
      if (!page?.items?.length) pendingPrependRef.current = null;
    } catch (error) {
      pendingPrependRef.current = null;
      console.error("Failed to load older messages:", error.response?.data || error.message);
    } finally {
      loadingOlderRef.current = false;
      dispatch(setLoadingOlderMessages(false));
    }
  }, [selectedConversation?._id, hasMoreMessages, messagesCursor, dispatch]);

  useLayoutEffect(() => {
    const area = messageAreaRef.current;
    if (!area) return;

    if (pendingPrependRef.current) {
      const previous = pendingPrependRef.current;
      area.scrollTop = previous.scrollTop + (area.scrollHeight - previous.scrollHeight);
      pendingPrependRef.current = null;
    } else {
      const conversationChanged = previousConversationRef.current !== selectedConversation?._id;
      const addedMessage = messages.length > previousCountRef.current;
      const newestMessage = messages[messages.length - 1];
      const shouldFollow = conversationChanged ||
        (addedMessage && (newestMessage?.role === "user" || followBottomRef.current)) ||
        (!addedMessage && followBottomRef.current && isGenerating);
      if (shouldFollow) area.scrollTop = area.scrollHeight;
    }

    previousConversationRef.current = selectedConversation?._id;
    previousCountRef.current = messages.length;
  }, [messages, isGenerating, selectedConversation?._id]);

  const handleScroll = useCallback(() => {
    const area = messageAreaRef.current;
    if (!area) return;
    const distanceFromBottom = area.scrollHeight - area.clientHeight - area.scrollTop;
    followBottomRef.current = distanceFromBottom < 100;
    if (area.scrollTop < 80 && hasMoreMessages && !loadingOlderRef.current) loadOlderMessages();
  }, [hasMoreMessages, loadOlderMessages]);

  useEffect(() => {
    if (!isGenerating) return;

    let previousIndex = loadingMessages.indexOf(loadingMessage);
    const intervalId = setInterval(() => {
      const availableIndices = loadingMessages
        .map((_, index) => index)
        .filter((index) => index !== previousIndex);
      const nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      previousIndex = nextIndex;
      setLoadingMessage(loadingMessages[nextIndex]);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isGenerating]);

  useEffect(() => {
    if (isHoveringSuggestions) return;

    const intervalId = setInterval(() => {
      setVisibleSuggestions((current) => getRandomSuggestions(current));
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isHoveringSuggestions]);

  return (
    <div ref={messageAreaRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto px-3 sm:px-6 sm:py-8 [scrollbar-width:thin] [scrollbar-color:#27272a_transparent]">
      {isEmpty ? (
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center py-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.06] px-3 py-1.5 font-vt323 text-[11px] font-normal tracking-widest text-orange-300">
            <Sparkles size={13} />
            YOUR AI WORKSPACE
          </div>
          <h1 className="flex flex-col font-doto text-5xl font-extrabold tracking-wide text-white sm:text-7xl">
            Think it <span className="bg-linear-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Build it</span>
          </h1>
          <p className="mt-4 max-w-lg font-space text-sm leading-6 text-slate-400 sm:text-base">
            Welcome to Akshar AI. Research ideas, solve problems, write code, or create something new.
          </p>

          <div
            className="mt-9 flex w-full max-w-full flex-nowrap gap-3 text-left"
            onMouseEnter={() => setIsHoveringSuggestions(true)}
            onMouseLeave={() => setIsHoveringSuggestions(false)}
          >
            {visibleSuggestions.map(({ icon: Icon, label, prompt, detail, agent }, index) => (
              <button
                type="button"
                key={label}
                onClick={() => onSuggestionSelect?.({ prompt, agent })}
                className={`group min-w-0 flex-1 rounded-4xl border border-orange-600/20 p-5 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 cursor-pointer  ${index === 2 ? "hidden sm:block" : ""}`}
              >
                <span className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl text-orange-300 border border-white/[0.08] bg-white/[0.04] transition-colors group-hover:border-orange-500/20 group-hover:bg-orange-500/10 group-hover:text-orange-300">
                  <Icon size={17} />
                </span>
                <span className="block text-sm font-medium text-slate-200">{label}</span>
                <span className="mt-1.5 block text-xs leading-5 text-slate-500">{detail}</span>
              </button>
            ))}
          </div>
          <p className="mt-7 text-[11px] text-slate-600">Choose a starting point or ask your own question below.</p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-4">
          {loadingOlderMessages && <div className="py-2 text-center text-xs text-slate-500" role="status">Loading earlier messages…</div>}
          {messages.map((msg, i) => (
            <div key={msg._id ?? i}>
              <MessageBubble
                role={msg?.role}
                content={msg?.content}
                images={msg?.images || []}
                assetPreviewUrl={msg?.artifacts?.previewUrl}
                assetDownloadUrl={msg?.artifacts?.downloadUrl}
              />
            </div>
          ))}
          {isGenerating && (
            <div
              role="status"
              aria-live="polite"
              className="my-3 flex items-center gap-3 px-1 py-2 text-sm text-white"
            >
              <span key={loadingMessage} className="animate-pulse transition-opacity duration-300">
                {loadingMessage}
              </span>
              <span className="ml-auto flex items-center gap-1" aria-hidden="true">
                <span className="h-1 w-1 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.2s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-orange-600 [animation-delay:-0.1s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-red-700" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageList;
