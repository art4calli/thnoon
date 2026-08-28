import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  Lock,
  X,
  LogIn,
  AlertTriangle
} from "lucide-react";
import { SubscriberState } from "../types";

interface SubscriberPortalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber: SubscriberState;
  onLogin: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  onLogout: () => void;
  onOpenRegistration?: () => void;
}

export default function SubscriberPortal({
  isOpen,
  onClose,
  subscriber,
  onLogin,
  onOpenRegistration
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
              <h3 className="font-serif font-bold text-2xl text-amber-400">بوابة المشتركين والطلاب</h3>
              <p className="text-slate-400 font-sans text-xs mt-1 leading-relaxed">
                الرجاء تسجيل الدخول للانتقال مباشرة إلى صفحتك وموضوعك المخصص.
              </p>
            </div>

            {/* Form elements */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-sans font-semibold text-slate-400">اسم المستخدم للخطاط / المشترك</label>
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

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 px-3 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-sm py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4.5 h-4.5" />
                <span>{isLoading ? "جاري التحقق وقراءة موضوع الطالب..." : "دخول وفتح صفحة المشترك"}</span>
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-slate-400 text-xs font-sans">
                هل أنت مشترك جديد وغير مسجل بعد؟
              </p>
              <button
                type="button"
                className="text-amber-400 hover:text-amber-300 text-xs font-sans font-bold mt-1.5 cursor-pointer underline decoration-amber-500/40 underline-offset-4 hover:decoration-amber-400 transition-all block mx-auto"
                onClick={() => {
                  onClose();
                  if (onOpenRegistration) {
                    onOpenRegistration();
                  } else {
                    window.location.href = "#contact";
                  }
                }}
              >
                راسل الإدارة الآن للحصول على حسابك وتفعيل الإشتراك
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
