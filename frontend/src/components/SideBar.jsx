import {
  BadgeDollarSign,
  CircleUserRound,
  LogOut,
  MessageSquarePlus,
  MessageSquareText,
  PanelLeft,
  PanelRight,
  Slash,

} from "lucide-react";
import { useEffect, useState } from "react";
import { getConversations } from "../features/getConversations";
import { createConversation } from "../features/createConversation.js";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setConversations,
  setSelectedConversation,
} from "../redux/conversationSlice";
import logOut from "../features/logOut.js";
import { setUserdata } from "../redux/userSlice.js";
import { setArtifacts, setMessages } from "../redux/messageSlice";
import BillingDrawer from "./BillingDrawer.jsx";

function SideBar({ mobileOpen = false, onClose = () => {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [showBilling, setShowBilling] = useState(false)

  const dispatch = useDispatch();

  const { conversations, selectedConversation } = useSelector(
    (state) => state.conversation,
  );
  const { userData } = useSelector((state) => state.user);

  const handleNewChat = async () => {
    if (creatingConversation) return;

    setCreatingConversation(true);
    try {
      const conversation = await createConversation();
      dispatch(addConversation(conversation));
      dispatch(setMessages([]));
      dispatch(setArtifacts([]));
      dispatch(setSelectedConversation(conversation));
    } catch (error) {
      console.error("Failed to create new chat:", error.response?.data || error.message);
    } finally {
      setCreatingConversation(false);
    }
  };

  useEffect(() => {
  let cancelled = false;

  const getConv = async () => {
      if (!userData) {
        dispatch(setConversations([]));
        return;
      }

      try {
        const data = await getConversations();

        if (!cancelled) {
          dispatch(setConversations(data ?? []));
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to fetch conversations:", error);
        }
      }
    };

    getConv();

    return () => {
      cancelled = true;
    };
  }, [userData?._id, dispatch]);

  

  return (
    <>
      <aside className={`hidden h-dvh min-h-0 w-14 shrink-0 flex-col items-center gap-2 border-r border-white/[0.06] bg-[#050505] py-4 lg:flex ${collapsed ? "" : "lg:hidden"}`}>
        <button
          type="button"
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-orange-300"
          onClick={() => setCollapsed(false)}
        >
          <PanelRight size={19} />
        </button>
        <button
          type="button"
          aria-label="New chat"
          title="New chat"
          disabled={creatingConversation}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-orange-500/10 hover:text-orange-300 disabled:opacity-50"
          onClick={handleNewChat}
        >
          <MessageSquarePlus size={19} />
        </button>
      </aside>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 h-dvh min-h-0 w-[270px] max-w-[85vw] shrink-0 overflow-hidden border-r border-white/[0.06] bg-[#050505] transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:hidden" : "lg:static lg:translate-x-0"}`}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 py-5 border-b border-white/[0.06]">
           <img
              src="./akshar-logo.svg"
              alt="Akshar AI"
              className="w-8 h-8 scale-160"
            />
            <span className='font-space font-bold text-[16px] text-slate-500'>/</span>
            <span className="font-doto text-[20px] font-bold text-slate-300 flex-1">
               Akshar AI
            </span>
          <button
            type="button"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-orange-300"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeft size={19} />
          </button>
          <button
            type="button"
            aria-label="Close sidebar"
            title="Close sidebar"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-slate-200 lg:hidden"
            onClick={onClose}
          >
            <PanelLeft size={19} />
          </button>
        </div>

        <div className="shrink-0 px-4 pt-4 pb-1">
          <button
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white font-Inter
                bg-linear-to-br from-red-600 to-orange-700 rounded-4xl hover:from-orange-700 hover:to-red-600  
                                border border-red-950 py-[10px] cursor-pointer hover:shadow-[0_1px_8px_rgba(234,70,35,0.35)] 
                transition-opacity duration-150"
            onClick={async () => { await handleNewChat(); onClose?.(); }}
            disabled={creatingConversation}
          >
            <MessageSquarePlus size={20} />
            New Chat
          </button>
        </div>

        {conversations.length == 0 ? (
          <div className="shrink-0 px-5 pt-4 pb-1.5 text-[10.5px] font-bold font-inter uppercase tracking-widest text-slate-600 ">
            No Recent Conversations
          </div>
        ) : (
          <div className="px-5 pt-4 pb-1.5 text-[10.5px] font-bold font-inter uppercase tracking-widest text-slate-600 ">
            Recents
          </div>
        )}

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2 [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden"
        >
          {conversations.map((conv, i) => {
            const isActive = selectedConversation?._id == conv?._id;
            return (
              <div
                key={conv._id}
                className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 font-inter border transition-colors duration-150 
                    ${
                      isActive
                        ? "bg-orange-500/10 border-red-500/[0.18] rounded-r-lg border-l-2 border-l-orange-600"
                        : "bg-transparent border-transparent"
                    }`}
                onClick={() => { dispatch(setMessages([])); dispatch(setArtifacts([])); dispatch(setSelectedConversation(conv)); onClose?.(); }}
              >
                <div
                  className={`flex items-center justify-center shrink-0 w-[28px] h-[28px]
                          rounded-lg transition-colors duration-150 ${
                            isActive
                              ? "bg-red-700/15 text-orange-600 "
                              : "bg-white/[0.05] text-slate-500"
                          }`}
                >
                  <MessageSquareText size={15} />
                </div>
                <span
                  className={`text-[13px] font-medium truncate ${
                    isActive ? "text-slate-100" : "text-slate-300"
                  }`}
                >
                  {conv?.title || "New Chat"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mx-2.5 h-px shrink-0 bg-white/[0.06]" />

        <div className="shrink-0 px-3.5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          {userData ? (
            <div
              className="flex items-center gap-2.5 cursor-pointer rounded-xl
                    px-3 py-2.5 hover:bg-white/[0.05] transition-colors duration-150"
            >
              <div className="relative shrink-0">
                {userData?.avatar && !imageError ? (
                  <img
                    src={userData?.avatar}
                    alt={"image"}
                    onError={() => setImageError(true)}
                    className="w-9 h-9 rounded-[10px] object-cover border-2 border-orange-600/25"
                  />
                ) : (
                  <div className="w-9 h-9 flex items-center justify-center rounded-[10px] border-2 border-orange-600/25">
                    <CircleUserRound size={20} className="text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-semibold font-inter text-slate-100 truncate">
                  {userData?.name || "user"}
                </p>
                <p className="text-[11px] font-inter text-slate-600 mt-px">
                  {"Free Plan"}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={()=>setShowBilling(true)}
                  className="flex items-center justify-center w-7 h-7 rounded-[7px]
                        border-none bg-transparent text-yellow-600 cursor-pointer hover:bg-white/[0.08]
                        hover:text-slate-400 transition-all duration-150"
                >
                  <BadgeDollarSign size={16} />
                </button>
                <button
                  className="flex items-center justify-center w-7 h-7 rounded-[7px]
                          border-none bg-transparent text-red-600 cursor-pointer hover:bg-white/[0.08]
                        hover:text-slate-400 transition-all duration-150
                        "
                  onClick={() => {
                    logOut();
                    dispatch(setUserdata(null));
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-200 bg-white/[0.05]
                   border border-white/[0.08] rounded-xl py-[11px] cursor-pointer hover:bg-white/[0.08]
                   transition-colors duration-150"
            >
              Login
            </button>
          )}
        </div>
      </div>
      </aside>
          
          <BillingDrawer
            open={showBilling}
            onClose={()=>setShowBilling(false)}
          />
    </>
  );
}

export default SideBar;
