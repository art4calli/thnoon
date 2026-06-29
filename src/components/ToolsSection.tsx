import { motion } from "motion/react";
import { ShoppingBag, Box, BadgeCheck, CheckCircle, ExternalLink } from "lucide-react";
import { SheetRow, SectionHeaderData } from "../types";
import CardMediaSlider from "./CardMediaSlider";

interface ToolsSectionProps {
  cards: SheetRow[];
  header?: SectionHeaderData;
}

export default function ToolsSection({ cards, header }: ToolsSectionProps) {
  const hasCustomCards = cards && cards.length > 0;

  const sectionBadge = header?.badge || "مستلزمات الحرف العربي الفاخرة";
  const sectionTitle = header?.title || "أدوات ومستلزمات الخط العربي";
  const sectionDesc = header?.description || "توفر المؤسسة أجود وأندر أدوات الخط الكلاسيكية المعالجة يدوياً لضمان كتابة دقيقة وانسيابية مطلقة للحبر على الصفحات المقهرة.";

  const standardTools = [
    {
      title: "أقلام خط قصب اليد الطومار",
      desc: "مجموعة أقلام خط قصب هندية ومصري معالجة ومقطوعة بحرفية عالية لتناسب خطوط الثلث والنسخ والجلي.",
      price: "متوفر بالمؤسسة",
      img: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "الورق المقهر الياباني الفاخر",
      desc: "أوراق مقهرة ومصقولة بالبيض والنشا الطبيعي بشكل يدوي تماماً، معدة لاستقبال الحبر دون تشرب أو تمدد للحرف.",
      price: "متوفر بالمؤسسة",
      img: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&q=80&w=600"
    },
    {
      title: "محابر الحبر العربي والحرير الطبيعي",
      desc: "محابر زجاجية فاخرة تحتوي على خيوط الحرير الطبيعي (الليقة) مشبعة بأحبار السخام الطبيعية السوداء والملونة.",
      price: "متوفر بالمؤسسة",
      img: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&q=80&w=600"
    }
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {hasCustomCards ? (
          cards.map((tool, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              className="bg-slate-950/40 border border-slate-900 hover:border-amber-500/20 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
            >
              <div>
                {/* Tool Cover Image */}
                {tool.media && tool.media.length > 0 ? (
                  <div className="relative">
                    <CardMediaSlider media={tool.media} title={tool.title} description={tool.description} aspectRatioClassName="aspect-square" />
                    <span className="absolute bottom-3 right-3 bg-amber-500 text-slate-950 text-[10px] font-sans font-bold py-1 px-2.5 rounded-md flex items-center gap-1 z-10">
                      <Box className="w-3.5 h-3.5" />
                      <span>متوفر في فرع المؤسسة</span>
                    </span>
                  </div>
                ) : (
                  <div className="aspect-square bg-slate-900/40 flex items-center justify-center border-b border-slate-900">
                    <ShoppingBag className="w-12 h-12 text-slate-700" />
                  </div>
                )}

                {/* Tool Info */}
                <div className="p-6 text-right space-y-3">
                  <h3 className="font-serif font-bold text-lg text-slate-100 group-hover:text-amber-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-slate-400 font-sans text-xs sm:text-sm leading-relaxed whitespace-pre-line line-clamp-4">
                    {tool.description}
                  </p>
                </div>
              </div>

              {tool.linkUrl && (
                <div className="p-6 pt-0 mt-auto border-t border-slate-900/60">
                  <a
                    href={tool.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-sans font-bold py-3.5 px-4 rounded-xl border border-amber-500/20 hover:border-transparent transition-all duration-300"
                  >
                    <span>طلب الأداة / فتح الرابط</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </motion.div>
          ))
        ) : (
          /* PRECONFIGURED QUALITY TOOLS (FALLBACK) */
          standardTools.map((tool, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-slate-950/40 border border-slate-900 hover:border-amber-500/20 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
            >
              <div>
                <div className="relative aspect-square overflow-hidden bg-slate-900">
                  <img
                    src={tool.img}
                    alt={tool.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent"></div>
                  <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-amber-500 text-[10px] font-sans font-semibold py-1 px-2.5 rounded-md flex items-center gap-1.5 border border-amber-500/20">
                    <BadgeCheck className="w-4 h-4 text-amber-500" />
                    <span>خامات أصلية</span>
                  </span>
                </div>

                <div className="p-6 text-right space-y-3">
                  <h3 className="font-serif font-bold text-lg text-slate-100 group-hover:text-amber-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-slate-400 font-sans text-xs sm:text-sm leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 mt-auto">
                <button
                  onClick={() => window.location.href = "#contact"}
                  className="w-full inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-sans font-bold py-3.5 px-4 rounded-xl border border-amber-500/20 hover:border-transparent transition-all duration-300"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>تواصل لطلب الأدوات</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}
