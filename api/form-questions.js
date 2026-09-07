export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const scriptUrl = process.env.VITE_GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbzg150YtJZ3uJ8g2WQ5KX94WUKqdZMG3F7m6rdUaoJDqMSzfyuONxWYgT9dL1P6bBx3aw/exec";

  try {
    const gasResponse = await fetch(`${scriptUrl}?action=getFormQuestions&sheet=RegistrationQuestions`);
    const data = await gasResponse.json().catch(() => null);
    if (data && data.questions) {
      return res.status(200).json(data);
    }
  } catch (e) {}

  return res.status(200).json({ questions: [] });
}
