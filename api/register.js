export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const scriptUrl = payload.scriptUrl || process.env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzg150YtJZ3uJ8g2WQ5KX94WUKqdZMG3F7m6rdUaoJDqMSzfyuONxWYgT9dL1P6bBx3aw/exec";

    const gasResponse = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "submitRegistration",
        ...payload,
        timestamp: payload.timestamp || new Date().toISOString()
      })
    });

    const data = await gasResponse.json().catch(() => null);
    if (data) {
      return res.status(200).json(data);
    }
    return res.status(200).json({ success: true, message: "تم إرسال طلب التسجيل بنجاح" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to forward registration" });
  }
}
