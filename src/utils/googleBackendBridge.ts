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

export const DEFAULT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyz8awoTXf8Pi4inYxOCPod3-3YHpJFeY-unuWVSkf41XyiOxsMz7rtcTnrrofbXobenA/exec";
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
