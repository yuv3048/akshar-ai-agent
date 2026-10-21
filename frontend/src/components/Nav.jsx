import { useSelector } from "react-redux"
import { BotMessageSquare } from "lucide-react"

function Nav() {
  const { selectedConversation } = useSelector(state => state.conversation)
  const { messages } = useSelector(state => state.message)

  if (!selectedConversation) return null

  return (
    <div className="h-14 flex items-center px-5 border-b gap-2.5 border-white/[0.06] bg-[#000000] shrink-0">

      <div className="flex items-center justify-center w-8 h-7 rounded-lg bg-orange-600/10 border border-red-700/20 shrink-0">
        <BotMessageSquare size={18} className="text-orange-600" />
      </div>

      <span className="font-space font-semibold text-sm tracking-wide text-slate-100 min-w-0 flex-1 truncate">
        {selectedConversation.title || "New Chat"}
      </span>

      <div className="text-[11px] font-inter font-medium text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full tracking-tight whitespace-nowrap shrink-0">
        {messages?.length ?? 0} Messages
      </div>

    </div>
  )
}

export default Nav
