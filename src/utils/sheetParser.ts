/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData, SheetRow } from "../types";

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID || "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";

// Fallback quality data
export const FALLBACK_DATA: AppData = {
  profile: {
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
  },
  socialLinks: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    youtube: "https://youtube.com",
    line: "https://line.me"
  },
  homeCards: [
    {
      type: "بطاقة",
      title: "مؤسسة يوسف ذنون للخط العربي",
      description: "أهلاً بكم في المنصة الرسمية لمؤسسة يوسف ذنون للخط العربي والآثار الإسلامية. نهدف إلى تقديم أفضل الموارد والدروس الأكاديمية لعشاق الحرف العربي.",
      media: [{ url: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=800" }],
      linkUrl: "#about"
    }
  ],
  artworkCards: [],
  videoCards: [],
  coursesCards: [],
  toolsCards: [],
  aboutCards: [],
  contactCards: []
};

// Parse visualization API table layout
function parseSheetTable(table: any): any[][] {
  if (!table || !table.rows) return [];
  return table.rows.map((r: any) => {
    if (!r || !r.c) return [];
    return r.c.map((cell: any) => {
      if (!cell) return "";
      if (cell.v !== null && cell.v !== undefined) {
        return cell.v.toString().trim();
      }
      return "";
    });
  });
}

// Fetch public sheets directly from the browser
export async function getSheetValuesDirect(sheetName: string): Promise<any[][]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const text = await response.text();
    
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Invalid JSON wrap from Google Sheets");
    }
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    const data = JSON.parse(jsonStr);
    return parseSheetTable(data.table);
  } catch (error) {
    console.error(`Error fetching sheet [${sheetName}] directly inside browser:`, error);
    return [];
  }
}

// Map standard spreadsheet content row
function mapContentRow(row: any[]): SheetRow | null {
  if (!row || row.length < 1) return null;
  
  // Helper to check if a string is a URL
  const isUrl = (str: string): boolean => {
    if (!str) return false;
    const s = str.trim().toLowerCase();
    return s.startsWith("http://") || s.startsWith("https://") || s.includes("drive.google.com") || s.includes("/");
  };

  let type = "";
  let title = "";
  let description = "";
  const media: { url: string }[] = [];
  let linkUrl = "";

  // Check if Column A is missing/deleted (causing shift to the left)
  // If row[2] is a URL, it means the media URLs started at index 2 instead of index 3,
  // which means Column A was completely deleted.
  const isShifted = row[2] && isUrl(row[2].toString());

  if (isShifted) {
    // Column A is deleted: index 0 is title, index 1 is description, index 2 is first image
    title = row[0] ? row[0].toString().trim() : "";
    description = row[1] ? row[1].toString().trim() : "";
    
    // Media URLs are indices 2 to 11
    for (let j = 2; j <= 11; j++) {
      const url = row[j] ? row[j].toString().trim() : "";
      if (url && url !== "-" && url !== "") {
        media.push({ url });
      }
    }
    linkUrl = row[12] ? row[12].toString().trim() : "";
    
    // Automatically determine type based on media count
    type = media.length > 1 ? "معرض" : "بطاقة";
  } else {
    // Column A is present: index 0 is type, index 1 is title, index 2 is description
    type = row[0] ? row[0].toString().trim() : "";
    title = row[1] ? row[1].toString().trim() : "";
    description = row[2] ? row[2].toString().trim() : "";
    
    // Media URLs are indices 3 to 12
    for (let j = 3; j <= 12; j++) {
      const url = row[j] ? row[j].toString().trim() : "";
      if (url && url !== "-" && url !== "") {
        media.push({ url });
      }
    }
    linkUrl = row[13] ? row[13].toString().trim() : "";
  }

  if (!title && !description) return null;

  return {
    type,
    title,
    description,
    media,
    linkUrl: (linkUrl && linkUrl !== "-") ? linkUrl : undefined
  };
}

// Full client-side assembler
export async function fetchAllAppDataDirect(): Promise<AppData> {
  const [
    profileRows,
    artworkRows,
    videoRows,
    coursesRows,
    toolsRows,
    contactRows,
    aboutRows
  ] = await Promise.all([
    getSheetValuesDirect("Profile"),
    getSheetValuesDirect("Artwork"),
    getSheetValuesDirect("فيديو"),
    getSheetValuesDirect("Courses"),
    getSheetValuesDirect("Tools"),
    getSheetValuesDirect("Contact"),
    getSheetValuesDirect("About")
  ]);

  let logoUrl = FALLBACK_DATA.profile.logoUrl;
  let title = "مؤسسة يوسف ذنون للخط العربي";
  let description = "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.";
  let loginButtonText = "بوابة المشتركين";
  let loginButtonUrl = "#login";
  let headerBgUrl = "";
  const features: any[] = [];

  if (profileRows && profileRows.length > 1) {
    if (profileRows[1] && profileRows[1][2]) logoUrl = profileRows[1][2];
    if (profileRows[1] && profileRows[1][1]) title = profileRows[1][1];
    if (profileRows[2] && profileRows[2][1]) description = profileRows[2][1];
    // Column D of Row 2 is index 3 (cell D2)
    if (profileRows[1] && profileRows[1][3]) headerBgUrl = profileRows[1][3];
  }

  // Parse features dynamically from Rows 4 to 8 (index 3 to 7)
  if (profileRows && profileRows.length > 3) {
    const limit = Math.min(profileRows.length, 9);
    for (let i = 3; i < limit; i++) {
      const row = profileRows[i];
      if (row && row.length > 1) {
        const fTitle = row[1] ? row[1].toString().trim() : "";
        const fDesc = row[2] ? row[2].toString().trim() : "";
        const fIcon = row[3] ? row[3].toString().trim() : "";
        if (fTitle || fDesc) {
          features.push({
            title: fTitle,
            description: fDesc,
            icon: fIcon || "star" // fallback icon name
          });
        }
      }
    }
  }

  let socialLinks = { ...FALLBACK_DATA.socialLinks };
  if (contactRows && contactRows.length > 0 && contactRows[0]) {
    socialLinks.facebook = contactRows[0][0] || socialLinks.facebook;
    socialLinks.instagram = contactRows[0][1] || socialLinks.instagram;
    socialLinks.youtube = contactRows[0][2] || socialLinks.youtube;
    socialLinks.line = contactRows[0][3] || socialLinks.line;
  }

  const homeCards: SheetRow[] = [];
  if (profileRows && profileRows.length > 10) {
    for (let i = 10; i < profileRows.length; i++) {
      const mapped = mapContentRow(profileRows[i]);
      if (mapped) homeCards.push(mapped);
    }
  }

  const aboutCards: SheetRow[] = [];
  if (aboutRows && aboutRows.length > 1) {
    for (let i = 1; i < aboutRows.length; i++) {
      const mapped = mapContentRow(aboutRows[i]);
      if (mapped) aboutCards.push(mapped);
    }
  }

  const artworkCards: SheetRow[] = [];
  if (artworkRows && artworkRows.length > 1) {
    for (let i = 1; i < artworkRows.length; i++) {
      const mapped = mapContentRow(artworkRows[i]);
      if (mapped) artworkCards.push(mapped);
    }
  }

  const videoCards: SheetRow[] = [];
  if (videoRows && videoRows.length > 1) {
    for (let i = 1; i < videoRows.length; i++) {
      const mapped = mapContentRow(videoRows[i]);
      if (mapped) videoCards.push(mapped);
    }
  }

  const coursesCards: SheetRow[] = [];
  if (coursesRows && coursesRows.length > 1) {
    for (let i = 1; i < coursesRows.length; i++) {
      const mapped = mapContentRow(coursesRows[i]);
      if (mapped) coursesCards.push(mapped);
    }
  }

  const toolsCards: SheetRow[] = [];
  if (toolsRows && toolsRows.length > 1) {
    for (let i = 1; i < toolsRows.length; i++) {
      const mapped = mapContentRow(toolsRows[i]);
      if (mapped) toolsCards.push(mapped);
    }
  }

  const contactCards: SheetRow[] = [];
  if (contactRows && contactRows.length > 8) {
    for (let i = 8; i < contactRows.length; i++) {
      const mapped = mapContentRow(contactRows[i]);
      if (mapped) contactCards.push(mapped);
    }
  }

  return {
    profile: { 
      logoUrl, 
      title, 
      description, 
      loginButtonText, 
      loginButtonUrl,
      headerBgUrl: headerBgUrl || undefined,
      features: features.length > 0 ? features : FALLBACK_DATA.profile.features
    },
    socialLinks,
    homeCards: homeCards.length > 0 ? homeCards : FALLBACK_DATA.homeCards,
    aboutCards: aboutCards.length > 0 ? aboutCards : homeCards.filter(c => c.type === "من نحن"),
    artworkCards,
    videoCards,
    coursesCards,
    toolsCards,
    contactCards
  };
}

// Client-side authentication fallback (Apps Script proxy OR Direct Sheets validation)
export async function loginSubscriberDirect(usernameInput: string, passwordInput: string, deviceId: string): Promise<any> {
  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";

  // 1. If Apps Script URL is provided via environment variables, use it securely
  if (scriptUrl) {
    try {
      // Direct POST to Google Apps Script Web App
      const response = await fetch(scriptUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginUser",
          username: usernameInput,
          password: passwordInput,
          deviceId: deviceId
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Apps Script POST failed or CORS blocked. Trying JSONP fallback GET request...", e);
      try {
        // Fallback GET request to Apps Script Web App
        const getUrl = `${scriptUrl}?action=loginUser&username=${encodeURIComponent(usernameInput)}&password=${encodeURIComponent(passwordInput)}&deviceId=${encodeURIComponent(deviceId)}`;
        const response = await fetch(getUrl);
        if (response.ok) {
          return await response.json();
        }
      } catch (err) {
        console.error("Apps Script direct client communication failed:", err);
      }
    }
  }

  // 2. Direct browser-side zero-config fallback using public sheet to ensure instant deployment success!
  try {
    const rows = await getSheetValuesDirect("Settings");
    if (!rows || rows.length === 0) {
      return { success: false, message: "فشل الاتصال بجدول المشتركين" };
    }

    for (const row of rows) {
      if (!row || row.length < 27) continue;

      const sheetUsername = row[25] ? row[25].toString().trim() : "";
      const sheetPassword = row[26] ? row[26].toString().trim() : "";
      
      if (sheetUsername === usernameInput) {
        if (sheetPassword !== passwordInput) {
          return { success: false, message: "كلمة المرور غير صحيحة" };
        }

        const status = row[27] ? row[27].toString().trim() : "";
        if (status === "لا") {
          return { success: false, message: "تم منع الدخول لهذا المستخدم" };
        }

        return {
          success: true,
          subscriberName: row[1] || "مشترك",
          linkButtonText1: row[2] || "",
          linkButtonComment1: row[3] || "",
          url1: row[4] || "",
          linkButtonText2: row[5] || "",
          linkButtonComment2: row[6] || "",
          url2: row[7] || "",
          linkButtonText3: row[8] || "",
          linkButtonComment3: row[9] || "",
          url3: row[10] || "",
          linkButtonText4: row[11] || "",
          linkButtonComment4: row[12] || "",
          url4: row[13] || "",
          linkButtonText5: row[14] || "",
          linkButtonComment5: row[15] || "",
          url5: row[16] || "",
          exitButtonText: row[17] || "تسجيل الخروج",
          exitButtonComment: row[18] || ""
        };
      }
    }

    return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  } catch (error) {
    console.error("Browser-side direct login failed:", error);
    return { success: false, message: "حدث خطأ أثناء الاتصال بقاعدة البيانات المباشرة" };
  }
}

