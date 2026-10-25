import {
  BadgeDollarSign,
  CircleUserRound,
  LogOut,
  MessageSquarePlus,
  MessageSquareText,
  PanelLeftDashed,
  PanelRightDashed,
  SquarePen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getConversations } from "../features/getConversations";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setConversations,
  setSelectedConversation,
} from "../redux/conversationSlice";
import { createConversation } from "../features/createConversation";
import logOut from "../features/logOut.js";
import { setUserdata } from "../redux/userSlice.js";

function SideBar({ mobileOpen = false, onClose = () => {} }) {
  const [collapsed, setCollapsed] = useState(false);
  const [imageError, setImageError] = useState(false);

  const dispatch = useDispatch();

  const { conversations, selectedConversation } = useSelector(
    (state) => state.conversation,
  );
  const { userData } = useSelector((state) => state.user);

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

  
  const handleCreateConversation = async () => {
    try {
      const conversation = await createConversation();
    
      if (!conversation?._id) {
        throw new Error("Invalid conversation response");
      }
    
      dispatch(addConversation(conversation));
      dispatch(setSelectedConversation(conversation));
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  if (collapsed) {
    return (
      <div
        className="hidden lg:flex flex-col items-center w-[56px] h-screen bg-[#050505]
      border-r border-white/[0.06] py-4 gap-1 shrink-0"
      >
        <button
          className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500
          hover:text-slate-200 hover:bg-white/[0.05] transition-colors duration-150 bg-transparent
          border-none cursor-pointer mb-1
          "
          onClick={() => setCollapsed(false)}
        >
          <PanelRightDashed />
        </button>

        <button
          className="flex items-center justify-center w-9 h-9 rounded-xl text-slate-500
          hover:test-slate-200 hover:bg-white/[0.05] transitions-colors duration-150 bg-transparent
          border-none cursor-pointer mb-1
          "
          onClick={()=>dispatch(setSelectedConversation(null))}
        >
          <MessageSquarePlus size={21} />
        </button>

        <div className="mx-2.5 h-px bg-white/[0.06]" />

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 pb-2 [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden pt-5"
        >
          {conversations.map((conv, i) => {
            const isActive = selectedConversation?._id == conv?._id;
            return (
              <div
                key={conv._id}
                className={`flex items-center gap-2.5 cursor-pointer mb-0.5 px-3 py-2.5 font-inter rounded-[10px] border transition-colors duration-150 
                    ${
                      isActive
                        ? "bg-orange-500/10 border-red-500/[0.18]"
                        : "bg-transparent border-transparent"
                    }`}
                onClick={() => { dispatch(setSelectedConversation(conv)); onClose(); }}
              >
                <div
                  className={`flex items-center justify-center shrink-0 w-[20px] h-[20px]
                          rounded-lg transition-colors duration-150 ${
                            isActive
                              ? "bg-red-700/15 text-orange-600"
                              : "bg-white/[0.05] text-slate-500"
                          }`}
                >
                  <MessageSquareText size={15} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="relative shrink-0">
          {userData?.avatar && !imageError ? (
            <img
              src={userData?.avatar}
              alt={"image"}
              onError={() => setImageError(true)}
              className="w-9 h-9 rounded-[10px] object-cover border-2 border-orange-600/25"
            />
          ) : (
            <div className="flex justify-center items-center w-9 h-9 rounded-[10px] object-cover border-2 border-orange-600/25">
              <CircleUserRound size={15} className="text-slate-400" />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
    {mobileOpen && <button aria-label="Close sidebar" onClick={onClose} className="fixed inset-0 z-40 bg-black/60 lg:hidden" />}
    <div className={`${mobileOpen ? "flex" : "hidden lg:flex"} fixed lg:static inset-y-0 left-0 z-50 w-[270px] max-w-[85vw] h-dvh min-h-0 shrink-0 bg-[#050505] border-r border-white/[0.06]`}>

      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2.5 px-4 py-5 border-b border-white/[0.06]">
          <div
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg
            text-slate-500 hover:text-slate-200 hover:bg-white/[005]
            transition-colors duration-150 bg-transparent border-none cursor-pointer
            "
            onClick={() => setCollapsed(true)}
          >
            <PanelLeftDashed size={20} />
          </div>
          <span className="font-doto text-[20px] font-bold text-slate-300 flex-1">
            Akshar AI
          </span>
          <span
            className="text-[12px] font-medium font-inter text-green-600 bg-yellow-700/10 border border
              border-green-950/20 px-2 py-0.5 rounded-full tracking-wiee"
          >
            free
          </span>
          <button
            className="flex items-center justify-center w-7 rounded-lg text-slate-500 hover:text-slate-200
              hover:bg-white/[0.05] transition-colors duration-150 bg-transparent border-none cursor-pointer
              "
            onClick={()=>{ dispatch(setSelectedConversation(null)); onClose(); }}
          >
            <SquarePen size={15} />
          </button>
        </div>

        <div className="shrink-0 px-4 pt-4 pb-1">
          <button
            className="w-full flex items-center justify-center gap-2 text-sm font-medium text-white font-Inter
                bg-linear-to-br from-red-600 to-orange-700 rounded-4xl hover:from-orange-700 hover:to-red-600  
                                border border-red-950 py-[10px] cursor-pointer hover:shadow-[0_1px_8px_rgba(234,70,35,0.35)] 
                transition-opacity duration-150"
            onClick={()=>{ dispatch(setSelectedConversation(null)); onClose(); }}
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
          <div className="shrink-0 px-5 pt-4 pb-1.5 text-[10.5px] font-bold font-inter uppercase tracking-widest text-slate-600 ">
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
                onClick={() => { dispatch(setSelectedConversation(conv)); onClose(); }}
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

        <div className="mx-2.5 h-px bg-white/[0.06]" />

        <div className="shrink-0 px-3.5 py-3.5">
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
    </div>
    </>
  );
}

export default SideBar;
