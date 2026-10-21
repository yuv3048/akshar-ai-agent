import { Code2, FileText, Globe2, ImageIcon, MessageSquare, MicAudioLines, Paperclip, Presentation, Send, Zap } from "lucide-react"
import { useState } from "react"
import sendMessage from '../features/sendMessage.js'
import { useDispatch, useSelector } from "react-redux"
import { addMessage, setArtifacts } from '../redux/messageSlice'
import { createConversation } from '../features/createConversation.js'
import { addConversation, setConvTitle, setSelectedConversation } from '../redux/conversationSlice.js'
import { updateConversation } from "../features/updateConversation.js"

function ChatInput() {

  const [value, setValue] = useState("");

  const [selectedAgent, setSelectedAgent] = useState("Auto");
  
  const { selectedConversation } = useSelector(state=>state.conversation);

  const dispatch = useDispatch();

  const handleSendMessage = async () => {
  const prompt = value.trim();

  if (!prompt) return;

  try {
    let conversation = selectedConversation;

    if (!conversation) {
      conversation = await createConversation();

      dispatch(setSelectedConversation(conversation));
      dispatch(addConversation(conversation));
    }

    if (conversation.title === "New Chat") {
      const title = prompt.slice(0, 40);

      await updateConversation({
        id: conversation._id,
        title,
      });

      dispatch(
        setConvTitle({
          conversationId: conversation._id,
          title,
        })
      );
    }

    const payload = {
      prompt,
      conversationId: conversation._id,
      agent: selectedAgent.toLowerCase(),
    };

    dispatch(
      addMessage({
        role: "user",
        content: prompt,
      })
    );

    setValue("");

    const data = await sendMessage(payload);

    dispatch(setArtifacts(data?.artifacts ?? []));

    dispatch(
      addMessage({
        role: "assistant",
        content: data?.answer ?? "",
        images: data?.images ?? [],
      })
    );
  } catch (error) {
    console.error("Failed to send message:", error);
  }
  };

  const agents = [
    {
      id:"auto",
      icon:Zap,
      label:"Auto"
    },
    {
      id:"chat",
      icon:MessageSquare,
      label:"Chat"
    },
    {
      id:"coding",
      icon:Code2,
      label:"Coding"
    },
    {
      id:"pdf",
      icon:FileText,
      label:"PDF"
    },
    {
      id:"ppt",
      icon:Presentation,
      label:"PPT"
    },
    {
      id:"search",
      icon:Globe2,
      label:"Search"
    },
    {
      id:"image",
      icon:ImageIcon,
      label:"Image"
    }
  ]

  return (
    <div className='w-full overflow-hidden px-3 md:px-5 py-4
      border-t border-white/[0.06] bg-[#000000]'>
      <div className='flex flex-col gap-2 bg-white/[0.03] border
        border-white/[0.07] rounded-2xl px-4 pt-3.5 pb-3'>

          <div className='flex w-[80%] gap-2 pr-2 flex-wrap'>
              {agents.map((agent)=>{
                  const isActive = selectedAgent === agent.label
                  const Icon = agent.icon
                  return(
                    <div onClick = {()=>setSelectedAgent(agent.label)}
                    className={`
                      flex-shrink-0
                      inline-flex
                      items-center
                      gap-1.5
                      px-3
                      py-2
                      rounded-full
                      font-inter
                      text-xs
                      font-medium
                      cursor-pointer
                      border
                      transition-all

                      ${
                        isActive?
                        "cursor-pointer bg-linear-to-r from-orange-700 to-red-600 text-white border-transparent shadow-[0_1px_8px_rgba(234,70,35,0.35)] hover:shadow-[0_2px_14px_rgba(234,70,35,0.5)]"
                        :"bg-white/[0.03] text-slate-400 border-white/[0.06] hover:bg-white/[0.07]"
                      }
                    `}>
                      <Icon size={14}
                        className={
                          isActive?
                            "text-white"
                            : "text-slate-500"
                        }
                      />
                      {agent.label}
                    </div>
                  )
              })}
          </div>

          <textarea 
          placeholder='Ask anything...' 
          onChange={(e)=>setValue(e.target.value)}
          value={value}
          className='w-full bg-transparent outline-none resize-none text-[14px]
           text-slate-200 placeholder:text-slate-600 leading-relaxed [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden disabled:opacity-50' 
          rows={3}/>
          <div className='flex items-center justify-between'>
            <div className='flex items-centr gap-1'>
              <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-300
                hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]
                transition-all duration-150 bg-transparent cursor-pointer'>
                  <Paperclip size={18}/>
              </button>
              <button className='flex items-center justify-center w-8 h-8 rounded-lg text-slate-300
                hover:text-slate-400 hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06]
                transition-all duration-150 bg-transparent cursor-pointer'>
                   <MicAudioLines size={18}/>
              </button>
            </div>
            <button disabled={!value} onClick={handleSendMessage} className={`flex items-center justify-center w-10 h-10 rounded-lg border-none cursor-pointer
              transition-all duration-150 ${value.trim()?'bg-linear-to-br from-orange-600 to-red-700 hover:opacity-90 text-white'
                :'bg-white/[0.05] text-slate-600 cursor-not-allowed'}`}>
                <Send size={20}/>
            </button>
          </div>
      </div>
    </div>
  )
}

export default ChatInput