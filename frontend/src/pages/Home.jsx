import GoogleIcon from '@mui/icons-material/Google';

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
    <div className='h-screen flex bg-[#000000]  text-white overflow-hidden'>
   
      <SideBar/>
      <ChatArea/>
      <Artifact/>

      {!userData &&  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm'>
          <div className='w-[340px] bg-[#13151c] border border-white/[0.08] rounded-2xl p-7 flex flex-col gap-5'>
              <div className='flex flex-col gap-1'>
                 <h2 className='text-[17px] font-semibold text-slate-100 tracking-tight'>Welcome to Akshar AI</h2>
                 <p className='text-[13px] text-slate-500'>Please login to continue using the app.</p>
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