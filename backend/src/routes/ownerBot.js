const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { getDb } = require('../config/database');

router.use(authMiddleware);

// ─── Pull business context from DB ───────────────────────────────────────────
function getBusinessContext(db, businessId) {
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';

  // Business info
  const biz = db.prepare('SELECT name, type, city, phone, plan FROM businesses WHERE id = ?').get(businessId);

  // Services
  const services = db.prepare(
    'SELECT name, duration_minutes, price FROM services WHERE business_id = ? AND is_active = 1 ORDER BY name'
  ).all(businessId);

  // Staff
  const staff = db.prepare(
    "SELECT name, role FROM staff WHERE business_id = ? AND is_active = 1"
  ).all(businessId);

  // Today's appointments
  const todayAppts = db.prepare(`
    SELECT a.starts_at, a.ends_at, a.status,
           c.name as customer_name, c.whatsapp_phone as customer_phone,
           sv.name as service_name, sv.price
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN services sv ON a.service_id = sv.id
    WHERE a.business_id = ? AND date(a.starts_at) = ? AND a.status != 'cancelled'
    ORDER BY a.starts_at
  `).all(businessId, today);

  // This month stats
  const monthStatsFixed = db.prepare(`
    SELECT
      COUNT(*) as total_appointments,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN price ELSE 0 END), 0) as revenue
    FROM appointments
    WHERE business_id = ? AND starts_at >= ?
  `).get(businessId, monthStart + 'T00:00:00');

  // Top customers
  const topCustomers = db.prepare(`
    SELECT c.name, c.whatsapp_phone, c.total_visits,
           COALESCE(SUM(CASE WHEN a.status='completed' THEN a.price ELSE 0 END),0) as spent
    FROM customers c
    LEFT JOIN appointments a ON a.customer_id = c.id
    WHERE c.business_id = ? AND c.whatsapp_phone NOT LIKE '999%'
    GROUP BY c.id
    ORDER BY spent DESC, c.total_visits DESC
    LIMIT 5
  `).all(businessId);

  // Total customers
  const totalCustomers = db.prepare(
    "SELECT COUNT(*) as count FROM customers WHERE business_id = ? AND whatsapp_phone NOT LIKE '999%'"
  ).get(businessId);

  // Upcoming appointments (next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingAppts = db.prepare(`
    SELECT a.starts_at, c.name as customer_name, c.whatsapp_phone,
           sv.name as service_name, sv.price
    FROM appointments a
    LEFT JOIN customers c ON a.customer_id = c.id
    LEFT JOIN services sv ON a.service_id = sv.id
    WHERE a.business_id = ? AND a.starts_at > ? AND a.starts_at <= ? AND a.status = 'confirmed'
    ORDER BY a.starts_at
    LIMIT 20
  `).all(businessId, new Date().toISOString(), nextWeek.toISOString());

  // Business hours
  const hours = db.prepare(
    'SELECT day_of_week, is_open, open_time, close_time FROM business_hours WHERE business_id = ? ORDER BY day_of_week'
  ).all(businessId);

  return { biz, services, staff, todayAppts, monthStats: monthStatsFixed, topCustomers, totalCustomers, upcomingAppts, hours, today };
}

// ─── Build system prompt ──────────────────────────────────────────────────────
function buildSystemPrompt(ctx) {
  const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const { biz, services, staff, todayAppts, monthStats, topCustomers, totalCustomers, upcomingAppts, hours, today } = ctx;

  const todayDate = new Date(today + 'T00:00:00');
  const todayFormatted = todayDate.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const hoursText = hours.length ? hours.map(h => {
    const day = DAY_NAMES[h.day_of_week] || h.day_of_week;
    return h.is_open ? `${day}: ${h.open_time}–${h.close_time}` : `${day}: סגור`;
  }).join(', ') : 'לא הוגדרו';

  const servicesText = services.length
    ? services.map(s => `${s.name} (${s.duration_minutes} דק׳, ₪${s.price})`).join(', ')
    : 'אין שירותים';

  const staffText = staff.length
    ? staff.map(s => `${s.name} (${s.role === 'owner' ? 'בעלים' : 'עובד'})`).join(', ')
    : 'אין עובדים';

  const todayText = todayAppts.length
    ? todayAppts.map(a => {
        const time = a.starts_at.slice(11, 16);
        return `  • ${time} — ${a.customer_name || 'לקוח'} | ${a.service_name || '-'} | ₪${a.price || 0} | ${a.customer_phone}`;
      }).join('\n')
    : '  אין תורים היום';

  const upcomingText = upcomingAppts.length
    ? upcomingAppts.map(a => {
        const dt = new Date(a.starts_at);
        const dayName = DAY_NAMES[dt.getDay()];
        const date = dt.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
        const time = a.starts_at.slice(11, 16);
        return `  • ${dayName} ${date} ${time} — ${a.customer_name || 'לקוח'} | ${a.service_name || '-'}`;
      }).join('\n')
    : '  אין תורים קרובים';

  const topCustomersText = topCustomers.length
    ? topCustomers.map((c, i) => `  ${i + 1}. ${c.name || 'לא ידוע'} | ${c.whatsapp_phone} | ${c.total_visits} ביקורים | ₪${c.spent}`).join('\n')
    : '  אין נתונים';

  return `אתה עוזר AI של בעל עסק. ענה תמיד בעברית. חובה: תשובה קצרה — משפט אחד בלבד. אל תסביר, אל תחזור על השאלה, אל תפרט. רק התשובה הישירה.
דוגמאות: "כן, 13:00 פנוי — רוצה לקבוע?" / "3 תורים היום: דני 10:00, רונית 12:00, משה 15:00." / "₪2,400 החודש." / "050-1234567 (דני)."

═══ פרטי העסק ═══
שם: ${biz?.name || 'לא ידוע'}
סוג: ${biz?.type || '-'}
עיר: ${biz?.city || '-'}
תאריך היום: ${todayFormatted}

═══ שעות פעילות ═══
${hoursText}

═══ שירותים ═══
${servicesText}

═══ צוות ═══
${staffText}

═══ סטטיסטיקות החודש ═══
סה"כ תורים: ${monthStats?.total_appointments || 0}
הושלמו: ${monthStats?.completed || 0}
בוטלו: ${monthStats?.cancelled || 0}
הכנסה (תורים שהושלמו): ₪${monthStats?.revenue || 0}

═══ לקוחות ═══
סה"כ לקוחות: ${totalCustomers?.count || 0}
לקוחות מובילים:
${topCustomersText}

═══ תורים היום ═══
${todayText}

═══ תורים קרובים (7 ימים הבאים) ═══
${upcomingText}

═══ הנחיות התנהגות ═══

סגנון תשובות:
- ענה תמיד בעברית בלבד
- תשובה = משפט אחד עד שניים בלבד, ישיר לעניין
- אל תסביר את החשיבה שלך, אל תחזור על השאלה, אל תפרט מה בדקת
- תן רק את התשובה עצמה — מספר, שם, כן/לא + פרט קצר
- דוגמאות לסגנון נכון:
  * "כן, 13:00 ביום רביעי פנוי."
  * "3 תורים היום: 10:00 דני, 12:00 רונית, 15:00 משה."
  * "הכנסה החודש: ₪2,400."
  * "הטלפון של דני: 050-1234567."

איך לענות לפי סוג שאלה:

1. תורים היום:
   - בדוק את רשימת "תורים היום" — ספור אותם והצג את השעות והלקוחות
   - אם הרשימה ריקה — אמור שאין תורים היום

2. תורים קרובים / עתידיים:
   - בדוק את רשימת "תורים קרובים (7 ימים הבאים)"
   - ציין יום, שעה ושם לקוח לכל תור
   - אם הרשימה ריקה — אמור שאין תורים קרובים

3. זמינות / האם יש תור פנוי:
   - בדוק קודם אם העסק פתוח באותו יום לפי שעות הפעילות
   - אם העסק סגור — אמור שהעסק סגור ביום הזה
   - אם העסק פתוח — בדוק אם יש תור קיים באותה שעה ברשימת התורים הקרובים
   - אם אין תור קיים באותה שעה — המשמעות היא שהשעה פנויה. ענה: "כן, [שעה] פנוי — רוצה לקבוע?"
   - אם יש תור — אמור שהשעה תפוסה

4. לקוחות:
   - אם שואלים על לקוח ספציפי — חפש בלקוחות המובילים לפי שם
   - אם שואלים על טלפון — תן את מספר הטלפון מיד
   - אם שואלים מי הכי נאמן — הצג את רשימת הלקוחות המובילים לפי ביקורים/הוצאה
   - סה"כ לקוחות — תן את המספר מיד

5. הכנסות / כספים:
   - הכנסה החודש — מתוך סטטיסטיקות החודש (תורים שהושלמו בלבד)
   - תורים שבוטלו — מתוך סטטיסטיקות החודש
   - אל תחשב הכנסות עתידיות (תורים עתידיים לא בטוח שיושלמו)

6. שירותים:
   - רשום את השירותים הזמינים עם המחיר והמשך
   - אם שואלים על מחיר שירות ספציפי — תן מיד

7. שעות פעילות:
   - הצג את שעות הפתיחה לכל יום
   - ציין אם יום מסוים סגור

8. צוות:
   - רשום את חברי הצוות ותפקידיהם

כללים חשובים:
- אל תמציא נתונים שאינם ברשימות שקיבלת
- אם מידע לא קיים — אמור "אין לי מידע על כך"
- אל תנחש — בסס תשובות על הנתונים בלבד
- שמות לקוחות וטלפונים — תן אותם כפי שהם, ללא עיבוד
- אם השאלה מעורפלת או לא קשורה לעסק — שאל "על מה אתה שואל?" או "לא הבנתי, תנסח מחדש"
- אם ברכו אותך (היי, שלום וכו') — ענה בברכה קצרה ושאל במה תוכל לעזור
- אסור להוציא טלפון של לקוח אלא אם ביקשו אותו במפורש לפי שם`;
}

// ─── POST /api/owner-bot/chat ─────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'message required' });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: 'AI not configured' });
  }

  try {
    const db = getDb();
    const ctx = getBusinessContext(db, req.business.id);
    const systemPrompt = buildSystemPrompt(ctx);

    // Build messages array: system + history (last 10) + new message
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.2,
        max_tokens: 250,
      }),
    });

    const json = await groqRes.json();
    const reply = json.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    res.json({ reply });
  } catch (err) {
    console.error('[OwnerBot] Error:', err.message);
    res.status(500).json({ error: 'AI error', detail: err.message });
  }
});

module.exports = router;
