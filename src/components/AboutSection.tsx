import { motion } from "motion/react";
import { BookOpen, Award, FileText, Shield } from "lucide-react";
import { SheetRow, SectionHeaderData } from "../types";
import CardMediaSlider from "./CardMediaSlider";

interface AboutSectionProps {
  cards: SheetRow[];
  header?: SectionHeaderData;
}

export default function AboutSection({ cards, header }: AboutSectionProps) {
  const hasCustomCards = cards && cards.length > 0;

  // Use dynamic headers from Google Sheets with beautiful traditional fallback defaults
  const sectionBadge = header?.badge || "إرث حضاري إسلامي خالد";
  const sectionTitle = header?.title || "عن مؤسسة يوسف ذنون للخط العربي";
  const sectionDesc = header?.description || "تأسست المؤسسة لتكون مناراً إسلامياً وثقافياً يحمل اسم الراحل الكبير الأستاذ يوسف ذنون، عميد ومؤرخ الخط العربي، لنشر هذا الفن الشريف ورعاية أجيال الخطاطين في شتى أنحاء العالم الإسلامي.";

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
          {sectionBadge}
        </span>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl text-amber-400 mt-4 leading-normal">
          {sectionTitle}
        </h2>
        <p className="text-slate-300 font-sans mt-4 text-sm sm:text-base leading-relaxed">
          {sectionDesc}
        </p>
      </div>

      {/* Dynamic Cards Rendered from Google Sheet if available */}
      {hasCustomCards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-slate-950/40 border border-slate-900 hover:border-amber-500/20 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
            >
              <div>
                {/* Card Image / Media Slider */}
                {card.media && card.media.length > 0 ? (
                  <div className="relative overflow-hidden rounded-t-3xl">
                    <CardMediaSlider media={card.media} title={card.title} description={card.description} />
                  </div>
                ) : null}

                {/* Card Text Content */}
                <div className="p-6 text-right space-y-3">
                  <h3 className="font-serif font-bold text-xl text-slate-100 group-hover:text-amber-400 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-slate-400 font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {card.description}
                  </p>
                </div>
              </div>

              {card.linkUrl && (
                <div className="p-6 pt-0 mt-auto">
                  <a
                    href={card.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-center bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-sans font-semibold py-2.5 rounded-xl border border-amber-500/20 transition-all w-full"
                  >
                    {card.buttonText || "تفاصيل إضافية"}
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        /* Core Values/Goals Grid (Fallback layout if sheet lacks explicit cards) */
        <div>
          <h3 className="font-serif font-bold text-xl sm:text-2xl text-amber-400 border-r-4 border-amber-500 pr-3 mb-10 text-right">
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
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 mr-0 ml-auto group-hover:bg-amber-500/20 transition-colors">
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
