import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// SPREADSHEET CONFIG
const SPREADSHEET_ID = "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY";

// Fallback high-quality data in case Google Sheet is not accessible
const FALLBACK_DATA = {
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
  contactCards: [],
  contactInfo: {
    badge: "نسعد دائماً بخدمتكم وتواصلكم",
    title: "تواصل معنا والتحق بنا",
    description: "لديك استفسار حول الدورات أو ترغب بطلب لوحة خطية مخصصة؟ راسلنا أو تواصل معنا عبر قنواتنا الرسمية، أو تشرفنا بزيارتك لمقر المؤسسة.",
    panelTitle: "مقر المؤسسة وقنوات التواصل",
    panelDescription: "تستقبلكم المؤسسة يومياً لاستقبال الاستفسارات وتوفير أدوات الخط الفاخرة لطلاب الحرف الشريف.",
    cards: [
      {
        title: "العنوان والموقع",
        value: "العراق، الموصل، الجانب الأيمن، قرب جامع النوري الكبير",
        icon: "map-pin"
      },
      {
        title: "رقم الهاتف",
        value: "+964 770 123 4567",
        icon: "phone"
      },
      {
        title: "البريد الإلكتروني",
        value: "info@yousifdhannoun.org",
        icon: "mail"
      },
      {
        title: "أوقات العمل",
        value: "السبت - الخميس: من ٩:٠٠ صباحاً وحتى ٥:٠٠ مساءً",
        icon: "clock"
      }
    ]
  }
};

// Parse Google Sheet JSON response
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

// Fetch sheet helper using Google Visualization API (free, needs no credentials if sheet is viewable)
async function getSheetValues(sheetName: string): Promise<any[][]> {
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
    console.error(`Error fetching sheet [${sheetName}]:`, error);
    return [];
  }
}

// Map standard row structure (N columns)
function mapContentRow(row: any[]): any {
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

// MAIN GET-DATA API ENDPOINT
app.get("/api/data", async (req, res) => {
  try {
    console.log("Fetching fresh data from Google Sheet...");
    
    const [
      profileRows,
      artworkRows,
      videoRows,
      coursesRows,
      toolsRows,
      contactRows,
      aboutRows
    ] = await Promise.all([
      getSheetValues("Profile"),
      getSheetValues("Artwork"),
      getSheetValues("فيديو"),
      getSheetValues("Courses"),
      getSheetValues("Tools"),
      getSheetValues("Contact"),
      getSheetValues("About")
    ]);

    // Parse Profile Info
    // Row 0 of profileRows (which is row 2 of the sheet): [Logo, Logo Text, Logo URL/Image]
    // Wait, the original code had:
    // Parse Profile Info
    // Row 1 (index 0) of profileRows: Table header (ignore)
    // Row 2 (index 1) of profileRows: [Column A, Title (Column B), Logo URL (Column C)]
    // Row 3 (index 2) of profileRows: [Column A, Description (Column B)]
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
    let contactInfo = { ...FALLBACK_DATA.contactInfo };
    const contactCards: any[] = [];

    // Check if contactRows contains the new structured keywords in Column A of any row
    let isNewStructuredFormat = false;
    if (contactRows && contactRows.length > 1) {
      for (let i = 1; i < contactRows.length; i++) {
        const typeVal = contactRows[i][0] ? contactRows[i][0].toString().trim() : "";
        if (
          typeVal === "شارة البداية" ||
          typeVal === "العنوان الرئيسي" ||
          typeVal === "الوصف الرئيسي" ||
          typeVal === "عنوان اللوحة" ||
          typeVal === "وصف اللوحة" ||
          typeVal === "بطاقة تواصل" ||
          typeVal === "فيسبوك" ||
          typeVal === "إنستغرام" ||
          typeVal === "يوتيوب" ||
          typeVal === "لاين"
        ) {
          isNewStructuredFormat = true;
          break;
        }
      }
    }

    if (isNewStructuredFormat && contactRows) {
      const parsedCards: any[] = [];
      let badge = FALLBACK_DATA.contactInfo?.badge;
      let titleText = FALLBACK_DATA.contactInfo?.title;
      let descText = FALLBACK_DATA.contactInfo?.description;
      let panelTitleText = FALLBACK_DATA.contactInfo?.panelTitle;
      let panelDescText = FALLBACK_DATA.contactInfo?.panelDescription;

      for (let i = 1; i < contactRows.length; i++) {
        const row = contactRows[i];
        if (!row || row.length === 0) continue;

        const rowType = row[0] ? row[0].toString().trim() : "";
        const rowTitle = row[1] ? row[1].toString().trim() : "";
        const rowValue = row[2] ? row[2].toString().trim() : "";
        const rowIconLink = row[3] ? row[3].toString().trim() : "";

        if (rowType === "شارة البداية") {
          badge = rowValue || rowTitle || badge;
        } else if (rowType === "العنوان الرئيسي") {
          titleText = rowValue || rowTitle || titleText;
        } else if (rowType === "الوصف الرئيسي") {
          descText = rowValue || rowTitle || descText;
        } else if (rowType === "عنوان اللوحة") {
          panelTitleText = rowValue || rowTitle || panelTitleText;
        } else if (rowType === "وصف اللوحة") {
          panelDescText = rowValue || rowTitle || panelDescText;
        } else if (rowType === "بطاقة تواصل") {
          if (rowTitle || rowValue) {
            parsedCards.push({
              title: rowTitle,
              value: rowValue,
              icon: rowIconLink || "star"
            });
          }
        } else if (rowType === "فيسبوك") {
          socialLinks.facebook = rowValue || rowIconLink || socialLinks.facebook;
        } else if (rowType === "إنستغرام") {
          socialLinks.instagram = rowValue || rowIconLink || socialLinks.instagram;
        } else if (rowType === "يوتيوب") {
          socialLinks.youtube = rowValue || rowIconLink || socialLinks.youtube;
        } else if (rowType === "لاين") {
          socialLinks.line = rowValue || rowIconLink || socialLinks.line;
        }
      }

      contactInfo = {
        badge,
        title: titleText,
        description: descText,
        panelTitle: panelTitleText,
        panelDescription: panelDescText,
        cards: parsedCards.length > 0 ? parsedCards : (FALLBACK_DATA.contactInfo?.cards || [])
      };
    } else {
      // Old style fallback:
      if (contactRows && contactRows.length > 0 && contactRows[0]) {
        socialLinks.facebook = contactRows[0][0] || socialLinks.facebook;
        socialLinks.instagram = contactRows[0][1] || socialLinks.instagram;
        socialLinks.youtube = contactRows[0][2] || socialLinks.youtube;
        socialLinks.line = contactRows[0][3] || socialLinks.line;
      }

      if (contactRows && contactRows.length > 8) {
        for (let i = 8; i < contactRows.length; i++) {
          const mapped = mapContentRow(contactRows[i]);
          if (mapped) contactCards.push(mapped);
        }
      }
    }

    // Process Cards for each category
    // Home Cards: starting at row 11 (index 10 of profileRows)
    const homeCards: any[] = [];
    if (profileRows && profileRows.length > 10) {
      for (let i = 10; i < profileRows.length; i++) {
        const mapped = mapContentRow(profileRows[i]);
        if (mapped) homeCards.push(mapped);
      }
    }

    // About Cards: starts at row 2 (index 1)
    const aboutCards: any[] = [];
    if (aboutRows && aboutRows.length > 1) {
      for (let i = 1; i < aboutRows.length; i++) {
        const mapped = mapContentRow(aboutRows[i]);
        if (mapped) aboutCards.push(mapped);
      }
    }

    // Artwork Cards: starts at row 2 (index 1)
    const artworkCards: any[] = [];
    if (artworkRows && artworkRows.length > 1) {
      for (let i = 1; i < artworkRows.length; i++) {
        const mapped = mapContentRow(artworkRows[i]);
        if (mapped) artworkCards.push(mapped);
      }
    }

    // Video Cards: starts at row 2 (index 1)
    const videoCards: any[] = [];
    if (videoRows && videoRows.length > 1) {
      for (let i = 1; i < videoRows.length; i++) {
        const mapped = mapContentRow(videoRows[i]);
        if (mapped) videoCards.push(mapped);
      }
    }

    // Courses Cards: starts at row 2 (index 1)
    const coursesCards: any[] = [];
    if (coursesRows && coursesRows.length > 1) {
      for (let i = 1; i < coursesRows.length; i++) {
        const mapped = mapContentRow(coursesRows[i]);
        if (mapped) coursesCards.push(mapped);
      }
    }

    // Tools Cards: starts at row 2 (index 1)
    const toolsCards: any[] = [];
    if (toolsRows && toolsRows.length > 1) {
      for (let i = 1; i < toolsRows.length; i++) {
        const mapped = mapContentRow(toolsRows[i]);
        if (mapped) toolsCards.push(mapped);
      }
    }

    res.json({
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
      contactCards,
      contactInfo
    });

  } catch (error) {
    console.error("Critical error building web database API:", error);
    // Serve fallback gracefully
    res.json(FALLBACK_DATA);
  }
});

// INQUIRY/CONTACT SUBMISSION ENDPOINT
app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !message) {
    return res.status(400).json({ success: false, message: "الرجاء إدخال الاسم الكريم والرسالة" });
  }

  const timestamp = new Date().toISOString();
  const inquiryData = {
    name,
    email: email || "",
    subject: subject || "",
    message,
    timestamp
  };

  // 1. Save locally to a JSON file so messages are NEVER lost and can be inspected locally
  const dataDir = path.join(process.cwd(), "data");
  const messagesFile = path.join(dataDir, "messages.json");

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let existingMessages = [];
    if (fs.existsSync(messagesFile)) {
      try {
        const fileContent = fs.readFileSync(messagesFile, "utf-8");
        existingMessages = JSON.parse(fileContent);
      } catch (e) {
        console.error("Error reading existing messages file, resetting...", e);
      }
    }

    existingMessages.push(inquiryData);
    fs.writeFileSync(messagesFile, JSON.stringify(existingMessages, null, 2), "utf-8");
    console.log("Inquiry saved locally to data/messages.json");
  } catch (err) {
    console.error("Failed to write inquiry locally:", err);
  }

  // 2. Proxy/Forward to Google Apps Script Web App if GOOGLE_SCRIPT_URL is configured
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (scriptUrl) {
    try {
      console.log("Proxying contact submission to Google Apps Script Web App...");
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submitInquiry",
          name,
          email,
          subject,
          message,
          timestamp
        })
      });
      const data = await response.json();
      return res.json({
        success: true,
        message: "تم حفظ الاستفسار بنجاح ومزامنته مع جدول البيانات",
        synced: true,
        data
      });
    } catch (err) {
      console.error("Failed to proxy inquiry to Google Apps Script:", err);
      // Fallback gracefully since we already saved it locally
      return res.json({
        success: true,
        message: "تم حفظ الاستفسار محلياً على الخادم (حدثت مشكلة أثناء المزامنة التلقائية مع جوجل شيت)",
        synced: false
      });
    }
  }

  // If no scriptUrl is set, return success
  return res.json({
    success: true,
    message: "تم حفظ الاستفسار محلياً بنجاح",
    synced: false
  });
});

// LOGIN AUTHENTICATION ENDPOINT
app.post("/api/login", async (req, res) => {
  const { username, password, deviceId, lat, lng } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: "الرجاء إدخال اسم المستخدم وكلمة المرور" });
  }

  // If Google Apps Script Web App URL is configured, proxy to it for full read/write operations
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (scriptUrl) {
    try {
      console.log("Proxying auth to Google Apps Script Web App...");
      const response = await fetch(scriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "loginUser",
          username,
          password,
          deviceId,
          lat,
          lng
        })
      });
      const data = await response.json();
      return res.json(data);
    } catch (err) {
      console.error("Failed to proxy authentication to Google Apps Script:", err);
      // Fallback to local Sheet parsing below...
    }
  }

  // Direct read-only fallback via Google Visualization API
  try {
    console.log(`Authenticating user directly against Google Sheets Settings sheet...`);
    const settingsRows = await getSheetValues("Settings");

    if (!settingsRows || settingsRows.length === 0) {
      return res.status(500).json({ success: false, message: "فشل التحقق من قاعدة البيانات" });
    }

    // Col Z is index 25, Col AA is 26, Col AB is 27
    let userRow: any[] | null = null;
    for (const r of settingsRows) {
      const u = r[25]?.toString().trim();
      const p = r[26]?.toString().trim();
      if (u === username) {
        if (p !== password) {
          return res.json({ success: false, message: "كلمة المرور غير صحيحة" });
        }
        userRow = r;
        break;
      }
    }

    if (!userRow) {
      return res.json({ success: false, message: "مستخدم غير موجود" });
    }

    const status = userRow[27]?.toString().trim();
    if (status === "لا") {
      return res.json({ success: false, message: "تم منع الدخول لهذا المستخدم" });
    }

    // Read subscriber details directly
    return res.json({
      success: true,
      subscriberName: userRow[1] || "مشترك",
      linkButtonText1: userRow[2] || "",
      linkButtonComment1: userRow[3] || "",
      url1: userRow[4] || "",
      linkButtonText2: userRow[5] || "",
      linkButtonComment2: userRow[6] || "",
      url2: userRow[7] || "",
      linkButtonText3: userRow[8] || "",
      linkButtonComment3: userRow[9] || "",
      url3: userRow[10] || "",
      linkButtonText4: userRow[11] || "",
      linkButtonComment4: userRow[12] || "",
      url4: userRow[13] || "",
      linkButtonText5: userRow[14] || "",
      linkButtonComment5: userRow[15] || "",
      url5: userRow[16] || "",
      exitButtonText: userRow[17] || "تسجيل الخروج",
      exitButtonComment: userRow[18] || ""
    });

  } catch (error) {
    console.error("Local login parsing error:", error);
    return res.status(500).json({ success: false, message: "حدث خطأ أثناء الاتصال بقاعدة البيانات" });
  }
});

// START EXPRESS + VITE SERVER
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
