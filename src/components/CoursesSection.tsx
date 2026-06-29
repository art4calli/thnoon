import { motion } from "motion/react";
import { BookOpen, GraduationCap, Clock, Award, CheckCircle2 } from "lucide-react";
import { SheetRow, SectionHeaderData } from "../types";
import CardMediaSlider from "./CardMediaSlider";

interface CoursesSectionProps {
  cards: SheetRow[];
  header?: SectionHeaderData;
}

export default function CoursesSection({ cards, header }: CoursesSectionProps) {
  // If no custom cards are uploaded yet, display a premium educational roadmap structure
  const hasCustomCards = cards && cards.length > 0;

  const sectionBadge = header?.badge || "البناء الأكاديمي للخطاطين";
  const sectionTitle = header?.title || "البرامج والمناهج التعليمية";
  const sectionDesc = header?.description || "نقدم لكم مناهج دراسية كلاسيكية معتمدة ومنظمة تتبع خطوات المدرسة الذنونية الرائدة، تبدأ من تأسيس المبتدئين وحتى تأهيل المحترفين للحصول على الإجازة الخطية المباركة.";

  const preConfiguredRoadmaps = [
    {
      title: "دورة خط النسخ للمبتدئين",
      duration: "٣ أشهر",
      level: "مبتدئ",
      description: "دراسة شاملة لقواعد كتابة الحروف والاتصالات الأساسية لخط النسخ وفق مدرسة الأستاذ يوسف ذنون الكلاسيكية.",
      features: ["تشريح الحروف بالنقاط", "دراسة اتصالات الحروف الثنائية", "كتابة سطر متزن", "محاكاة كراسة الأستاذ"],
    },
    {
      title: "دورة ديوان الجلي والديواني",
      duration: "٤ أشهر",
      level: "متوسط",
      description: "الغوص في تفاصيل وانحناءات الخط الديواني بنوعيه العادي والجلي، وأسرار التركيب والملء الإبداعي.",
      features: ["جماليات الحركة والانحناء", "التركيب الهرمي والبيضاوي", "زخرفة الفراغات والحركات", "تصميم لوحة تخرج"],
    },
    {
      title: "أكاديمية خط الثلث الرصين",
      duration: "٦ أشهر",
      level: "متقدم",
      description: "برنامج مكثف للخطاطين المتقدمين لدراسة خط الثلث، ميزان الحروف، كتابة التراكيب الدائرية والمعقدة.",
      features: ["أسرار زاوية القلم في الثلث", "موازين الحروف المركبة", "بناء التراكيب المتداخلة", "إعداد اللوحة النهائية للإجازة"],
    },
  ];

  return (
    <section className="py-20 px-4 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-xs font-bold font-sans tracking-widest text-amber-500 bg-amber-500/10 px-3.5 py-1.5 rounded-full uppercase">
          {sectionBadge}
        </span>
        <h2 className="font-serif font-bold text-3xl sm:text-4xl text-amber-400 mt-4 leading-normal">
          {sectionTitle}
        </h2>
        <p className="text-slate-400 font-sans mt-4 text-sm leading-relaxed">
          {sectionDesc}
        </p>
      </div>

      {hasCustomCards ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((course, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-slate-950/40 border border-slate-900 hover:border-amber-500/20 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
            >
              <div>
                {/* Course Image */}
                {course.media && course.media.length > 0 ? (
                  <div className="relative">
                    <CardMediaSlider media={course.media} title={course.title} description={course.description} />
                    <span className="absolute bottom-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-sans font-bold py-1 px-2.5 rounded-md flex items-center gap-1 z-10">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>منهاج معتمد</span>
                    </span>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-900/40 flex items-center justify-center border-b border-slate-900">
                    <BookOpen className="w-10 h-10 text-slate-700" />
                  </div>
                )}

                {/* Course Info */}
                <div className="p-6 text-right space-y-3">
                  <h3 className="font-serif font-bold text-xl text-slate-100 group-hover:text-amber-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-slate-400 font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-line line-clamp-4">
                    {course.description}
                  </p>
                </div>
              </div>

              {course.linkUrl && (
                <div className="p-6 pt-0 mt-auto">
                  <a
                    href={course.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 text-xs font-sans font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/10 transition-all duration-300"
                  >
                    <span>{header?.buttonText || "تسجيل أو تفاصيل البرنامج"}</span>
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        /* FALLBACK PREMIUM DISCOVERY VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {preConfiguredRoadmaps.map((road, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-slate-950/40 border border-slate-900 rounded-3xl p-6 flex flex-col justify-between hover:border-amber-500/20 transition-all shadow-lg"
            >
              <div className="text-right">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-sans font-bold uppercase text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md">
                    {road.level}
                  </span>
                  <span className="flex items-center gap-1 text-slate-400 text-xs font-sans">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{road.duration}</span>
                  </span>
                </div>

                <h3 className="font-serif font-bold text-xl text-slate-100 mb-3">{road.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm font-sans leading-relaxed mb-6">
                  {road.description}
                </p>

                <div className="space-y-2 border-t border-slate-900 pt-4">
                  <p className="text-slate-300 font-sans text-xs font-bold mb-2">مخرجات الدورة:</p>
                  {road.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-right">
                      <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-slate-400 text-xs font-sans">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => window.location.href = "#contact"}
                className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-sans font-semibold py-3 px-4 rounded-xl border border-amber-500/20 hover:border-transparent transition-all duration-300 mt-8"
              >
                تواصل للتسجيل في الدورة
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
