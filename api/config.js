export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    spreadsheetId: "1MAurScyKTntcUUWAoB7Qt62vwvmEnDqmYNaB0DKo9tY",
    scriptUrl: "https://script.google.com/macros/s/AKfycbzg150YtJZ3uJ8g2WQ5KX94WUKqdZMG3F7m6rdUaoJDqMSzfyuONxWYgT9dL1P6bBx3aw/exec",
    driveFolderId: "1tae6n3-tjB9vVtxr2GbK572SRtWxZ3f7"
  });
}
