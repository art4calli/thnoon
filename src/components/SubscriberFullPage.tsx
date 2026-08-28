import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LogOut,
  CheckCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ExternalLink,
  X,
  FileText,
  BookOpen,
  Award,
  Facebook,
  Instagram,
  Youtube,
  Globe
} from "lucide-react";
import { SubscriberState, SubscriberCard, SocialLinks } from "../types";
import { formatImageUrl } from "../utils/imageUtils";

interface SubscriberFullPageProps {
  subscriber: SubscriberState;
  onLogout: () => void;
  logoUrl?: string;
  institutionTitle?: string;
  socialLinks?: SocialLinks;
}

// Media Carousel for Cards (Images with Lightbox or Embedded Video Player)
function CardMediaCarousel({ media }: { media: { url: string; type?: "image" | "video" }[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!media || media.length === 0) return null;

  const currentItem = media[currentIndex] || media[0];

  const nextItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prevItem = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const vidId = url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${vidId}?autoplay=0`;
    }
    if (url.includes("youtu.be/")) {
      const vidId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${vidId}?autoplay=0`;
    }
    if (url.includes("vimeo.com/")) {
      const vidId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${vidId}`;
    }
    return url;
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 group my-4 shadow-inner">
      {/* Media Display Container */}
      <div className="relative aspect-video w-full flex items-center justify-center bg-black/50">
        {currentItem.type === "video" ? (
          currentItem.url.includes("youtube.com") || currentItem.url.includes("youtu.be") || currentItem.url.includes("vimeo.com") ? (
            <iframe
              src={getEmbedUrl(currentItem.url)}
              title="Card Video"
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={currentItem.url}
              controls
              className="w-full h-full object-contain"
            />
          )
        ) : (
          <div
            className="relative w-full h-full flex items-center justify-center cursor-pointer overflow-hidden"
            onClick={() => setLightboxUrl(currentItem.url)}
          >
            <img
              src={currentItem.url}
              alt="Card Media"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80";
              }}
            />
            <div className="absolute top-3 left-3 p-2 bg-slate-950/80 text-amber-400 rounded-xl opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm border border-amber-500/30">
              <Maximize2 className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>

      {/* Multiple media controls */}
      {media.length > 1 && (
        <>
          <button
            onClick={prevItem}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-slate-950/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full transition-all shadow-lg z-10 border border-slate-700/60"
            aria-label="Previous Media"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={nextItem}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-slate-950/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 rounded-full transition-all shadow-lg z-10 border border-slate-700/60"
            aria-label="Next Media"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 inset-x-0 flex justify-center items-center gap-1.5 z-10">
            {media.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? "w-6 bg-amber-400" : "w-2 bg-white/40 hover:bg-white"
                }`}
              />
            ))}
          </div>

          {/* Media Count Badge */}
          <div className="absolute top-3 right-3 bg-slate-950/80 text-amber-300 font-sans text-xs px-2.5 py-1 rounded-lg border border-amber-500/30 font-bold backdrop-blur-sm">
            {currentIndex + 1} / {media.length}
          </div>
        </>
      )}

      {/* Lightbox Fullscreen Popup */}
      <AnimatePresence>
        {lightboxUrl && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-6 left-6 p-3 bg-slate-800 text-white rounded-full hover:bg-red-500 transition-colors shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxUrl}
              alt="Fullscreen view"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border-2 border-amber-500/40"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SubscriberFullPage({
  subscriber,
  onLogout,
  logoUrl,
  institutionTitle,
  socialLinks,
}: SubscriberFullPageProps) {
  const hasTopicContent = subscriber.content && subscriber.content.cards && subscriber.content.cards.length > 0;

  const socialPlatforms = [
    { name: "Facebook", url: socialLinks?.facebook, icon: Facebook, color: "hover:text-blue-500 hover:border-blue-500/40" },
    { name: "Instagram", url: socialLinks?.instagram, icon: Instagram, color: "hover:text-pink-500 hover:border-pink-500/40" },
    { name: "YouTube", url: socialLinks?.youtube, icon: Youtube, color: "hover:text-red-500 hover:border-red-500/40" },
    { name: "Line", url: socialLinks?.line, icon: Globe, color: "hover:text-emerald-500 hover:border-emerald-500/40" },
  ].filter(p => !!p.url);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950" dir="rtl">
      
      {/* 1. TOP STICKY SUBSCRIBER BAR */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-10 h-10 rounded-full object-cover border-2 border-amber-500/40 p-0.5 bg-slate-950"
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <h1 className="font-serif font-bold text-base sm:text-lg text-amber-400 leading-tight">
                {institutionTitle || "مؤسسة يوسف ذنون"}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>بوابة المشتركين</span>
              </div>
            </div>
          </div>

          {/* Subscriber Status & Exit Button */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-full px-4 py-1.5 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-200 font-bold">المشترك: {subscriber.subscriberName || "مشترك"}</span>
            </div>

            {/* Prominent Exit Button */}
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500/15 to-red-600/15 hover:from-red-500 hover:to-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{subscriber.exitButtonText || "تسجيل الخروج والعودة للموقع العام"}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO COVER BANNER (Column D - Clear Cover Image with No Overlaid Text) */}
      {subscriber.content?.coverImage && (
        <section className="relative w-full overflow-hidden bg-slate-900 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
            <div className="relative w-full h-52 sm:h-72 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950">
              <img
                src={formatImageUrl(subscriber.content.coverImage)}
                alt="Topic Cover"
                className="w-full h-full object-cover object-center"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </section>
      )}

      {/* 3. TOPIC HEADER & MAIN CARDS GRID (10 CARDS) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {hasTopicContent ? (
          <div>
            {/* Topic Header: Columns B, C and Column E (Badge) */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10 pb-6 border-b border-slate-800">
              <div className="space-y-3 max-w-4xl">
                {/* Column B: Main Topic Title */}
                <h2 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-amber-400 leading-tight">
                  {subscriber.content?.title || "المحتوى الخاص والدروس المخصصة"}
                </h2>

                {/* Column C: Topic Description & Header */}
                {subscriber.content?.description && (
                  <p className="text-slate-300 text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-line">
                    {subscriber.content.description}
                  </p>
                )}
              </div>

              {/* Column E: Topic Badge */}
              {subscriber.content?.badge && (
                <div className="shrink-0 pt-1">
                  <span className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 text-xs sm:text-sm font-bold py-2 px-4 rounded-2xl border border-amber-500/30 shadow-md">
                    <Award className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{subscriber.content.badge}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Responsive Grid for Cards (Without card number tags) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {subscriber.content?.cards.map((card: SubscriberCard, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-6 transition-all shadow-xl flex flex-col justify-between"
                >
                  <div>
                    {/* Card Title */}
                    <div className="mb-3">
                      <h4 className="font-serif font-bold text-amber-400 text-xl leading-snug">
                        {card.title}
                      </h4>
                    </div>

                    {/* Description */}
                    {card.description && (
                      <p className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-line">
                        {card.description}
                      </p>
                    )}

                    {/* Media Slideshow / Video */}
                    {card.media && card.media.length > 0 && (
                      <CardMediaCarousel media={card.media} />
                    )}
                  </div>

                  {/* Action Link Button */}
                  {card.linkUrl && (
                    <div className="mt-6 pt-4 border-t border-slate-800">
                      <a
                        href={card.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-sm font-bold py-3 px-5 rounded-2xl text-center shadow-lg shadow-amber-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <ExternalLink className="w-4.5 h-4.5" />
                        <span>{card.buttonText || "فتح الرابط / المورد المرفق"}</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* FALLBACK: LEGACY CUSTOM LINKS */
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-800">
              <FileText className="w-6 h-6 text-amber-400" />
              <h3 className="font-serif font-bold text-2xl text-slate-100">
                روابطك التعليمية المخصصة
              </h3>
            </div>

            {subscriber.links && subscriber.links.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {subscriber.links.map((link, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/30 rounded-3xl p-6 transition-all shadow-lg flex flex-col justify-between"
                  >
                    <div className="space-y-2 mb-6">
                      <h4 className="font-serif font-bold text-amber-400 text-lg">
                        {link.text}
                      </h4>
                      {link.comment && (
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {link.comment}
                        </p>
                      )}
                    </div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-3 px-4 rounded-xl text-center shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>زيارة وتصفح الرابط المرفق</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
                <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-sans">
                  لا توجد بطاقات أو روابط مضافة لموضوعك حالياً. يمكنك مراسلة الإدارة لإضافة المحتوى المطلوب.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. DEDICATED SUBSCRIBER FOOTER (Social Links + Clean Logout Button) */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          
          {/* Social Channels */}
          <div className="flex items-center gap-3">
            {socialPlatforms.length > 0 && (
              <div className="flex items-center gap-2.5">
                <span className="text-xs text-slate-400 font-bold ml-1 hidden sm:inline">قنوات التواصل:</span>
                {socialPlatforms.map((plat, pIdx) => {
                  const Icon = plat.icon;
                  return (
                    <a
                      key={pIdx}
                      href={plat.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center transition-all ${plat.color}`}
                      title={plat.name}
                    >
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Exit Button */}
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 bg-slate-950 hover:bg-red-500/20 text-slate-300 hover:text-red-300 border border-slate-800 hover:border-red-500/30 rounded-xl px-5 py-2.5 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{subscriber.exitButtonText || "تسجيل الخروج والعودة للموقع العام"}</span>
          </button>

        </div>
      </footer>

    </div>
  );
}
