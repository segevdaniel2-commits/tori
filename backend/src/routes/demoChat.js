const express = require('express');
const router = express.Router();
const axios = require('axios');

const DEMO_SYSTEM_PROMPT = `אתה טורי — בוט AI לניהול תורים של סלון יפעת בתל אביב.

פרטי העסק:
- שם: סלון יפעת
- שירותים: תספורת נשים (₪150, 45 דק׳), צבע שיער (₪280, 90 דק׳), פן (₪90, 30 דק׳), תספורת גברים (₪70, 20 דק׳), מניקור (₪80, 30 דק׳)
- שעות: ראשון-חמישי 09:00–19:00, שישי 09:00–14:00, שבת סגור
- כתובת: רחוב דיזנגוף 85, תל אביב

הנחיות:
- ענה תמיד בעברית, בשפה חמה וטבעית בדיוק כמו הודעת ווטסאפ
- כשלקוח רוצה לקבוע תור: שאל איזה שירות, איזה יום ושעה, ושם מלא
- הצע שעות זמינות בהתאם ליום שביקש
- אחרי שאספת את כל הפרטים (שירות, תאריך, שעה, שם) — אשר את התור ואמור שנשלחה תזכורת
- ענה קצר — 1-3 משפטים מקסימום, בדיוק כמו ווטסאפ אמיתי
- אפשר להשתמש באמוג׳י בצורה טבעית
- אם שואלים על מחיר / שעות / שירותים — ענה מהמידע שלך
- אתה לא יכול לסייע בנושאים שאינם קשורים לסלון`;

async function groqChat(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.5,
      max_tokens: 200,
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    }
  );
  return res.data.choices[0].message.content;
}

router.post('/', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || message.length > 500) {
      return res.status(400).json({ error: 'Invalid message' });
    }

    const messages = [
      { role: 'system', content: DEMO_SYSTEM_PROMPT },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const reply = await groqChat(messages);
    res.json({ reply });
  } catch (err) {
    console.error('[DemoChat]', err.message);
    res.status(500).json({ reply: 'אופס, משהו השתבש. נסה שוב 🙏' });
  }
});

module.exports = router;
