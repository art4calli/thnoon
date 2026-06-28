import { useState, useEffect } from "react";
import { BookOpen, Image as ImageIcon, Play, ShoppingBag, Phone, HelpCircle, LogIn, Menu, X, Landmark, Globe, Sparkles } from "lucide-react";
import { ProfileData, SocialLinks } from "../types";

interface HeaderProps {
  profile: ProfileData;
  socialLinks: SocialLinks;
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenLogin: () => void;
  isLoggedIn: boolean;
  subscriberName?: string;
  onLogout: () => void;
  onOpenDashboard: () => void;
}

export default function Header({
  profile,
  activeSection,
  onNavigate,
  onOpenLogin,
  isLoggedIn,
  subscriberName,
  onLogout,
  onOpenDashboard,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "home", label: "الرئيسية", icon: Landmark },
    { id: "about", label: "عن المؤسسة", icon: HelpCircle },
    { id: "artwork", label: "معرض الصور", icon: ImageIcon },
    { id: "video", label: "الفيديوهات", icon: Play },
    { id: "courses", label: "البرامج التعليمية", icon: BookOpen },
    { id: "tools", label: "أدوات الخط", icon: ShoppingBag },
    { id: "contact", label: "تواصل معنا", icon: Phone },
  ];

  return (
    <header className="relative w-full z-50">
      {/* Top golden announcement bar */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-yellow-600 text-slate-900 text-xs py-1 px-4 font-sans font-medium flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>مرحباً بكم في المنصة الرسمية المتطورة لمؤسسة يوسف ذنون للخط العربي</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[11px] font-sans">
          <span>الموصل، العراق</span>
          <span className="w-1 h-1 bg-slate-900 rounded-full"></span>
          <span>تأسست لحفظ وإحياء تراث عميد الخط العربي الأستاذ يوسف ذنون</span>
        </div>
      </div>

      {/* Main navigation header */}
      <div
        className={`w-full transition-all duration-300 ${
          scrolled || activeSection !== "home"
            ? "fixed top-0 bg-slate-950/95 backdrop-blur-md border-b border-amber-500/20 py-2 shadow-xl"
            : "absolute bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate("home")}>
            <div className="relative group">
              <div className="absolute inset-0 bg-amber-500 rounded-full blur-sm opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img
                src={profile.logoUrl}
                alt={profile.title}
                className="relative w-12 h-12 rounded-full object-cover border-2 border-amber-500/40 p-0.5 bg-slate-900 group-hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=300";
                }}
              />
            </div>
            <div>
              <h1 className="font-serif font-bold text-lg sm:text-xl text-amber-400 leading-tight tracking-wide">
                مؤسسة يوسف ذنون
              </h1>
              <p className="text-[10px] text-slate-400 font-sans tracking-widest uppercase">
                للخط العربي والآثار الإسلامية
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full font-sans text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      : "text-slate-300 hover:text-amber-300 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Authentication Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenDashboard}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-full font-sans text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
                >
                  <Globe className="w-4 h-4" />
                  <span>لوحة المشترك: {subscriberName}</span>
                </button>
                <button
                  onClick={onLogout}
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-2 rounded-full font-sans text-xs transition-colors"
                >
                  تسجيل خروج
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="relative group overflow-hidden bg-slate-900 border border-amber-500/30 text-amber-400 hover:text-slate-950 px-5 py-2 rounded-full font-sans text-xs font-semibold shadow-lg hover:shadow-amber-500/20 transition-all duration-300"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-500 to-yellow-600 scale-x-0 group-hover:scale-x-100 origin-right transition-transform duration-300 ease-out"></span>
                <span className="relative flex items-center gap-1.5 z-10">
                  <LogIn className="w-4 h-4" />
                  <span>{profile.loginButtonText || "بوابة المشتركين"}</span>
                </span>
              </button>
            )}
          </div>

          {/* Hamburger Menu Icon */}
          <button
            className="lg:hidden text-slate-300 hover:text-amber-400 p-1.5 rounded-lg focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/98 lg:hidden flex flex-col justify-center px-6">
          <div className="flex flex-col gap-5 py-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl font-sans text-lg font-medium transition-all ${
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "text-slate-300 hover:text-amber-300"
                  }`}
                >
                  <Icon className="w-5 h-5 text-amber-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="border-t border-slate-800/80 my-4"></div>

            {isLoggedIn ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    onOpenDashboard();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 rounded-xl font-sans text-sm font-semibold shadow-lg text-center flex items-center justify-center gap-2"
                >
                  <Globe className="w-5 h-5" />
                  <span>لوحة المشترك: {subscriberName}</span>
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-sans text-sm border border-red-500/20 text-center"
                >
                  تسجيل خروج المشترك
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenLogin();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 py-3.5 rounded-xl font-sans text-sm font-semibold shadow-lg text-center flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span>{profile.loginButtonText || "بوابة المشتركين"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
