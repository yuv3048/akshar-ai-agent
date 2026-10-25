import { useSelector } from "react-redux"
import { PanelLeft } from "lucide-react"

function Nav({ onOpenSidebar }) {
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages } = useSelector(state => state.message)


  return (
    <div className="h-14 flex items-center px-3 sm:px-5 border-b gap-2.5 border-white/[0.06] bg-[#000000] shrink-0">
      <button
        type="button"
        aria-label="Open sidebar"
        title="Open sidebar"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-slate-400 transition-colors hover:border-orange-500/25 hover:bg-orange-500/10 hover:text-orange-300 lg:hidden"
      >
        <PanelLeft size={18} />
      </button>


      <span className="flex items-center font-space font-bold text-sm tracking-wide text-slate-400 min-w-0 flex-1 truncate">
        <img
              src="/akshar-logo.svg"
              alt="Akshar AI"
              className="w-8 h-8 scale-150"
        />
         : {selectedConversation?.title || "Akshar AI"}
      </span>

      <div className="text-[11px] font-inter font-medium text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full tracking-tight whitespace-nowrap shrink-0">
        {messages?.length ?? 0} Messages
      </div>

    </div>
  )
}

export default Nav
