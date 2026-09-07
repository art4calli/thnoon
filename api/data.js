export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // On Vercel, the frontend automatically falls back to fetching directly from Google Sheets
  return res.status(200).json({ success: true, message: "Use direct sheets" });
}
