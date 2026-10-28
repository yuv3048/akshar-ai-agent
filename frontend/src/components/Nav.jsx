import { useSelector } from "react-redux";
import { PanelLeft, MessageSquare } from "lucide-react";

function Nav({ onOpenSidebar }) {
  const { selectedConversation } = useSelector((state) => state.conversation);
  const { messages } = useSelector((state) => state.message);

  return (
    <header className="z-10 flex h-[62px] shrink-0 items-center gap-3 border-b border-white/[0.07] bg-[#050505]/95 px-3 backdrop-blur-xl sm:px-5">
      <button
        type="button"
        aria-label="Open sidebar"
        title="Open sidebar"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:border-orange-500/30 hover:bg-orange-500/[0.08] hover:text-orange-300 lg:hidden"
      >
        <PanelLeft size={18} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-600/10">
          <img src="./akshar-logo.svg" alt="" className="h-7 w-7 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-space text-[13px] font-semibold tracking-wide text-slate-100 sm:text-sm">
            {selectedConversation?.title || "Akshar AI"}
          </p>
          <p className="mt-0.5 text-[10px] tracking-wide text-slate-500">
            YOUR AI WORKSPACE
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-medium text-slate-400 sm:px-3 sm:text-[11px]">
        <MessageSquare size={13} className="text-orange-400" />
        <span>{messages?.length ?? 0}</span>
        <span className="hidden sm:inline">messages</span>
      </div>
    </header>
  );
}

export default Nav;
