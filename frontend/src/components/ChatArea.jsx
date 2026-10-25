import { useEffect } from "react"
import ChatInput from "./ChatInput"
import MessageList from "./MessageList"
import Nav from "./Nav"
import { useDispatch, useSelector } from "react-redux"
import getMessages from '../features/getMessages'
import { setArtifacts, setMessages } from '../redux/messageSlice'

function ChatArea({ onOpenSidebar = () => {} }) {

  const { selectedConversation } = useSelector(state=>state.conversation)

  const dispatch = useDispatch()

  useEffect(()=>{
    const getMesg = async ()=>{

      if(selectedConversation){
        if(selectedConversation.title=="New Chat") return;
        const data = await getMessages(selectedConversation?._id)
        dispatch(setMessages(data))

        const latestArtifactMessage = [...data].reverse().find(msg => msg.artifacts && msg.artifacts.length > 0)

        dispatch(setArtifacts(latestArtifactMessage?.artifacts ?? []))
      }
    }

    getMesg()
  },[selectedConversation?._id])

  return (
    <div className='flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
        <Nav onOpenSidebar={onOpenSidebar} />
        <MessageList />
        <ChatInput/>
    </div>
  )
}

export default ChatArea