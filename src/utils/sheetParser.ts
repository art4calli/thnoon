/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppData, SheetRow } from "../types";

const SPREADSHEET_ID = "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";

// Fallback quality data
export const FALLBACK_DATA: AppData = {
  profile: {
    logoUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=300",
    title: "مؤسسة يوسف ذنون للخط العربي",
    description: "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.",
    loginButtonText: "بوابة المشتركين",
    loginButtonUrl: "#login"
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
  if (!row || row.length < 2) return null;
  const type = row[0] ? row[0].toString().trim() : "";
  const title = row[1] ? row[1].toString().trim() : "";
  const description = row[2] ? row[2].toString().trim() : "";
  
  if (!type && !title && !description) return null;

  const media: { url: string; pairUrl?: string }[] = [];
  
  for (let j = 3; j <= 11; j += 2) {
    const url = row[j] ? row[j].toString().trim() : "";
    const pairUrl = row[j+1] ? row[j+1].toString().trim() : "";
    if (url && url !== "-") {
      media.push({ url, pairUrl: (pairUrl && pairUrl !== "-") ? pairUrl : undefined });
    } else if (pairUrl && pairUrl !== "-") {
      media.push({ url: pairUrl });
    }
  }

  const linkUrl = row[13] ? row[13].toString().trim() : "";

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
  let loginButtonText = "دخول";
  let loginButtonUrl = "#login";

  if (profileRows && profileRows.length > 0) {
    if (profileRows[0] && profileRows[0][2]) logoUrl = profileRows[0][2];
    if (profileRows[0] && profileRows[0][1]) title = profileRows[0][1];
    if (profileRows[1] && profileRows[1][1]) description = profileRows[1][1];
    
    for (let i = 2; i < Math.min(6, profileRows.length); i++) {
      if (profileRows[i] && profileRows[i][0] === "دخول") {
        loginButtonText = profileRows[i][0];
        loginButtonUrl = profileRows[i][2] || "#login";
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
  if (profileRows && profileRows.length > 8) {
    for (let i = 8; i < profileRows.length; i++) {
      const mapped = mapContentRow(profileRows[i]);
      if (mapped) homeCards.push(mapped);
    }
  }

  const aboutCards: SheetRow[] = [];
  if (aboutRows && aboutRows.length > 0) {
    for (const row of aboutRows) {
      const mapped = mapContentRow(row);
      if (mapped) aboutCards.push(mapped);
    }
  }

  const artworkCards: SheetRow[] = [];
  if (artworkRows && artworkRows.length > 0) {
    for (const row of artworkRows) {
      const mapped = mapContentRow(row);
      if (mapped) artworkCards.push(mapped);
    }
  }

  const videoCards: SheetRow[] = [];
  if (videoRows && videoRows.length > 0) {
    for (const row of videoRows) {
      const mapped = mapContentRow(row);
      if (mapped) videoCards.push(mapped);
    }
  }

  const coursesCards: SheetRow[] = [];
  if (coursesRows && coursesRows.length > 0) {
    for (const row of coursesRows) {
      const mapped = mapContentRow(row);
      if (mapped) coursesCards.push(mapped);
    }
  }

  const toolsCards: SheetRow[] = [];
  if (toolsRows && toolsRows.length > 0) {
    for (const row of toolsRows) {
      const mapped = mapContentRow(row);
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
    profile: { logoUrl, title, description, loginButtonText, loginButtonUrl },
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
    if (!rows || rows.length <= 1) {
      return { success: false, message: "فشل الاتصال بجدول المشتركين" };
    }

    // Row 0 is the headers, subscribers start at row 1
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 3) continue;

      const sheetUsername = row[0] ? row[0].toString().trim() : "";
      const sheetPassword = row[1] ? row[1].toString().trim() : "";
      
      if (sheetUsername.toLowerCase() === usernameInput.toLowerCase() && sheetPassword === passwordInput) {
        const subscriberName = row[2] ? row[2].toString().trim() : "مشترك";
        
        return {
          success: true,
          subscriberName,
          linkButtonText1: row[5] || "",
          linkButtonComment1: row[6] || "",
          url1: row[7] || "",
          linkButtonText2: row[8] || "",
          linkButtonComment2: row[9] || "",
          url2: row[10] || "",
          linkButtonText3: row[11] || "",
          linkButtonComment3: row[12] || "",
          url3: row[13] || "",
          linkButtonText4: row[14] || "",
          linkButtonComment4: row[15] || "",
          url4: row[16] || "",
          linkButtonText5: row[17] || "",
          linkButtonComment5: row[18] || "",
          url5: row[19] || "",
          exitButtonText: row[20] || "خروج",
          exitButtonComment: row[21] || ""
        };
      }
    }

    return { success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  } catch (error) {
    console.error("Browser-side direct login failed:", error);
    return { success: false, message: "حدث خطأ أثناء الاتصال بقاعدة البيانات المباشرة" };
  }
}

