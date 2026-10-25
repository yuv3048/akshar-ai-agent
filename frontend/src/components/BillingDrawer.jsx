import {AnimatePresence, motion} from "motion/react"
import { Crown, Plus, Star, StarHalfIcon, X } from 'lucide-react'
import { useSelector } from 'react-redux'
import { createOrder } from "../features/createOrder"
import { verifyPayment } from "../features/verifyPayment"

function BillingDrawer({open, onClose}) {

    const { userData } = useSelector(state => state.user)

    const handleUpgrade = async(plan)=>{
        try{
            const data = await createOrder(plan)
            const options = {
                key:import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount:data?.order?.amount,
                currency:data?.order?.currency,
                name:"Akshar AI",
                description:`${data?.plan?.name} Plan`,
                order_id: data?.order?.id,
                handler: async (response)=>{
                    try{
                        const data = await verifyPayment(response)
                        console.log(data)

                        window.location.reload();
                    }catch(error){
                        console.log(error)
                    }
                },
                theme:{
                    color: "#E83813"
                }

            }
            const razorpay = new window.Razorpay(options)
            razorpay.open()
        }catch(error){
            console.log(error)
        }
    }
  return (
    <AnimatePresence>
        {open && 
        <>
            <motion.div
                initial = {{opacity: 0}}
                animate = {{opacity: .5}}
                exit = {{opacity: 0}}
                onClick = {onClose}
                className = "fixed inset-0 bg-black z-40"
            />
            <motion.div
                initial={{x: "100%" }}
                animate={{x:0}}
                exit={{x: "100%" }}
                transition={{ duration: .25 }}
                className="fixed right-0 top-0 z-50 h-screen w-[380px]
                bg-[#000000] border-l border-[#1F0F05] shadow-2xl flex flex-col"
                >
                    <div className='flex items-center justify-between p-5 border-b border-white/10'>
                        <div>
                            <div className='font-space text-white text-lg font-semibold'>
                                Billing
                            </div>
                            <div className='font-space text-slate-400 text-sm'>
                                Plans & Credits
                            </div>
                        </div>
                        <button onClick={onClose} className='w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-red-600/50'>
                            <X size={18} className="text-slate-300 "/>
                        </button>
                    </div>

                    <div className='p-5'>
                        <div className='rounded-xl bg-orange-600/[0.04] border border-white/10 p-4'>
                            <div className='flex justify-between items-center'>
                                <div>
                                    <p className='font-space text-slate-400 text-sm'>
                                        Current Plan
                                    </p>
                                    <h3 className='font-space text-orange-600 text-xl font-bold'>
                                        {userData?.plan || "free"}
                                    </h3>
                                </div>
                                <Crown className='text-yellow-500'/>
                            </div>

                            <div className='mt-5'>
                                <div className='flex justify-between font-space text-xs text-slate-400 mb-2'>
                                    <span>Credits</span>
                                    <span>{userData.credits || 0}/{userData.totalCredits || 100}</span>
                                </div>

                                <div className='h-2 rounded-full bg-white/10 overflow-hidden'>
                                    <div className='h-full bg-linear-to-r from-red-700 to-orange-600 transition-all duration-500'
                                        style={{
                                            width:`${(
                                                (userData?.credits || 0) /
                                                (userData?.totalCredits || 1)
                                            ) * 100
                                            }%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='px-5 flex-1 overflow-auto space-y-4'>
                        <div className='rounded-xl border border-white/10 p-4'>
                            <h3 className='flex items-center text-white font-semibold'>
                                <StarHalfIcon size={17} className='text-yellow-500 mr-2'/>Starter Plan
                            </h3>
                            <p className='text-orange-600 text-2xl font-bold mt-2'>₹199</p>
                            <p className='flex items-center text-slate-400 text-sm mt-1'><Plus size={13}/>500 Credits</p>
                            <button onClick={()=>handleUpgrade("starter")} className='mt-4 w-full rounded-lg bg-linear-to-br from-red-600 to-orange-700 shadow-[0_1px_8px_rgba(234,70,35,0.35)] hover:shadow-[0_2px_14px_rgba(234,70,35,0.5)] py-2 font-doto font-extrabold text-white'>Upgrade</button>
                        </div>

                        <div className='rounded-xl border border-white/10 p-4'>
                            <h3 className='flex items-center text-white font-semibold'><Star size={18} className='text-yellow-500 mr-2'/>Pro Plan</h3>
                            <p className='text-orange-600 text-2xl font-bold mt-2'>₹499</p>
                            <p className='flex items-center text-slate-400 text-sm mt-1'><Plus size={13}/>1000 Credits</p>
                            <button onClick={()=>handleUpgrade("pro")} className='mt-4 w-full rounded-lg bg-linear-to-br from-red-600 to-orange-700 shadow-[0_1px_8px_rgba(234,70,35,0.35)] hover:shadow-[0_2px_14px_rgba(234,70,35,0.5)] py-2 font-doto font-extrabold text-white'>Upgrade</button>
                        </div>
                    </div>

                    

            </motion.div>
        </>
            }
    </AnimatePresence>
  )
}

export default BillingDrawer