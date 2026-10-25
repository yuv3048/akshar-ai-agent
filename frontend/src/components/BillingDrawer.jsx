import { AnimatePresence, motion } from "motion/react";
import { Check, Crown, Plus, Sparkles, Star, StarHalfIcon, X } from "lucide-react";
import { useSelector } from "react-redux";
import { createOrder } from "../features/createOrder";
import { verifyPayment } from "../features/verifyPayment";

function BillingDrawer({ open, onClose }) {
  const { userData } = useSelector((state) => state.user);

  const handleUpgrade = async (plan) => {
    try {
      const data = await createOrder(plan);
      if (!data?.order?.id) {
        console.error("Could not create payment order:", data);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Akshar AI",
        description: `${data.plan.name} Plan`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            await verifyPayment(response);
            window.location.reload();
          } catch (error) {
            console.error("Payment verification failed:", error);
          }
        },
        theme: { color: "#E83813" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Could not start checkout:", error);
    }
  };

  const credits = Number(userData?.credits ?? 0);
  const totalCredits = Number(userData?.totalCredits ?? 100);
  const creditProgress = Math.min(100, Math.max(0, (credits / Math.max(totalCredits, 1)) * 100));

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "199",
      credits: "500",
      icon: StarHalfIcon,
      description: "For everyday AI tasks",
      features: ["500 AI credits", "Access to AI tools", "30-day plan validity"],
    },
    {
      id: "pro",
      name: "Pro",
      price: "499",
      credits: "1,000",
      icon: Star,
      description: "More room for bigger ideas",
      features: ["1,000 AI credits", "Access to AI tools", "30-day plan validity"],
      popular: true,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-[400px] flex-col border-l border-orange-500/15 bg-[#080808] shadow-2xl shadow-black"
          >
            <header className="flex items-center justify-between border-b border-white/[0.08] px-5 py-5">
              <div>
                <div className="font-space text-lg font-semibold text-white">Billing</div>
                <div className="mt-0.5 font-space text-sm text-slate-500">Plans & credits</div>
              </div>
              <button
                type="button"
                aria-label="Close billing"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </header>

            <div className="space-y-5 overflow-y-auto p-5">
              <section className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/[0.12] via-[#111111] to-red-950/20 p-5">
                <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Your current plan</p>
                    <h3 className="mt-2 font-space text-orange-600 text-2xl font-bold capitalize ">{userData?.plan || "Free"}</h3>
                    <p className="mt-1 text-sm text-slate-400">Keep creating with Akshar AI</p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-500/10 text-orange-400">
                    <Crown size={21} />
                  </div>
                </div>
                <div className="relative mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Credits remaining</span>
                    <span className="font-medium tabular-nums text-slate-200">{credits.toLocaleString()} <span className="text-slate-500">/ {totalCredits.toLocaleString()}</span></span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-orange-400 transition-all duration-500" style={{ width: `${creditProgress}%` }} />
                  </div>
                </div>
              </section>

              <div className="space-y-3">
                {plans.map((plan) => {
                  const PlanIcon = plan.icon;
                  const isCurrentPlan = userData?.plan === plan.id;

                  return (
                    <section
                      key={plan.id}
                      className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${plan.popular ? "border-orange-500/40 bg-gradient-to-br from-orange-500/[0.08] to-transparent shadow-lg shadow-orange-950/10" : "border-white/[0.09] bg-white/[0.02] hover:border-white/15"}`}
                    >
                      {plan.popular && (
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-orange-400/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                          <Sparkles size={11} /> Popular
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${plan.popular ? "border-orange-400/20 bg-orange-500/10 text-orange-300" : "border-white/10 bg-white/[0.04] text-slate-300"}`}>
                          <PlanIcon size={19} className='text-yellow-500'/>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-space font-semibold text-white">{plan.name} plan</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{plan.description}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-end gap-1.5">
                        <span className="text-sm font-medium text-slate-500">₹</span>
                        <span className="font-space text-3xl font-bold tracking-tight text-white">{plan.price}</span>
                        <span className="mb-1 text-xs text-slate-500">/ 30 days</span>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-white/[0.07] pt-3">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-xs text-slate-400">
                            <Check size={14} className="shrink-0 text-orange-400" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                          <Plus size={13} className="text-orange-400" /> {plan.credits} credits
                        </span>
                        <button
                          type="button"
                          disabled={isCurrentPlan}
                          onClick={() => handleUpgrade(plan.id)}
                          className={`rounded-xl px-4 py-2.5 font-doto text-sm font-extrabold transition-all disabled:cursor-default disabled:border disabled:border-white/10 disabled:bg-white/[0.04] disabled:text-slate-500 ${plan.popular ? "bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md shadow-orange-950/30 hover:from-red-500 hover:to-orange-500 hover:shadow-orange-900/30" : "border border-white/10 bg-white/[0.05] text-slate-200 hover:border-orange-500/30 hover:bg-orange-500/10"}`}
                        >
                          {isCurrentPlan ? "Current plan" : "Upgrade"}
                        </button>
                      </div>
                    </section>
                  );
                })}
              </div>
              <p className="pb-2 text-center text-[11px] leading-relaxed text-slate-600">Secure payments powered by Razorpay.</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default BillingDrawer;
