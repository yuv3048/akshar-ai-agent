import { Code2, FileText, Globe2, ImageIcon, LoaderCircle, Presentation, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import MessageBubble from "./MessageBubble";

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
  const { messages } = useSelector((state) => state.message);
  const isEmpty = !selectedConversation || messages.length === 0;
  const [visibleSuggestions, setVisibleSuggestions] = useState(() => getRandomSuggestions());
  const [isHoveringSuggestions, setIsHoveringSuggestions] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(() => loadingMessages[Math.floor(Math.random() * loadingMessages.length)]);
  const messageAreaRef = useRef(null);

  useEffect(() => {
    const messageArea = messageAreaRef.current;
    if (!messageArea) return;

    messageArea.scrollTo({
      top: messageArea.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, isGenerating]);

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
    <div ref={messageAreaRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-8 [scrollbar-width:thin] [scrollbar-color:#27272a_transparent]">
      {isEmpty ? (
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center py-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.06] px-3 py-1.5 font-doto text-[11px] font-bold tracking-widest text-orange-300">
            <Sparkles size={13} />
            YOUR AI WORKSPACE
          </div>
          <h1 className="font-vt323 text-6xl font-normal tracking-wide text-white sm:text-7xl">
            Think it. <span className="bg-linear-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Build it.</span>
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
                className={`group min-w-0 flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-500/30 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 ${index === 2 ? "hidden sm:block" : ""}`}
              >
                <span className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition-colors group-hover:border-orange-500/20 group-hover:bg-orange-500/10 group-hover:text-orange-300">
                  <Icon size={17} />
                </span>
                <span className="block text-sm font-medium text-slate-100">{label}</span>
                <span className="mt-1.5 block text-xs leading-5 text-slate-500">{detail}</span>
              </button>
            ))}
          </div>
          <p className="mt-7 text-[11px] text-slate-600">Choose a starting point or ask your own question below.</p>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-5xl space-y-6 pb-4">
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
              className="my-3 flex items-center gap-3 rounded-2xl border border-orange-500/15 bg-white/[0.025] px-4 py-3 text-sm text-slate-300"
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-300">
                <LoaderCircle size={17} className="animate-spin" />
                <span className="absolute inset-0 rounded-xl bg-orange-500/10 blur-md" />
              </span>
              <span key={loadingMessage} className="animate-pulse transition-opacity duration-300">
                {loadingMessage}
              </span>
              <span className="ml-auto flex items-center gap-1" aria-hidden="true">
                <span className="h-1 w-1 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.2s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-orange-400 [animation-delay:-0.1s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-red-500" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MessageList;
