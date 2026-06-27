import express from "express";
import path from "path";
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
  contactCards: []
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
  if (!row || row.length < 2) return null;
  const type = row[0] ? row[0].toString().trim() : "";
  const title = row[1] ? row[1].toString().trim() : "";
  const description = row[2] ? row[2].toString().trim() : "";
  
  if (!type && !title && !description) return null;

  const media: { url: string; pairUrl?: string }[] = [];
  
  // Media pairs are in columns 3 to 12 (D to M in Sheet)
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
    // Logo image path: data.profile[0][2]
    // Name: data.profile[0][1]
    // Subtitle: data.profile[1][1]
    // Buttons are in rows 3 to 6: data.profile[i]
    let logoUrl = FALLBACK_DATA.profile.logoUrl;
    let title = "مؤسسة يوسف ذنون للخط العربي";
    let description = "مؤسسة ثقافية فنية تعنى بالحفاظ على تراث عميد الخط العربي الأستاذ يوسف ذنون ونشر فنون الخط والزخرفة الإسلامية.";
    let loginButtonText = "دخول";
    let loginButtonUrl = "#login";

    if (profileRows && profileRows.length > 0) {
      if (profileRows[0] && profileRows[0][2]) logoUrl = profileRows[0][2];
      if (profileRows[0] && profileRows[0][1]) title = profileRows[0][1];
      if (profileRows[1] && profileRows[1][1]) description = profileRows[1][1];
      
      // Look for a login button
      for (let i = 2; i < Math.min(6, profileRows.length); i++) {
        if (profileRows[i] && profileRows[i][0] === "دخول") {
          loginButtonText = profileRows[i][0];
          loginButtonUrl = profileRows[i][2] || "#login";
        }
      }
    }

    // Social Links from Contact rows
    // data.contact[0][0]: Facebook
    // data.contact[0][1]: Instagram
    // data.contact[0][2]: YouTube
    // data.contact[0][3]: Line
    let socialLinks = { ...FALLBACK_DATA.socialLinks };
    if (contactRows && contactRows.length > 0 && contactRows[0]) {
      socialLinks.facebook = contactRows[0][0] || socialLinks.facebook;
      socialLinks.instagram = contactRows[0][1] || socialLinks.instagram;
      socialLinks.youtube = contactRows[0][2] || socialLinks.youtube;
      socialLinks.line = contactRows[0][3] || socialLinks.line;
    }

    // Process Cards for each category
    // Home Cards: starting at row 9 (index 8 of sliced, which is index 8 of profileRows)
    const homeCards: any[] = [];
    if (profileRows && profileRows.length > 8) {
      for (let i = 8; i < profileRows.length; i++) {
        const mapped = mapContentRow(profileRows[i]);
        if (mapped) homeCards.push(mapped);
      }
    }

    // About Cards
    const aboutCards: any[] = [];
    if (aboutRows && aboutRows.length > 0) {
      for (const row of aboutRows) {
        const mapped = mapContentRow(row);
        if (mapped) aboutCards.push(mapped);
      }
    }

    // Artwork Cards
    const artworkCards: any[] = [];
    if (artworkRows && artworkRows.length > 0) {
      for (const row of artworkRows) {
        const mapped = mapContentRow(row);
        if (mapped) artworkCards.push(mapped);
      }
    }

    // Video Cards
    const videoCards: any[] = [];
    if (videoRows && videoRows.length > 0) {
      for (const row of videoRows) {
        const mapped = mapContentRow(row);
        if (mapped) videoCards.push(mapped);
      }
    }

    // Courses Cards
    const coursesCards: any[] = [];
    if (coursesRows && coursesRows.length > 0) {
      for (const row of coursesRows) {
        const mapped = mapContentRow(row);
        if (mapped) coursesCards.push(mapped);
      }
    }

    // Tools Cards
    const toolsCards: any[] = [];
    if (toolsRows && toolsRows.length > 0) {
      for (const row of toolsRows) {
        const mapped = mapContentRow(row);
        if (mapped) toolsCards.push(mapped);
      }
    }

    // Contact Cards: starting from index 8 (row 11 of Sheet, row index 9)
    const contactCards: any[] = [];
    if (contactRows && contactRows.length > 8) {
      for (let i = 8; i < contactRows.length; i++) {
        const mapped = mapContentRow(contactRows[i]);
        if (mapped) contactCards.push(mapped);
      }
    }

    res.json({
      profile: { logoUrl, title, description, loginButtonText, loginButtonUrl },
      socialLinks,
      homeCards: homeCards.length > 0 ? homeCards : FALLBACK_DATA.homeCards,
      aboutCards: aboutCards.length > 0 ? aboutCards : homeCards.filter(c => c.type === "من نحن"),
      artworkCards,
      videoCards,
      coursesCards,
      toolsCards,
      contactCards
    });

  } catch (error) {
    console.error("Critical error building web database API:", error);
    // Serve fallback gracefully
    res.json(FALLBACK_DATA);
  }
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
