import GoogleIcon from '@mui/icons-material/Google';
import { useState } from 'react';

import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../utils/firebase';
import api from '../../utils/axios'
import { useDispatch, useSelector } from 'react-redux';
import { setUserdata } from '../redux/userSlice';
import SideBar from '../components/SideBar';
import ChatArea from '../components/ChatArea';
import Artifact from '../components/Artifact';


function Home() {

    const {userData} = useSelector(state=>state.user)
    const dispatch = useDispatch()
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

    const handleLogin = async (token) =>{
        try{
          
          const {data} = await api.post("/api/auth/login",{token});
          dispatch(setUserdata(data))
          console.log("Backend response:", data);
    
        }catch (error){
    
            throw new Error(`Failed to handle login: ${error}`)
        }
      }
    
      const googleLogin = async()=>{
        const data = await signInWithPopup(auth, googleProvider)
        const token = await data.user.getIdToken()

        await handleLogin(token)
       
      }

  return (
    <div className='relative flex h-[100dvh] overflow-hidden bg-[#030303] text-white selection:bg-orange-500/30'>
   
      <SideBar mobileOpen={mobileSidebarOpen} onMobileClose={() => setMobileSidebarOpen(false)} />
      <ChatArea onOpenSidebar={() => setMobileSidebarOpen(true)} />
      <Artifact/>

      {!userData &&  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md'>
          <div className='relative flex w-full max-w-[390px] flex-col gap-6 overflow-hidden rounded-3xl border border-white/[0.10] bg-[#0c0c0e] p-7 shadow-[0_28px_100px_rgba(0,0,0,0.65)] sm:p-8'>
              <div className='mb-1 flex flex-col gap-2'>\n                 <div className='mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/15 to-red-600/10'>\n                   <img src='./akshar-logo.svg' alt='' className='h-10 w-10 object-contain' />\n                 </div>
                 <h2 className='font-space text-xl font-semibold tracking-tight text-white'>Welcome to Akshar AI</h2>
                 <p className='text-sm leading-relaxed text-slate-400'>Please login to continue using the app.</p>
              </div>

              <button className='w-full 
                                flex items-center justify-center 
                                gap-3
                                py-[11px] 
                                rounded-xl 
                                text-sm 
                                font-medium 
                                text-white 
                                bg-linear-to-br 
                                from-red-700 to-orange-600
                                hover:from-orange-600 hover:to-red-700 
                                border border-red-950
                                cursor-pointer' onClick={googleLogin}>
                <GoogleIcon fontSize="small"/>
                Continue with Google
              </button>

          </div>
      </div>}
     
    </div>
  )
}

export default Home