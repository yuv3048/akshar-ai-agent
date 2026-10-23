import { Code2, FileText, Globe2, ImageIcon, Presentation, Sparkles } from "lucide-react";
import { useSelector } from "react-redux";
import MessageBubble from "./MessageBubble";

const suggestions = [
  { icon: Code2, label: "Build something", prompt: "Help me build a polished responsive website with HTML, CSS, and JavaScript.", detail: "Turn an idea into a working project", agent: "coding" },
  { icon: Globe2, label: "Explore a topic", prompt: "Explain how Redis works, with a practical example and when I should use it.", detail: "Learn with clear examples", agent: "search" },
  { icon: FileText, label: "Create a document", prompt: "Create a downloadable PDF document: a well-structured beginner-friendly guide to system design, with clear sections, examples, and a concise summary.", detail: "Generate a PDF document", agent: "pdf" },
  { icon: Presentation, label: "Create a presentation", prompt: "Create a PowerPoint presentation about system design for beginners, with a title slide, clear section slides, practical examples, and a conclusion.", detail: "Generate a PowerPoint presentation", agent: "ppt" },
  { icon: ImageIcon, label: "Create an image", prompt: "Create a high-quality image of a futuristic city at sunset, with cinematic lighting, detailed architecture, and a polished composition.", detail: "Generate an image from a prompt", agent: "vision" },
];

function MessageList({ onSuggestionSelect }) {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages } = useSelector((state) => state.message);
  const isEmpty = !selectedConversation || messages.length === 0;

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-8 [scrollbar-width:thin] [scrollbar-color:#27272a_transparent]">
      {isEmpty ? (
        <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center py-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/[0.06] px-3 py-1.5 text-[11px] font-medium tracking-wide text-orange-300">
            <Sparkles size={13} />
            YOUR AI WORKSPACE
          </div>
          <h1 className="font-space text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Think it. <span className="bg-linear-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">Build it.</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-6 text-slate-400 sm:text-base">
            Welcome to Akshar AI. Research ideas, solve problems, write code, or create something new.
          </p>

          <div className="mt-9 flex w-full max-w-full flex-nowrap gap-3 overflow-x-auto pb-3 text-left [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {suggestions.map(({ icon: Icon, label, prompt, detail, agent }) => (
              <button
                type="button"
                key={label}
                onClick={() => onSuggestionSelect?.({ prompt, agent })}
                className="group w-44 min-w-44 shrink-0 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/30 hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 sm:w-48 sm:min-w-48"
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
        </div>
      )}
    </div>
  );
}

export default MessageList;
