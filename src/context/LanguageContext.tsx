import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { LanguageCode, DEFAULT_SITE_TRANSLATIONS, TranslationItem } from "../data/defaultTranslations";
import { AppData } from "../types";
import { extractTranslationsFromAppData } from "../utils/sheetTranslationExtractor";

interface LanguageContextType {
  currentLang: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  dir: "rtl" | "ltr";
  t: (key: string, fallbackAr?: string) => string;
  translations: TranslationItem[];
  updateTranslationItem: (id: string, updates: { ar?: string; th?: string; en?: string }) => void;
  updateMultipleTranslations: (items: TranslationItem[]) => void;
  resetToDefaults: () => void;
  saveTranslationsToServer: () => Promise<{ success: boolean; message: string }>;
  isTranslatingAI: boolean;
  translateItemWithAI: (id: string) => Promise<{ success: boolean; message: string }>;
  translateCategoryWithAI: (category: string) => Promise<{ success: boolean; message: string; count?: number }>;
  translateAllWithAI: () => Promise<{ success: boolean; message: string; count?: number }>;
  syncWithAppData: (appData: AppData) => void;
  isSheetSynced: boolean;
}

const STORAGE_LANG_KEY = "thnoon_user_lang";
const STORAGE_TRANS_KEY = "thnoon_site_translations";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Language state
  const [currentLang, setCurrentLangState] = useState<LanguageCode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_LANG_KEY) as LanguageCode;
      if (saved === "ar" || saved === "th" || saved === "en") {
        return saved;
      }
    }
    return "ar";
  });

  // 2. Translations dictionary state
  const [translations, setTranslations] = useState<TranslationItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_TRANS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const savedMap = new Map<string, TranslationItem>();
            parsed.forEach((item: TranslationItem) => {
              if (item && item.id) savedMap.set(item.id, item);
            });

            // Merge default translations with saved ones to ensure new keys exist
            const merged = DEFAULT_SITE_TRANSLATIONS.map((defItem) => {
              const userSaved = savedMap.get(defItem.id);
              if (userSaved) {
                return {
                  ...defItem,
                  th: userSaved.th || defItem.th,
                  en: userSaved.en || defItem.en,
                };
              }
              return defItem;
            });

            // Also keep any custom user items that aren't in defaults
            parsed.forEach((item: TranslationItem) => {
              if (item && item.id && !DEFAULT_SITE_TRANSLATIONS.some((d) => d.id === item.id)) {
                merged.push(item);
              }
            });

            return merged;
          }
        }
      } catch (e) {
        console.warn("Error reading site translations from storage:", e);
      }
    }
    return DEFAULT_SITE_TRANSLATIONS;
  });

  const [isTranslatingAI, setIsTranslatingAI] = useState(false);
  const [isSheetSynced, setIsSheetSynced] = useState(false);

  // Load saved translations from server on mount
  useEffect(() => {
    fetch("/api/site-translations")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.translations) && data.translations.length > 0) {
          setTranslations((prev) => {
            const serverMap = new Map<string, TranslationItem>();
            data.translations.forEach((item: TranslationItem) => {
              if (item && item.id) serverMap.set(item.id, item);
            });

            const next = prev.map((item) => {
              const serverItem = serverMap.get(item.id);
              if (serverItem) {
                return {
                  ...item,
                  th: serverItem.th || item.th,
                  en: serverItem.en || item.en,
                };
              }
              return item;
            });

            if (typeof window !== "undefined") {
              localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(next));
            }
            return next;
          });
        }
      })
      .catch(() => {});
  }, []);

  // Sync translations dynamically with Google Sheet AppData
  const syncWithAppData = useCallback((appData: AppData) => {
    if (!appData) return;
    setTranslations((prev) => {
      const { allTranslationsMerged } = extractTranslationsFromAppData(appData, prev);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(allTranslationsMerged));
      }
      return allTranslationsMerged;
    });
    setIsSheetSynced(true);
  }, []);

  // Apply Direction and Lang to <html> element
  useEffect(() => {
    if (typeof document !== "undefined") {
      const isRtl = currentLang === "ar";
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
      document.documentElement.lang = currentLang;

      if (isRtl) {
        document.documentElement.classList.add("rtl");
        document.documentElement.classList.remove("ltr");
      } else {
        document.documentElement.classList.add("ltr");
        document.documentElement.classList.remove("rtl");
      }
    }
  }, [currentLang]);

  // Set Language handler
  const setLanguage = useCallback((lang: LanguageCode) => {
    setCurrentLangState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    }
  }, []);

  // Fast lookup map & reverse Arabic text map for dynamic sheet rows
  const { translationMap, arabicTextMap } = React.useMemo(() => {
    const map = new Map<string, TranslationItem>();
    const arMap = new Map<string, TranslationItem>();
    translations.forEach((item) => {
      map.set(item.id, item);
      if (item.ar && item.ar.trim()) {
        arMap.set(item.ar.trim(), item);
      }
    });
    return { translationMap: map, arabicTextMap: arMap };
  }, [translations]);

  // t() translation lookup function with key match & Arabic text fallback
  const t = useCallback(
    (key: string, fallbackAr?: string): string => {
      // 1. Direct ID lookup
      let item = translationMap.get(key);

      // 2. If not found by ID, try reverse lookup by fallbackAr
      if (!item && fallbackAr && fallbackAr.trim()) {
        item = arabicTextMap.get(fallbackAr.trim());
      }

      if (!item) {
        return fallbackAr || key;
      }

      if (currentLang === "th") {
        return item.th?.trim() || item.ar || fallbackAr || key;
      }
      if (currentLang === "en") {
        return item.en?.trim() || item.ar || fallbackAr || key;
      }
      return item.ar?.trim() || fallbackAr || key;
    },
    [translationMap, arabicTextMap, currentLang]
  );

  // Update a single item
  const updateTranslationItem = useCallback((id: string, updates: { ar?: string; th?: string; en?: string }) => {
    setTranslations((prev) => {
      const next = prev.map((item) => {
        if (item.id === id) {
          // If item belongs to a sheet (sheet_*), Arabic is strictly read-only from Google Sheet
          const isSheetItem = item.category.startsWith("sheet_");
          return {
            ...item,
            ...(updates.ar !== undefined && !isSheetItem ? { ar: updates.ar } : {}),
            ...(updates.th !== undefined ? { th: updates.th } : {}),
            ...(updates.en !== undefined ? { en: updates.en } : {}),
          };
        }
        return item;
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  // Update multiple items
  const updateMultipleTranslations = useCallback((items: TranslationItem[]) => {
    setTranslations(items);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(items));
    }
    // Background sync to server
    fetch("/api/site-translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ translations: items }),
    }).catch(() => {});
  }, []);

  // Reset to default translations
  const resetToDefaults = useCallback(() => {
    setTranslations(DEFAULT_SITE_TRANSLATIONS);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(DEFAULT_SITE_TRANSLATIONS));
    }
  }, []);

  // Save to server
  const saveTranslationsToServer = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch("/api/site-translations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ translations }),
      });
      const data = await res.json().catch(() => ({}));
      if (data && data.success) {
        return { success: true, message: data.message || "تم حفظ جميع الترجمات بنجاح" };
      }
      return { success: true, message: "تم حفظ الترجمات محلياً في المتصفح بنجاح" };
    } catch (e: any) {
      return { success: true, message: "تم حفظ الترجمات محلياً بنجاح" };
    }
  }, [translations]);

  // AI Smart Translate for a single item
  const translateItemWithAI = useCallback(async (id: string): Promise<{ success: boolean; message: string }> => {
    const item = translations.find((t) => t.id === id);
    if (!item || !item.ar?.trim()) {
      return { success: false, message: "النص العربي غير موجود للترجمة" };
    }

    try {
      setIsTranslatingAI(true);
      const res = await fetch("/api/ai-translate-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ id: item.id, ar: item.ar, category: item.category }],
        }),
      });

      const data = await res.json().catch(() => null);
      if (data && data.success && data.results && data.results[item.id]) {
        const { th, en } = data.results[item.id];
        updateTranslationItem(item.id, { th, en });
        return { success: true, message: "تمت الترجمة الذكية بنجاح!" };
      }
      throw new Error(data?.message || "فشلت الترجمة الذكية");
    } catch (err: any) {
      return { success: false, message: "تعذر إكمال الترجمة الذكية: " + err.message };
    } finally {
      setIsTranslatingAI(false);
    }
  }, [translations, updateTranslationItem]);

  // AI Smart Translate for an entire category
  const translateCategoryWithAI = useCallback(
    async (category: string): Promise<{ success: boolean; message: string; count?: number }> => {
      const itemsToTranslate = translations.filter((t) => t.category === category && t.ar?.trim());
      if (itemsToTranslate.length === 0) {
        return { success: false, message: "لا توجد نصوص في هذا القسم للترجمة" };
      }

      try {
        setIsTranslatingAI(true);
        const payload = itemsToTranslate.map((item) => ({
          id: item.id,
          ar: item.ar,
          category: item.category,
        }));

        const res = await fetch("/api/ai-translate-texts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload }),
        });

        const data = await res.json().catch(() => null);
        if (data && data.success && data.results) {
          const updated = translations.map((item) => {
            if (data.results[item.id]) {
              return {
                ...item,
                th: data.results[item.id].th || item.th,
                en: data.results[item.id].en || item.en,
              };
            }
            return item;
          });

          updateMultipleTranslations(updated);
          return {
            success: true,
            message: `تمت ترجمة جميع نصوص القسم (${itemsToTranslate.length} نص) بنجاح!`,
            count: itemsToTranslate.length,
          };
        }
        throw new Error(data?.message || "فشلت الترجمة الجماعية");
      } catch (err: any) {
        return { success: false, message: "تعذر إكمال الترجمة الجماعية: " + err.message };
      } finally {
        setIsTranslatingAI(false);
      }
    },
    [translations, updateMultipleTranslations]
  );

  // AI Smart Translate for the entire website
  const translateAllWithAI = useCallback(async (): Promise<{ success: boolean; message: string; count?: number }> => {
    const itemsToTranslate = translations.filter((t) => t.ar?.trim());
    if (itemsToTranslate.length === 0) {
      return { success: false, message: "لا توجد نصوص للترجمة" };
    }

    try {
      setIsTranslatingAI(true);
      const payload = itemsToTranslate.map((item) => ({
        id: item.id,
        ar: item.ar,
        category: item.category,
      }));

      const res = await fetch("/api/ai-translate-texts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload }),
      });

      const data = await res.json().catch(() => null);
      if (data && data.success && data.results) {
        const updated = translations.map((item) => {
          if (data.results[item.id]) {
            return {
              ...item,
              th: data.results[item.id].th || item.th,
              en: data.results[item.id].en || item.en,
            };
          }
          return item;
        });

        updateMultipleTranslations(updated);
        return {
          success: true,
          message: `تمت ترجمة كافة نصوص الموقع بالكامل (${itemsToTranslate.length} نص) إلى التايلاندية والإنجليزية!`,
          count: itemsToTranslate.length,
        };
      }
      throw new Error(data?.message || "فشلت الترجمة الشاملة");
    } catch (err: any) {
      return { success: false, message: "تعذر إكمال الترجمة الشاملة: " + err.message };
    } finally {
      setIsTranslatingAI(false);
    }
  }, [translations, updateMultipleTranslations]);

  const dir = currentLang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider
      value={{
        currentLang,
        setLanguage,
        dir,
        t,
        translations,
        updateTranslationItem,
        updateMultipleTranslations,
        resetToDefaults,
        saveTranslationsToServer,
        isTranslatingAI,
        translateItemWithAI,
        translateCategoryWithAI,
        translateAllWithAI,
        syncWithAppData,
        isSheetSynced,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
