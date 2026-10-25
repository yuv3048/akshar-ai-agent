import { useSelector } from "react-redux"
import MessageBubble from "./MessageBubble"

function MessageList() {

  const { selectedConversation } = useSelector(state=>state.conversation)
  const {messages} = useSelector(state=>state.message)

  return (
    <div className='min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 md:px-6 space-y-5
      [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
        {!selectedConversation || messages.length === 0?(
          <div className="h-full flex flex-col items-center justify-center gap-4
             text-center">
            <div className="flex flex-col gap-1.5">
              <h1 className='text-2xl font-space font-semibold text-slate-200 tracking-wider'>Akshar AI</h1>
              <p className='text-xl font-space font-normal text-slate-300 tracking-tight'>How can I help you?</p>
              <p className='text-base font-inter max-w-[260px] font-light text-slate-400 leading-relaxed'>Ask me anything - code, ideas, explanations, or just a quick question.</p>
            </div>
            <div className='flex flex-wrap justify-center gap-2 mt-1'>
              {["Write a Netflix clone", "Explain Redis", "Build a dashboard"].map((s)=>(
              <button className='text-[12px] font-inter text-slate-300 bg-white/[0.04] border border-white/[0.07] px-3
               py-1.5 rounded-lg hover:bg-white/[0.08] hover:text-slate-100 transition-colors duration-150
               cursor-pointer'>
                {s}
              </button>
              ))}
            </div>
          </div>
        )
          :
        (
          <div className='space-y-5'>
              {messages.map((msg, i)=>(
                  <div key={msg._id ?? i}>
                     <MessageBubble role={msg?.role} content={msg?.content} images={msg?.images || []}/>
                  </div>
              ))}
          </div>
        )}
    </div>
  )
}

export default MessageList