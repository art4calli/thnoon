import { useState, useEffect } from "react";
import { Landmark, ArrowUp, Loader2, Sparkles, AlertCircle, BookOpen, GraduationCap, Users, Award, PenTool, Book, Compass, ShieldCheck, Star } from "lucide-react";
import Header from "./components/Header";
import HomeCard from "./components/HomeCard";
import AboutSection from "./components/AboutSection";
import GallerySection from "./components/GallerySection";
import VideoSection from "./components/VideoSection";
import CoursesSection from "./components/CoursesSection";
import ToolsSection from "./components/ToolsSection";
import ContactSection from "./components/ContactSection";
import SubscriberPortal from "./components/SubscriberPortal";
import { AppData, SubscriberState } from "./types";
import { fetchAllAppDataDirect, loginSubscriberDirect } from "./utils/sheetParser";

function getFeatureIcon(iconName: string) {
  const name = (iconName || "").toLowerCase().trim();
  switch (name) {
    case "users":
    case "ناس":
    case "مستخدمين":
      return <Users className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "graduation-cap":
    case "graduation":
    case "تعليم":
    case "قبعة":
    case "دراسة":
      return <GraduationCap className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "book-open":
    case "مكتبة":
    case "كتاب":
    case "كتب":
      return <BookOpen className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "landmark":
    case "مؤسسة":
    case "بناء":
    case "مبنى":
      return <Landmark className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "award":
    case "جائزة":
    case "وسام":
    case "شهادة":
      return <Award className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "pentool":
    case "قلم":
    case "خط":
    case "ريشة":
      return <PenTool className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "compass":
    case "بوصلة":
    case "اتجاه":
      return <Compass className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "shield":
    case "ضمان":
    case "درع":
    case "أمان":
      return <ShieldCheck className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    case "sparkles":
    case "نجوم":
    case "إبداع":
      return <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
    default:
      return <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />;
  }
}

export default function App() {
  const [activeSection, setActiveSection] = useState("home");
  const [appData, setAppData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscriber session state
  const [subscriber, setSubscriber] = useState<SubscriberState>({
    isLoggedIn: false,
    links: [],
  });

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch initial database content with direct client-side fallback for static deploys (Vercel/GitHub Pages)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 1. First try calling the server API (works in AI Studio and dynamic servers)
        const response = await fetch("/api/data");
        if (response.ok) {
          const data = await response.json();
          setAppData(data);
        } else {
          // If server returns error, fallback directly to Google Sheets from the browser!
          console.warn("Express API returned non-ok, falling back to direct sheets fetching...");
          const directData = await fetchAllAppDataDirect();
          setAppData(directData);
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Express API failed, falling back to direct sheets fetching:", err);
        try {
          // 2. Fetch directly from the Google Sheets Viz API (essential for Vercel/GitHub static sites)
          const directData = await fetchAllAppDataDirect();
          setAppData(directData);
          setIsLoading(false);
        } catch (fallbackErr) {
          console.error("Direct browser-sheets fetch failed too:", fallbackErr);
          setError("فشل الاتصال بقاعدة البيانات المباشرة لـ Google Sheets. تم تحميل التصاميم الاحتياطية.");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Recover login session from storage
    const storedLogin = sessionStorage.getItem("subscriberLogin");
    if (storedLogin) {
      try {
        const parsed = JSON.parse(storedLogin);
        if (parsed && parsed.success) {
          const links = [];
          for (let i = 1; i <= 5; i++) {
            const text = parsed[`linkButtonText${i}`];
            const comment = parsed[`linkButtonComment${i}`];
            const url = parsed[`url${i}`];
            if (text && url) {
              links.push({ text, comment, url });
            }
          }
          setSubscriber({
            isLoggedIn: true,
            subscriberName: parsed.subscriberName,
            links,
            exitButtonText: parsed.exitButtonText,
            exitButtonComment: parsed.exitButtonComment,
          });
        }
      } catch (e) {
        console.error("Failed to parse stored login session:", e);
      }
    }
  }, []);

  // Monitor window scroll to show "Back to top" button
  useEffect(() => {
    const checkScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", checkScroll);
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);

  const handleNavigate = (sectionId: string) => {
    setActiveSection(sectionId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogin = async (usernameInput: string, passwordInput: string) => {
    try {
      // Create a unique client fingerprint
      let fingerprint = localStorage.getItem("deviceId");
      if (!fingerprint) {
        fingerprint = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("deviceId", fingerprint);
      }

      // Check geo permission (optional coordinates)
      let coords: { latitude: number; longitude: number } | null = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        coords = pos.coords;
      } catch (e) {
        console.log("Geolocation omitted or rejected");
      }

      let data: any;

      try {
        // 1. Try server api login first
        const response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: usernameInput,
            password: passwordInput,
            deviceId: fingerprint,
            lat: coords?.latitude || null,
            lng: coords?.longitude || null,
          }),
        });

        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error("Express server login not available, switching to direct...");
        }
      } catch (apiErr) {
        console.warn("Express server login offline. Executing direct sheet or Apps Script login...", apiErr);
        // 2. Fallback to direct client-side sheet verification or Apps Script
        data = await loginSubscriberDirect(usernameInput, passwordInput, fingerprint);
      }

      if (data && data.success) {
        sessionStorage.setItem("subscriberLogin", JSON.stringify(data));
        const links = [];
        for (let i = 1; i <= 5; i++) {
          const text = data[`linkButtonText${i}`];
          const comment = data[`linkButtonComment${i}`];
          const url = data[`url${i}`];
          if (text && url) {
            links.push({ text, comment, url });
          }
        }
        setSubscriber({
          isLoggedIn: true,
          subscriberName: data.subscriberName,
          links,
          exitButtonText: data.exitButtonText,
          exitButtonComment: data.exitButtonComment,
        });
        setIsDashboardOpen(true);
        return { success: true };
      } else {
        return { success: false, message: data?.message || "اسم المستخدم أو كلمة المرور غير صحيحة" };
      }
    } catch (err) {
      console.error("Login execution failed completely:", err);
      return { success: false, message: "فشل التحقق بسبب عطل في الشبكة" };
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("subscriberLogin");
    setSubscriber({ isLoggedIn: false, links: [] });
    setIsDashboardOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Luxury Spinner page load screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-amber-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-amber-500 animate-spin relative z-10" />
        </div>
        <h2 className="font-serif font-bold text-2xl text-amber-400">مؤسسة يوسف ذنون للخط العربي</h2>
        <p className="text-slate-400 font-sans text-xs mt-2 animate-pulse tracking-wider">
          جاري قراءة البيانات الحية من قاعدة بيانات Google Sheets وتصميم المنصة الإبداعية...
        </p>
      </div>
    );
  }

  // Safe Fallback defaults
  const profile = appData?.profile || {
    logoUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=300",
    title: "مؤسسة يوسف ذنون للخط العربي",
    description: "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.",
    loginButtonText: "بوابة المشتركين",
    loginButtonUrl: "#login",
    features: [
      {
        title: "الترخيص الخطّي",
        description: "تمنح المؤسسة إجازات خطية معتمدة دولياً",
        icon: "users"
      },
      {
        title: "التعليم النظامي",
        description: "دورات حضورية وأخرى رقمية عن بُعد",
        icon: "graduation-cap"
      },
      {
        title: "مكتبة نادرة",
        description: "مئات الكتب والمجلدات عن الحرف والآثار",
        icon: "book-open"
      }
    ]
  };

  const socialLinks = appData?.socialLinks || {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    line: "https://line.me",
  };

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 selection:bg-amber-500 selection:text-slate-950 flex flex-col justify-between overflow-x-hidden">
      
      {/* 1. Header Navigation Component */}
      <Header
        profile={profile}
        socialLinks={socialLinks}
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenLogin={() => setIsLoginOpen(true)}
        isLoggedIn={subscriber.isLoggedIn}
        subscriberName={subscriber.subscriberName}
        onLogout={handleLogout}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        customTexts={appData?.customTexts}
      />

      {/* 2. Hero Luxury Parallax Banner Section */}
      {activeSection === "home" && (
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-36 bg-gradient-to-b from-slate-950 to-slate-900 border-b border-slate-900 overflow-hidden">
          {profile.headerBgUrl ? (
            <div className="absolute inset-0 z-0 overflow-hidden">
              <img
                src={profile.headerBgUrl}
                alt={profile.title}
                className="w-full h-full object-cover opacity-50 animate-slow-zoom"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/95"></div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d4a017_1.2px,transparent_1.2px)] [background-size:24px_24px] pointer-events-none"></div>
              {/* Soft Golden ambient glow */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            </>
          )}

          <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-500 text-xs font-sans font-bold py-1.5 px-3.5 rounded-full border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{appData?.customTexts?.heroSubtag || "بوابة الحرف العربي والآثار الإسلامية"}</span>
            </div>

            <h1 className="font-serif font-black text-4xl sm:text-5xl md:text-6xl text-amber-400 leading-tight tracking-wide">
              {profile.title}
            </h1>

            <p className="max-w-2xl mx-auto text-slate-300 font-sans text-sm sm:text-base md:text-lg leading-relaxed">
              {profile.description}
            </p>

            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <button
                onClick={() => handleNavigate("courses")}
                className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-sans font-bold text-sm py-3 px-6 rounded-xl shadow-lg shadow-amber-500/15 transition-all transform hover:scale-105 cursor-pointer"
              >
                {appData?.customTexts?.heroPrimaryBtn || "استكشف البرامج التعليمية"}
              </button>
              <button
                onClick={() => handleNavigate("artwork")}
                className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 text-amber-400 text-sm font-sans font-bold py-3 px-6 rounded-xl transition-all"
              >
                {appData?.customTexts?.heroSecondaryBtn || "عرض المعرض الفني"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Database Connection Warning Banner (If direct query fails) */}
      {error && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 py-3.5 px-4 text-center flex items-center justify-center gap-2 text-amber-400 text-xs sm:text-sm font-sans">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Main content render space */}
      <main className="flex-grow">
        
        {/* HOME SECTION */}
        {activeSection === "home" && (
          <div id="home">
            <section className="py-16 px-4 max-w-7xl mx-auto">
              <h3 className="font-serif font-bold text-2xl text-amber-400 border-r-4 border-amber-500 pr-3 mb-10 text-right">
                {appData?.customTexts?.homeSectionTitle || "الواجهة الترحيبية ومستجدات المؤسسة"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {appData?.homeCards.map((card, idx) => (
                  <HomeCard
                    key={idx}
                    card={card}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>

              {/* Premium quick-link metric summary */}
              {profile.features && profile.features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-20 border-t border-slate-900/60 pt-12">
                  {profile.features.map((feature, fIdx) => (
                    <div key={fIdx} className="text-center p-4">
                      {getFeatureIcon(feature.icon || "star")}
                      <h4 className="font-serif font-bold text-lg text-slate-200">{feature.title}</h4>
                      <p className="text-slate-400 font-sans text-xs mt-1 leading-relaxed">{feature.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* CONTACT SECTION - Rendered directly underneath Home profile */}
            <div className="border-t border-slate-900/40">
              <ContactSection cards={appData?.contactCards || []} socialLinks={socialLinks} contactInfo={appData?.contactInfo} />
            </div>
          </div>
        )}

        {/* ABOUT SECTION */}
        {activeSection === "about" && (
          <div id="about" className="pt-24 md:pt-28">
            <AboutSection cards={appData?.aboutCards || []} biography={appData?.biography} header={appData?.sectionHeaders?.about} />
          </div>
        )}

        {/* ARTWORK GALLERY SECTION */}
        {activeSection === "artwork" && (
          <div id="artwork" className="pt-24 md:pt-28">
            <GallerySection cards={appData?.artworkCards || []} header={appData?.sectionHeaders?.artwork} />
          </div>
        )}

        {/* VIDEO LIBRARY SECTION */}
        {activeSection === "video" && (
          <div id="video" className="pt-24 md:pt-28">
            <VideoSection cards={appData?.videoCards || []} header={appData?.sectionHeaders?.video} />
          </div>
        )}

        {/* EDUCATIONAL COURSES SECTION */}
        {activeSection === "courses" && (
          <div id="courses" className="pt-24 md:pt-28">
            <CoursesSection cards={appData?.coursesCards || []} header={appData?.sectionHeaders?.courses} />
          </div>
        )}

        {/* TOOLS AND SUPPLIES SECTION */}
        {activeSection === "tools" && (
          <div id="tools" className="pt-24 md:pt-28">
            <ToolsSection cards={appData?.toolsCards || []} header={appData?.sectionHeaders?.tools} />
          </div>
        )}

        {/* CONTACT SECTION (Independent Page View) */}
        {activeSection === "contact" && (
          <div id="contact" className="pt-24 md:pt-28">
            <ContactSection cards={appData?.contactCards || []} socialLinks={socialLinks} contactInfo={appData?.contactInfo} />
          </div>
        )}

      </main>

      {/* 4. Highly Elegant Arabic Calligraphy Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-center md:text-right">
          
          <div className="md:col-span-4 space-y-3">
            <h4 className="font-serif font-bold text-xl text-amber-400">
              {appData?.customTexts?.footerTitle || "مؤسسة يوسف ذنون"}
            </h4>
            <p className="text-slate-400 font-sans text-xs leading-relaxed">
              {appData?.customTexts?.footerDescription || "مؤسسة مرخصة تُعنى برعاية الخطاطين وحفظ الموروث الفني والإرث الآثاري للأستاذ عميد الخط العربي يوسف ذنون رحمه الله."}
            </p>
          </div>

          <div className="md:col-span-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-sans text-slate-400">
            <button onClick={() => handleNavigate("home")} className="hover:text-amber-400 transition-colors">
              {appData?.customTexts?.navHome || "الرئيسية"}
            </button>
            <button onClick={() => handleNavigate("about")} className="hover:text-amber-400 transition-colors">
              {appData?.customTexts?.navAbout || "عن المؤسسة"}
            </button>
            <button onClick={() => handleNavigate("artwork")} className="hover:text-amber-400 transition-colors">
              {appData?.customTexts?.navArtwork || "المعرض الفني"}
            </button>
            <button onClick={() => handleNavigate("video")} className="hover:text-amber-400 transition-colors">
              {appData?.customTexts?.navVideo || "المرئيات"}
            </button>
            <button onClick={() => handleNavigate("courses")} className="hover:text-amber-400 transition-colors">
              {appData?.customTexts?.navCourses || "الدورات"}
            </button>
            <button onClick={() => handleNavigate("tools")} className="hover:text-amber-400 transition-colors">
              {appData?.customTexts?.navTools || "الأدوات"}
            </button>
          </div>

          <div className="md:col-span-4 text-center md:text-left space-y-1">
            <p className="text-slate-500 font-sans text-[11px] leading-normal">
              {appData?.customTexts?.footerCopyright || "جميع الحقوق محفوظة ومسجلة"} © {new Date().getFullYear()}
            </p>
            <p className="text-slate-600 font-sans text-[10px]">
              {appData?.customTexts?.navbarTitle || "مؤسسة يوسف ذنون"} {appData?.customTexts?.navbarSubtitle || "للخط العربي والآثار الإسلامية"}
            </p>
          </div>
        </div>
      </footer>

      {/* 5. Subscriber Portals Logic component triggers */}
      <SubscriberPortal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        subscriber={subscriber}
        onLogin={handleLogin}
        onLogout={handleLogout}
        isDashboardOpen={isDashboardOpen}
        onCloseDashboard={() => setIsDashboardOpen(false)}
      />

      {/* 6. Back-to-Top circular button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full shadow-2xl transition-all transform hover:scale-110 z-40"
          title="العودة لأعلى الصفحة"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}

    </div>
  );
}
