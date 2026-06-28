import { motion } from "motion/react";
import { BookOpen, Award, FileText, Landmark, Shield } from "lucide-react";
import { SheetRow } from "../types";
import CardMediaSlider from "./CardMediaSlider";

interface AboutSectionProps {
  cards: SheetRow[];
}

export default function AboutSection({ cards }: AboutSectionProps) {
  // If we have custom About cards, render them. Otherwise render a premium biography structure
  const hasCustomCards = cards && cards.length > 0;

  const features = [
    {
      icon: Award,
      title: "الحفاظ على التراث",
      description: "صيانة مقتنيات الأستاذ يوسف ذنون ومخطوطاته النادرة وحمايتها كإرث حضاري إسلامي ثري.",
    },
    {
      icon: BookOpen,
      title: "التدريس الأكاديمي",
      description: "توفير مناهج تعليمية متكاملة لتعليم الخط العربي وإجازة الخطاطين وفق الطرق التقليدية الرصينة.",
    },
    {
      icon: FileText,
      title: "البحث العلمي والآثار",
      description: "دعم الباحثين في مجالات الخط، النقوش الإسلامية والآثار، وإصدار كتب ومجلدات تخصصية.",
    },
    {
      icon: Shield,
      title: "الترخيص والإجازة",
      description: "منح إجازات خطية معتمدة دولياً من كبار أساتذة الخط العربي لرعاية الأجيال الخطاطة الجديدة.",
    },
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      {/* Visual Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold font-sans tracking-widest text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full uppercase">
          إرث حضاري إسلامي خالد
        </span>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl text-amber-400 mt-4 leading-normal">
          عن مؤسسة يوسف ذنون للخط العربي
        </h2>
        <p className="text-slate-300 font-sans mt-4 text-sm sm:text-base leading-relaxed">
          تأسست المؤسسة لتكون مناراً إسلامياً وثقافياً يحمل اسم الراحل الكبير الأستاذ يوسف ذنون، عميد ومؤرخ الخط العربي، لنشر هذا الفن الشريف ورعاية أجيال الخطاطين في شتى أنحاء العالم الإسلامي.
        </p>
      </div>

      {/* Main Biography Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-slate-950/40 border border-slate-800/60 rounded-3xl p-6 sm:p-10 mb-20 shadow-2xl">
        <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl border border-amber-500/20">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=600"
            alt="الأستاذ يوسف ذنون رحمه الله"
            className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-4 right-4 left-4 z-20 text-right">
            <h4 className="font-serif font-bold text-lg text-amber-400">الأستاذ يوسف ذنون</h4>
            <p className="text-xs text-slate-300 font-sans">عميد ومؤرخ الخط العربي والآثار الإسلامية (١٩٣٢ - ٢٠٢٠)</p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6 text-right">
          <h3 className="font-serif font-bold text-2xl text-amber-400">
            سيرة عميد الخطاطين ونشأة المؤسسة
          </h3>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
            ولد الخطاط والمؤرخ العراقي الأستاذ يوسف ذنون في مدينة الموصل الحدباء عام ١٩٣٢. كرس حياته لخدمة كتابة المصحف الشريف والبحث في أصول الحرف العربي وعلم الآثار والنقوش الإسلامية. كاتب بارز ومحاضر دولي أجاز عشرات الخطاطين الذين أصبحوا بدورهم قادة فن الخط في مختلف الأقطار.
          </p>
          <p className="text-slate-300 text-sm leading-relaxed font-sans">
            تحولت المؤسسة بجهود تلامذته والمحبين لفنه إلى منبر ثقافي يضم مكتبته النادرة، مخطوطاته الإبداعية، ودراساته التأصيلية، لتقديم برامج تعليمية مميزة تعتمد على إجازته ومدرسته الفريدة في كتابة خطوط الثلث والنسخ والديواني والكوفي.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-3 text-right">
              <span className="text-amber-500 font-serif font-bold text-2xl block">٥٠+</span>
              <span className="text-slate-400 text-xs font-sans">سنة من العطاء العلمي والفني</span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-3 text-right">
              <span className="text-amber-500 font-serif font-bold text-2xl block">١٠٠+</span>
              <span className="text-slate-400 text-xs font-sans">دراسة وبحث تخصصي في الآثار</span>
            </div>
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-3 text-right">
              <span className="text-amber-500 font-serif font-bold text-2xl block">٥٠٠+</span>
              <span className="text-slate-400 text-xs font-sans">تلميذ وخطاط مجاز حول العالم</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Cards Rendered from Google Sheet if available */}
      {hasCustomCards ? (
        <div className="space-y-12">
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-amber-400 border-r-4 border-amber-500 pr-3 mb-8">
            أقسام ومعلومات المؤسسة الإضافية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cards.map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-amber-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-serif font-bold text-lg text-amber-400 mb-3">{card.title}</h4>
                  <p className="text-slate-300 text-sm font-sans leading-relaxed whitespace-pre-line">{card.description}</p>
                  
                  {card.media && card.media.length > 0 && (
                    <div className="mt-4">
                      <CardMediaSlider media={card.media} title={card.title} description={card.description} />
                    </div>
                  )}
                </div>
                {card.linkUrl && (
                  <a
                    href={card.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-6 text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-sans font-semibold py-2.5 rounded-xl border border-amber-500/20 transition-all"
                  >
                    تفاصيل إضافية
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Core Values/Goals Grid (Fallback layout if sheet lacks explicit cards) */
        <div>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-amber-400 border-r-4 border-amber-500 pr-3 mb-10">
            أهدافنا ورسالتنا الحضارية
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-950/60 border border-slate-800/60 hover:border-amber-500/30 rounded-2xl p-6 text-right transition-all duration-300 group shadow-lg"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-slate-100 mb-2 group-hover:text-amber-400 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
