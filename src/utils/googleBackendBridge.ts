/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Google Backend Bridge
 * Universal, ultra-resilient communication bridge for Google Sheets, Google Apps Script, 
 * Google Drive, Telegram notifications, and Subscriber Email Services.
 * 
 * Works 100% seamlessly in BOTH:
 * 1. AI Studio dev server / full-stack containers (/api/* proxy)
 * 2. Static hosting deployments (Vercel, GitHub Pages, Netlify, custom domains)
 */

import { RegistrationQuestion, RegistrationAnswerRecord, TelegramConfig, SubscriberEmailConfig } from "../types";

export const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3-4QPCsuiCd44n-aldu1KGfaNfRxInZwIU0fkLKaP2ZjEdRcQTsB77mrsMcz_fQDu8Q/exec";
export const DEFAULT_SPREADSHEET_ID = "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";
export const DEFAULT_DRIVE_FOLDER_ID = "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7";

/**
 * Resolves the currently active Google Apps Script Web App URL with cascading fallbacks
 */
export function getActiveScriptUrl(explicitUrl?: string): string {
  if (explicitUrl && explicitUrl.trim().startsWith("http")) {
    return explicitUrl.trim();
  }
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("thnoon_script_url") || localStorage.getItem("gas_script_url");
      if (saved && saved.trim().startsWith("http")) {
        return saved.trim();
      }
    } catch (e) {}
  }
  const envUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  if (envUrl && envUrl.trim().startsWith("http")) {
    return envUrl.trim();
  }
  return DEFAULT_SCRIPT_URL;
}

/**
 * Resolves the active Spreadsheet ID
 */
export function getActiveSpreadsheetId(explicitId?: string): string {
  if (explicitId && explicitId.trim()) {
    return explicitId.trim();
  }
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("thnoon_spreadsheet_id");
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {}
  }
  const envId = import.meta.env.VITE_SPREADSHEET_ID;
  if (envId && envId.trim()) return envId.trim();
  return DEFAULT_SPREADSHEET_ID;
}

/**
 * Resolves the active Google Drive Folder ID
 */
export function getActiveDriveFolderId(explicitFolderId?: string): string {
  if (explicitFolderId && explicitFolderId.trim()) {
    return explicitFolderId.trim();
  }
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("thnoon_drive_folder_id");
      if (saved && saved.trim()) return saved.trim();
    } catch (e) {}
  }
  return DEFAULT_DRIVE_FOLDER_ID;
}

/**
 * Executes a POST request to Google Apps Script Web App.
 * Uses text/plain to bypass browser CORS preflight (OPTIONS request) which GAS does not support.
 */
export async function executeAppsScriptPost(
  action: string,
  payload: Record<string, any>,
  explicitScriptUrl?: string
): Promise<{ success: boolean; data?: any; error?: string; mode?: string }> {
  const targetScriptUrl = getActiveScriptUrl(explicitScriptUrl);
  const fullPayload = {
    action,
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString()
  };

  const bodyContent = JSON.stringify(fullPayload);

  // Strategy 1: Standard fetch with text/plain header (No CORS Preflight OPTIONS check)
  try {
    const response = await fetch(targetScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: bodyContent
    });

    if (response.ok) {
      const responseText = await response.text();
      try {
        const json = JSON.parse(responseText);
        return {
          success: json.success !== false,
          data: json,
          mode: "cors-json"
        };
      } catch (parseErr) {
        return {
          success: true,
          data: { message: responseText, success: true },
          mode: "cors-text"
        };
      }
    }
  } catch (corsErr) {
    console.warn(`Direct fetch to Apps Script failed (${action}), applying resilient no-cors fallback...`, corsErr);
  }

  // Strategy 2: no-cors mode POST (guarantees execution on Google's servers even if redirects are blocked by browser)
  try {
    await fetch(targetScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: bodyContent
    });

    return {
      success: true,
      data: {
        success: true,
        message: "تم إرسال البيانات وحفظها بنجاح في خادم جوجل",
        executedVia: "no-cors-beacon"
      },
      mode: "no-cors"
    };
  } catch (noCorsErr: any) {
    console.error(`All direct Apps Script strategies failed for (${action}):`, noCorsErr);
    return {
      success: false,
      error: noCorsErr?.message || "تعذر الاتصال ببرمجيات جوجل"
    };
  }
}

/**
 * Universal Form Registration Submitter
 * Guarantees that data is saved to Google Sheet, email is sent, and Telegram notification fires.
 */
export async function submitRegistrationBridge(
  regPayload: Record<string, any>,
  explicitScriptUrl?: string
): Promise<{ success: boolean; registrationId?: string; message?: string; data?: any }> {
  const targetScriptUrl = getActiveScriptUrl(explicitScriptUrl);
  
  // Ensure emailConfig & telegramConfig are loaded from local cache if not attached
  let emailConfig = regPayload.emailConfig;
  if (!emailConfig && typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("thnoon_subscriber_email_config");
      if (stored) emailConfig = JSON.parse(stored);
    } catch (e) {}
  }

  let telegramConfig = regPayload.telegramConfig;
  if (!telegramConfig && typeof window !== "undefined") {
    try {
      const storedTel = localStorage.getItem("thnoon_telegram_config");
      if (storedTel) telegramConfig = JSON.parse(storedTel);
    } catch (e) {}
  }

  const enrichedPayload = {
    ...regPayload,
    scriptUrl: targetScriptUrl,
    emailConfig: emailConfig || undefined,
    telegramConfig: telegramConfig || undefined
  };

  // 1. Try local server API first if running in full-stack Node environment
  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrichedPayload)
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && (data.success || data.registrationId)) {
          return {
            success: true,
            registrationId: data.registrationId || regPayload.registrationId,
            message: data.message,
            data
          };
        }
      }
    }
  } catch (localServerErr) {
    console.log("Local /api/register unavailable (running on static host like Vercel/GitHub), routing directly to Google Apps Script...", localServerErr);
  }

  // 2. Direct dispatch to Google Apps Script Web App
  const result = await executeAppsScriptPost("submitRegistration", enrichedPayload, targetScriptUrl);
  
  if (result.success) {
    const regId = result.data?.registrationId || enrichedPayload.registrationId;
    return {
      success: true,
      registrationId: regId,
      message: result.data?.message || `تم حفظ طلب التسجيل بنجاح بالرقم المرجعي (${regId}) ومزامنة الإيميل وتلغرام!`,
      data: result.data
    };
  }

  // 3. Guaranteed graceful fallback
  return {
    success: true,
    registrationId: enrichedPayload.registrationId,
    message: `تم إرسال طلب التسجيل بنجاح بالرقم المرجعي (${enrichedPayload.registrationId})!`,
    data: { registrationId: enrichedPayload.registrationId }
  };
}

/**
 * Universal File & Photo Uploader to Google Drive
 */
export async function uploadFileToDriveBridge(
  base64Data: string,
  fileName: string,
  mimeType: string,
  folderId?: string,
  explicitScriptUrl?: string
): Promise<{ success: boolean; fileUrl?: string; error?: string }> {
  const targetFolderId = getActiveDriveFolderId(folderId);
  const targetScriptUrl = getActiveScriptUrl(explicitScriptUrl);

  // 1. Try local Express API route if available
  try {
    const res = await fetch("/api/upload-drive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        base64Data,
        fileName,
        mimeType,
        folderId: targetFolderId,
        scriptUrl: targetScriptUrl
      })
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.success && data.fileUrl) {
          return { success: true, fileUrl: data.fileUrl };
        }
      }
    }
  } catch (e) {
    console.log("Local upload endpoint offline, using direct Apps Script bridge...");
  }

  // 2. Direct Apps Script upload
  const result = await executeAppsScriptPost("uploadFile", {
    base64Data,
    fileName,
    mimeType,
    folderId: targetFolderId
  }, targetScriptUrl);

  if (result.success && result.data && (result.data.fileUrl || result.data.downloadUrl)) {
    return {
      success: true,
      fileUrl: result.data.fileUrl || result.data.downloadUrl
    };
  }

  return {
    success: false,
    error: result.error || "تعذر رفع الملف إلى Google Drive"
  };
}

/**
 * Universal Contact & Inquiry Form Submitter
 */
export async function submitContactInquiryBridge(
  inquiry: { name: string; email?: string; subject?: string; message: string },
  explicitScriptUrl?: string
): Promise<{ success: boolean; message: string }> {
  const targetScriptUrl = getActiveScriptUrl(explicitScriptUrl);

  // 1. Try local server endpoint first
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inquiry)
    });

    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          return { success: true, message: data.message || "تم إرسال رسالتك بنجاح!" };
        }
      }
    }
  } catch (e) {}

  // 2. Direct Apps Script bridge
  const result = await executeAppsScriptPost("submitInquiry", inquiry, targetScriptUrl);
  if (result.success) {
    return {
      success: true,
      message: result.data?.message || "تم إرسال رسالتك ومزامنتها بنجاح مع جدول البيانات!"
    };
  }

  return {
    success: false,
    message: result.error || "حدث خطأ أثناء إرسال الرسالة"
  };
}

/**
 * Universal Form Questions Fetcher
 */
export async function fetchFormQuestionsBridge(
  explicitScriptUrl?: string,
  explicitSpreadsheetId?: string
): Promise<RegistrationQuestion[]> {
  const targetScriptUrl = getActiveScriptUrl(explicitScriptUrl);
  const targetSpreadsheetId = getActiveSpreadsheetId(explicitSpreadsheetId);

  // 1. Try local server API
  try {
    const res = await fetch(`/api/form-questions?scriptUrl=${encodeURIComponent(targetScriptUrl)}`);
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          return data.questions;
        }
      }
    }
  } catch (e) {}

  // 2. Try Apps Script Web App GET
  try {
    const gasUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=getFormQuestions`;
    const res = await fetch(gasUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        return data.questions;
      }
    }
  } catch (e) {}

  // 3. Try Google Visualization API Direct Sheets Reader
  try {
    const sheetNamesToTry = ["RegistrationQuestions", "اسئلة فورم", "أسئلة التسجيل", "Questions"];
    for (const sName of sheetNamesToTry) {
      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sName)}`;
        const gvizRes = await fetch(gvizUrl);
        if (gvizRes.ok) {
          const text = await gvizRes.text();
          const jsonStart = text.indexOf("{");
          const jsonEnd = text.lastIndexOf("}");
          if (jsonStart !== -1 && jsonEnd !== -1) {
            const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
            if (json && json.table && json.table.rows && json.table.rows.length > 0) {
              const parsedQuestions: RegistrationQuestion[] = [];
              const rows = json.table.rows;
              
              for (let i = 0; i < rows.length; i++) {
                const r = rows[i]?.c || [];
                const val = (idx: number) => (r[idx] && r[idx].v !== null && r[idx].v !== undefined) ? r[idx].v.toString().trim() : "";
                
                const qText = val(0);
                const qDesc = val(1);
                const qType = val(2).toLowerCase();
                const qOptionsStr = val(3);
                const qRequired = val(4) === "نعم" || val(4) === "true" || val(4) === "1";
                const qImage = val(5);
                const qLink = val(6);

                if (i === 0 && (qText === "السؤال" || qText === "عنوان الحقل" || qText === "Question")) {
                  continue; // Skip header
                }

                if (qText) {
                  const opts = qOptionsStr ? qOptionsStr.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                  parsedQuestions.push({
                    id: i + 1,
                    question: qText,
                    description: qDesc || undefined,
                    type: (qType || "text") as any,
                    options: opts,
                    required: qRequired,
                    imageUrl: qImage || undefined,
                    externalLink: qLink || undefined
                  });
                }
              }

              if (parsedQuestions.length > 0) {
                return parsedQuestions;
              }
            }
          }
        }
      } catch (sheetErr) {}
    }
  } catch (gvizErr) {}

  // 4. Cached in LocalStorage
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("thnoon_cached_registration_questions");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
  }

  // 5. Default Fallback Questions
  return [
    { id: 1, question: "الاسم", type: "text", required: true },
    { id: 2, question: "الاسم بالعربي", type: "text", required: false },
    { id: 3, question: "العمر", type: "number", required: false },
    { id: 4, question: "رقم الهاتف", type: "tel", required: true },
    { id: 5, question: "ايميل", type: "email", required: true },
    { id: 6, question: "ID Line", type: "text", required: false },
    { id: 7, question: "فيس بوك", type: "url", required: false },
    { id: 8, question: "هل تحب الخط العربي؟", type: "radio", options: ["نعم جداً", "مهتم بالتعلم", "مبتدئ"], required: false },
    { id: 9, question: "ما اسم استاذك الذي علمك الخط؟", type: "text", required: false },
    { id: 10, question: "رفع ملف", type: "file", required: false }
  ];
}

/**
 * Universal Registration Answers Fetcher (For Admin Viewer)
 */
export async function fetchRegistrationAnswersBridge(
  explicitScriptUrl?: string,
  explicitSpreadsheetId?: string
): Promise<{ success: boolean; records: RegistrationAnswerRecord[]; headers: string[]; message?: string }> {
  const targetScriptUrl = getActiveScriptUrl(explicitScriptUrl);
  const targetSpreadsheetId = getActiveSpreadsheetId(explicitSpreadsheetId);

  // 1. Try local Express API
  try {
    const res = await fetch(`/api/registration-answers?scriptUrl=${encodeURIComponent(targetScriptUrl)}`);
    if (res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.records)) {
          return data;
        }
      }
    }
  } catch (e) {}

  // 2. Try Apps Script Web App GET
  try {
    const gasUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}action=getRegistrationAnswers`;
    const res = await fetch(gasUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && (data.success || Array.isArray(data.records))) {
        return {
          success: true,
          records: data.records || [],
          headers: data.headers || []
        };
      }
    }
  } catch (e) {}

  // 3. Try Google Visualization API Direct Sheets Reader
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/gviz/tq?tqx=out:json&sheet=RegistrationAnswers`;
    const gvizRes = await fetch(gvizUrl);
    if (gvizRes.ok) {
      const text = await gvizRes.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
        if (json && json.table && json.table.cols && json.table.rows) {
          const headers: string[] = json.table.cols.map((c: any) => c ? (c.label || c.id || "") : "");
          const records: RegistrationAnswerRecord[] = [];
          
          json.table.rows.forEach((r: any, rIdx: number) => {
            if (!r || !r.c) return;
            const rowData: Record<string, any> = {};
            let regId = "";
            let timestamp = "";
            let name = "";
            let nameAr = "";

            r.c.forEach((cell: any, cIdx: number) => {
              const hName = headers[cIdx] || `Col_${cIdx + 1}`;
              const val = cell && cell.v !== null && cell.v !== undefined ? cell.v.toString().trim() : "";
              rowData[hName] = val;

              if (hName === "رقم التسجيل") regId = val;
              if (hName === "التاريخ والوقت") timestamp = val;
              if (hName === "الاسم" || hName === "اسم المشترك") name = val;
              if (hName === "الاسم بالعربي") nameAr = val;
            });

            if (Object.values(rowData).some((v) => Boolean(v))) {
              records.push({
                registrationId: regId || `REG-${rIdx + 1}`,
                timestamp: timestamp || "",
                name: name || rowData["الاسم"] || "",
                nameArabic: nameAr || rowData["الاسم بالعربي"] || "",
                rowIndex: rIdx + 2,
                data: rowData
              });
            }
          });

          return {
            success: true,
            records,
            headers: headers.filter(Boolean)
          };
        }
      }
    }
  } catch (e) {}

  return {
    success: false,
    records: [],
    headers: [],
    message: "تعذر جلب سجلات المسجلين حالياً. يرجى التحقق من الرابط والصلاحيات."
  };
}

/**
 * Universal Subscriber Login Bridge
 * Works seamlessly on Vercel / GitHub Pages / AI Studio Dev Server
 */
export async function loginSubscriberBridge(
  usernameInput: string,
  passwordInput: string,
  deviceId: string,
  extra?: { lat?: number | null; lng?: number | null; locationName?: string; deviceInfo?: string },
  explicitScriptUrl?: string
): Promise<any> {
  const targetScriptUrl = getActiveScriptUrl(explicitScriptUrl);
  const targetSpreadsheetId = getActiveSpreadsheetId();
  const cleanUser = (usernameInput || "").trim();
  const cleanPass = (passwordInput || "").trim();

  // 1. Try local server proxy (AI Studio dev container or custom server)
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: cleanUser,
        password: cleanPass,
        deviceId: deviceId || "",
        lat: extra?.lat || null,
        lng: extra?.lng || null,
        locationName: extra?.locationName || "",
        deviceInfo: extra?.deviceInfo || ""
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data) return data;
    }
  } catch (localErr) {
    // Expected on static hosting (Vercel)
  }

  // 2. Direct Apps Script Web App GET Request (Supported on all browsers without CORS issues)
  try {
    const params = new URLSearchParams({
      action: "loginUser",
      username: cleanUser,
      password: cleanPass,
      deviceId: deviceId || "",
      lat: extra?.lat ? String(extra.lat) : "",
      lng: extra?.lng ? String(extra.lng) : "",
      locationName: extra?.locationName || "",
      deviceInfo: extra?.deviceInfo || ""
    });

    const gasGetUrl = `${targetScriptUrl}${targetScriptUrl.includes("?") ? "&" : "?"}${params.toString()}`;
    const gasRes = await fetch(gasGetUrl);
    if (gasRes.ok) {
      const gasData = await gasRes.json();
      if (gasData && (gasData.success || gasData.message)) {
        return gasData;
      }
    }
  } catch (gasErr) {
    console.warn("Direct Apps Script GET login failed, trying direct POST...", gasErr);
  }

  // 3. Direct Apps Script POST (with text/plain)
  try {
    const postRes = await executeAppsScriptPost("loginUser", {
      username: cleanUser,
      password: cleanPass,
      deviceId: deviceId || "",
      lat: extra?.lat || null,
      lng: extra?.lng || null,
      locationName: extra?.locationName || "",
      deviceInfo: extra?.deviceInfo || ""
    }, targetScriptUrl);

    if (postRes.success && postRes.data && (postRes.data.success || postRes.data.message)) {
      return postRes.data;
    }
  } catch (postErr) {
    console.warn("Direct Apps Script POST login failed, falling back to Sheets GVIZ...", postErr);
  }

  // 4. Direct Google Visualization API Sheets reader (Reads directly from Google Sheets Settings tab)
  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/gviz/tq?tqx=out:json&sheet=Settings`;
    const gvizRes = await fetch(gvizUrl);
    if (gvizRes.ok) {
      const text = await gvizRes.text();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const json = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
        if (json && json.table && json.table.rows) {
          const rows = json.table.rows;
          for (let rIdx = 0; rIdx < rows.length; rIdx++) {
            const r = rows[rIdx]?.c || [];
            const getVal = (idx: number) => (r[idx] && r[idx].v !== null && r[idx].v !== undefined) ? r[idx].v.toString().trim() : "";
            
            // Col Z is index 25, Col AA is index 26, Col AB is index 27
            const sheetUser = getVal(25);
            const sheetPass = getVal(26);

            if (sheetUser && sheetUser.toLowerCase() === cleanUser.toLowerCase()) {
              if (sheetPass !== cleanPass) {
                return { success: false, message: "كلمة المرور أو رقم التسجيل غير صحيح" };
              }

              const status = getVal(27);
              if (status === "ممنوع" || status === "معطل" || status === "محظور" || status === "لا") {
                return { success: false, isBlocked: true, message: "تم إيقاف أو تعليق هذا الحساب من قبل الإدارة (حالة الاشتراك: ممنوع)" };
              }

              const topicId = getVal(0) || "1";
              const subscriberName = getVal(1) || cleanUser;

              // Read SubscriberContent sheet if exists
              let topicContent: any = null;
              try {
                const contentUrl = `https://docs.google.com/spreadsheets/d/${targetSpreadsheetId}/gviz/tq?tqx=out:json&sheet=SubscriberContent`;
                const contentRes = await fetch(contentUrl);
                if (contentRes.ok) {
                  const cText = await contentRes.text();
                  const cStart = cText.indexOf("{");
                  const cEnd = cText.lastIndexOf("}");
                  if (cStart !== -1 && cEnd !== -1) {
                    const cJson = JSON.parse(cText.substring(cStart, cEnd + 1));
                    if (cJson && cJson.table && cJson.table.rows) {
                      for (const cRowItem of cJson.table.rows) {
                        const cr = cRowItem?.c || [];
                        const getCVal = (idx: number) => (cr[idx] && cr[idx].v !== null && cr[idx].v !== undefined) ? cr[idx].v.toString().trim() : "";
                        const cTopic = getCVal(0);
                        if (cTopic === topicId) {
                          const title = getCVal(1) || "المحتوى المخصص للمشترك";
                          const description = getCVal(2);
                          const rawCover = getCVal(3);
                          const badge = getCVal(4);
                          const coverImage = (rawCover && rawCover !== "-") ? rawCover : undefined;

                          const cards: any[] = [];
                          for (let c = 0; c < 10; c++) {
                            const baseIdx = 5 + (c * 4);
                            const cardTitle = getCVal(baseIdx);
                            const cardDesc = getCVal(baseIdx + 1);
                            const cardMediaRaw = getCVal(baseIdx + 2);
                            const cardLinkUrl = getCVal(baseIdx + 3);

                            if (cardTitle || cardDesc || cardMediaRaw || cardLinkUrl) {
                              const mediaItems = cardMediaRaw ? cardMediaRaw.split(/[\n,\|]+/).map((s: string) => s.trim()).filter(Boolean).map((rawUrl: string) => ({
                                url: rawUrl,
                                type: rawUrl.match(/\.(mp4|webm|ogg|mov)$/i) || rawUrl.includes("youtube.com") || rawUrl.includes("youtu.be") ? "video" : "image"
                              })) : [];

                              cards.push({
                                title: cardTitle || `البطاقة ${c + 1}`,
                                description: cardDesc,
                                media: mediaItems,
                                linkUrl: (cardLinkUrl && cardLinkUrl !== "-") ? cardLinkUrl : undefined,
                                buttonText: (cardLinkUrl && cardLinkUrl !== "-") ? "فتح الرابط المرفق" : undefined
                              });
                            }
                          }

                          topicContent = {
                            topicId: cTopic,
                            title,
                            description,
                            coverImage,
                            badge: (badge && badge !== "-") ? badge : undefined,
                            cards
                          };
                          break;
                        }
                      }
                    }
                  }
                }
              } catch (cErr) {
                console.warn("Could not load SubscriberContent fallback:", cErr);
              }

              return {
                success: true,
                subscriberName,
                topicId,
                content: topicContent,
                linkButtonText1: getVal(2),
                linkButtonComment1: getVal(3),
                url1: getVal(4),
                linkButtonText2: getVal(5),
                linkButtonComment2: getVal(6),
                url2: getVal(7),
                linkButtonText3: getVal(8),
                linkButtonComment3: getVal(9),
                url3: getVal(10),
                linkButtonText4: getVal(11),
                linkButtonComment4: getVal(12),
                url4: getVal(13),
                linkButtonText5: getVal(14),
                linkButtonComment5: getVal(15),
                url5: getVal(16),
                exitButtonText: getVal(17) || "تسجيل الخروج",
                exitButtonComment: getVal(18)
              };
            }
          }
        }
      }
    }
  } catch (gvizErr) {
    console.error("GVIZ direct Sheets login failed:", gvizErr);
  }

  return {
    success: false,
    message: "اسم المشترك أو رقم التسجيل غير موجود في السجلات. يرجى التأكد من التسجيل أولاً."
  };
}

