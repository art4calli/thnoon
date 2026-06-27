import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Lock, X, LogIn, Globe, AlertTriangle, LogOut, CheckCircle, ShieldCheck } from "lucide-react";
import { SubscriberState } from "../types";

interface SubscriberPortalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: SubscriberState;
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onLogout: () => void;
  isDashboardOpen: boolean;
  onCloseDashboard: () => void;
}

export default function SubscriberPortal({
  isOpen,
  onClose,
  subscriber,
  onLogin,
  onLogout,
  isDashboardOpen,
  onCloseDashboard,
}: SubscriberPortalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setError("");
    setIsLoading(true);
    try {
      const response = await onLogin(username, password);
      setIsLoading(false);
      if (response.success) {
        // Clear state
        setUsername("");
        setPassword("");
        onClose();
      } else {
        setError(response.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    } catch (err: any) {
      setIsLoading(false);
      setError("حدث خطأ أثناء محاولة الدخول والتحقق");
    }
  };

  return (
    <>
      {/* 1. SECURE LOGIN MODAL POPUP */}
      <AnimatePresence>
        {isOpen && !subscriber.isLoggedIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-right overflow-hidden"
            >
              {/* Top luxury calligraphic border accent */}
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-1.5 bg-slate-800/50 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="text-center mt-2 mb-6">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-amber-400">بوابة الدخول الآمنة</h3>
                <p className="text-slate-400 font-sans text-xs mt-1 leading-relaxed">
                  الرجاء تسجيل الدخول للوصول إلى ميزات البرامج التعليمية وروابطك المخصصة.
                </p>
              </div>

              {/* Form elements */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-sans font-semibold text-slate-400">اسم المستخدم للخطاط</label>
                  <div className="relative">
                    <User className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-amber-500/80" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="أدخل اسم المستخدم المعين لك"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/55 rounded-xl pr-11 pl-4 py-3 text-sm text-slate-100 outline-none transition-colors font-sans text-right"
                    />
                  </div>
                </div>

                {/* Password Input Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-sans font-semibold text-slate-400">كلمة المرور الخاصة بالمشترك</label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-amber-500/80" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="أدخل كلمة السر الخاصة بك"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500/55 rounded-xl pr-11 pl-4 py-3 text-sm text-slate-100 outline-none transition-colors font-sans text-right"
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-3 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-sm py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogIn className="w-4.5 h-4.5" />
                  <span>{isLoading ? "جاري التحقق والمزامنة..." : "إرسال طلب الدخول"}</span>
                </button>
              </form>

              {/* Sub-note for subscribers */}
              <div className="mt-6 pt-4 border-t border-slate-850 text-center">
                <p className="text-slate-400 text-xs font-sans">
                  هل أنت مشترك جديد وغير مسجل بعد؟
                </p>
                <p className="text-amber-500 hover:text-amber-400 text-xs font-sans font-bold mt-1 cursor-pointer" onClick={() => window.location.href = "#contact"}>
                  راسل الإدارة الآن للحصول على حسابك وتفعيل الإشتراك
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SUCCESSFUL LOGIN DASHBOARD PANEL */}
      <AnimatePresence>
        {isDashboardOpen && subscriber.isLoggedIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseDashboard}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            ></motion.div>

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 text-right overflow-hidden"
            >
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600"></div>

              {/* Close Button */}
              <button
                onClick={onCloseDashboard}
                className="absolute top-4 left-4 p-1.5 bg-slate-800/50 hover:bg-red-500 hover:text-white text-slate-400 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title Header */}
              <div className="text-center mt-2 mb-6">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-2xl text-amber-400">بوابة المشتركين والطلاب</h3>
                <p className="text-slate-400 font-sans text-xs mt-1 leading-relaxed">
                  مرحباً بك مجدداً في مساحتك التعليمية الفنية الخاصة بالمؤسسة.
                </p>
              </div>

              {/* Subscriber info block */}
              <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-sans text-slate-400 uppercase">حالة الحساب</span>
                  <p className="font-serif font-bold text-lg text-amber-500 mt-0.5">
                    الخطاط: {subscriber.subscriberName}
                  </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg py-1 px-3.5 text-xs font-sans font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>نشط معتمد</span>
                </div>
              </div>

              {/* Customized Dynamic links loop (URLs fetched from sheets) */}
              <div className="space-y-4">
                <h4 className="font-sans font-bold text-xs text-slate-400 border-r-3 border-amber-500 pr-2.5">
                  روابطك الحصرية والدروس المخصصة:
                </h4>

                {subscriber.links && subscriber.links.length > 0 ? (
                  <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                    {subscriber.links.map((link, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-850 hover:border-amber-500/25 rounded-2xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="text-right space-y-1">
                          <h5 className="font-serif font-bold text-slate-200 text-sm sm:text-base leading-normal">
                            {link.text}
                          </h5>
                          {link.comment && (
                            <p className="text-slate-400 font-sans text-xs leading-relaxed">
                              {link.comment}
                            </p>
                          )}
                        </div>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-sans font-bold py-2.5 px-4 rounded-xl text-center shadow-md shadow-amber-500/10 transition-all shrink-0"
                        >
                          زيارة وتصفح الرابط
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs text-center font-sans py-4">
                    لا توجد روابط مخصصة مضافة لحسابك حالياً. راسل الإدارة لإضافتها.
                  </p>
                )}
              </div>

              {/* Exit block and logout */}
              <div className="mt-8 pt-6 border-t border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-right">
                  {subscriber.exitButtonComment && (
                    <p className="text-slate-400 text-xs font-sans leading-relaxed">
                      {subscriber.exitButtonComment}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    onLogout();
                    onCloseDashboard();
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl px-4 py-2.5 font-sans text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{subscriber.exitButtonText || "تسجيل الخروج الآمن"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
