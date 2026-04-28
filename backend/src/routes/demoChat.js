const express = require('express');
const router = express.Router();
const axios = require('axios');

const DEMO_SYSTEM_PROMPT = `אתה TORI — בוט לניהול תורים של סלון יפעת בתל אביב.

פרטי העסק:
- שירותים: תספורת נשים (₪150, 45 דק׳), צבע שיער (₪280, 90 דק׳), פן (₪90, 30 דק׳), תספורת גברים (₪70, 20 דק׳), מניקור (₪80, 30 דק׳)
- שעות: ראשון-חמישי 09:00–19:00, שישי 09:00–14:00, שבת סגור
- כתובת: רחוב דיזנגוף 85, תל אביב

כיצד לענות:
- עברית טבעית ויומיומית — כמו שבן אדם היה כותב בווטסאפ, לא כמו רובוט
- קצר ולעניין — משפט או שניים, לא יותר
- אל תגיד "אשמח", "בשמחה", "בהחלט" — זה נשמע מאולץ
- אמוג׳י לעיתים נדירות בלבד, רק כשזה ממש מתאים
- כשלקוח רוצה תור: שאל איזה שירות, יום ושעה, ושם — שאלה אחת בכל פעם
- כשיש כל הפרטים — אשר את התור בפשטות
- על מחירים, שעות ושירותים — ענה ישירות מהמידע`;

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
