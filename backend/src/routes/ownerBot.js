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

  const maskPhone = (p) => p ? `***${String(p).slice(-4)}` : '-';

  const todayText = todayAppts.length
    ? todayAppts.map(a => {
        const time = a.starts_at.slice(11, 16);
        return `  • ${time} — ${a.customer_name || 'לקוח'} | ${a.service_name || '-'} | ₪${a.price || 0} | ${maskPhone(a.customer_phone)}`;
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
    ? topCustomers.map((c, i) => `  ${i + 1}. ${c.name || 'לא ידוע'} | ${maskPhone(c.whatsapp_phone)} | ${c.total_visits} ביקורים | ₪${c.spent}`).join('\n')
    : '  אין נתונים';

  return `אתה טורי — עוזר ניהול חכם לבעל העסק. ענה רק בעברית.

חוק ברזל: תשובה = 1-2 שורות בדיוק. לא יותר. ישירות לנקודה, ללא הקדמות, ללא הסברים, ללא חזרה על השאלה.
אסור: "בדקתי את...", "על פי הנתונים...", "שמחתי לעזור", "האם יש עוד?", כל פתיח מיותר.
מותר: עובדה + שאלת המשך קצרה אם צריך לפעול.

══ נתוני העסק ══
שם: ${biz?.name || 'לא ידוע'} | סוג: ${biz?.type || '-'} | עיר: ${biz?.city || '-'}
היום: ${todayFormatted}

══ שעות פעילות ══
${hoursText}

══ שירותים ══
${servicesText}

══ צוות ══
${staffText}

══ החודש ══
תורים: ${monthStats?.total_appointments || 0} | הושלמו: ${monthStats?.completed || 0} | בוטלו: ${monthStats?.cancelled || 0} | הכנסה: ₪${monthStats?.revenue || 0}

══ לקוחות ══
סה"כ: ${totalCustomers?.count || 0}
מובילים:
${topCustomersText}

══ תורים היום ══
${todayText}

══ תורים קרובים (7 ימים) ══
${upcomingText}

══ תבניות תשובה לשאלות נפוצות ══

"כמה תורים יש לי היום?" / "מה יש לי היום?"
→ "X תורים היום: 10:00 דני, 12:30 רונית, 15:00 משה." (אם אין: "אין תורים היום.")

"מי הבא?" / "מה התור הבא?"
→ "הבא: [שם] ב-[שעה] ([שירות])."

"מתי יש לי תור עם [שם]?"
→ "דני: [יום] [תאריך] בשעה [שעה]." (אם לא נמצא: "לא מצאתי תור ל[שם] בשבוע הקרוב.")

"האם [יום] בשעה [שעה] פנוי?"
→ אם פנוי: "כן, [שעה] [יום] פנוי — לקבוע?"
→ אם תפוס: "לא, [שעה] תפוס ([שם] [שירות])."
→ אם העסק סגור: "העסק סגור ב[יום]."

"כמה הרווחתי החודש?" / "מה ההכנסה?"
→ "₪[סכום] החודש ([X] תורים שהושלמו)."

"כמה לקוחות יש לי?"
→ "[מספר] לקוחות רשומים."

"מי הלקוח הכי טוב / הכי נאמן?"
→ "[שם] — [X] ביקורים, ₪[סכום] סה"כ."

"מה הטלפון של [שם]?"
→ "[טלפון]." (אם לא נמצא: "אין לי טלפון של [שם].")

"מה השירותים שלי?" / "כמה עולה [שירות]?"
→ "[שירות]: ₪[מחיר], [X] דקות." (או רשימה קצרה)

"מה השעות שלי?"
→ "[ימים ושעות בשורה אחת]."

"כמה תורים בוטלו החודש?"
→ "[X] ביטולים החודש."

"יש לי כמה תורים השבוע?"
→ "[X] תורים בשבוע הקרוב." (+ שם ויום אם 3 ומטה)

"מי לא הגיע / ביטל לאחרונה?"
→ "[X] ביטולים החודש. (אין מידע על נו-שואו לפי לקוח)."

ברכה (היי/שלום/מה שלומך):
→ "שלום! במה אפשר לעזור?"

שאלה לא ברורה / לא רלוונטית:
→ "לא הבנתי — תנסח מחדש?"

אין מידע:
→ "אין לי מידע על כך."

══ פעולות ══

קביעת תור:
- לקוח קיים (שם מוכר מרשימת הלקוחות): אסוף שם, שירות, תאריך, שעה. ללא צורך בטלפון.
  כשמוכן: BOOK:{שם}||{שירות}|{תאריך}|{שעה}
- לקוח חדש (שם לא מוכר): חייב לאסוף גם מספר טלפון.
  כשמוכן: BOOK:{שם}|{טלפון}|{שירות}|{תאריך}|{שעה}
אם חסר פרט — שאל רק על הפרט החסר.
(ללא טקסט לאחר ה-BOOK)

ביטול תור — אסוף: שם לקוח + תאריך/שעה.
כשברור: CANCEL:{שם}|{תאריך YYYY-MM-DD}|{שעה HH:MM}
(ללא טקסט לאחר ה-CANCEL)

כללים:
- אל תמציא נתונים
- טלפון לקוח — רק אם ביקשו במפורש לפי שם
- אל תנחש שעות פנויות מעבר לנתונים הנתונים`;
}

// ─── POST /api/owner-bot/chat ─────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.length > 2000) {
    return res.status(400).json({ error: 'message required' });
  }

  // Validate history: only user/assistant roles, string content, max 20 entries, max 10kb total
  if (!Array.isArray(history) || history.length > 20) {
    return res.status(400).json({ error: 'invalid history' });
  }
  const historyStr = JSON.stringify(history);
  if (historyStr.length > 10000) {
    return res.status(400).json({ error: 'history too large' });
  }
  const ALLOWED_ROLES = new Set(['user', 'assistant']);
  const safeHistory = history
    .filter(m => m && ALLOWED_ROLES.has(m.role) && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 500) }));

  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    return res.status(503).json({ error: 'AI not configured' });
  }

  try {
    const db = getDb();
    const ctx = getBusinessContext(db, req.business.id);
    const systemPrompt = buildSystemPrompt(ctx);

    // Build messages array: system + safeHistory (last 10) + new message
    const messages = [
      { role: 'system', content: systemPrompt },
      ...safeHistory.slice(-10),
      { role: 'user', content: message.trim() },
    ];

    // Try models in order — fallback if one is unavailable
    const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];
    let reply = null;

    for (const model of MODELS) {
      const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, messages, temperature: 0.05, max_tokens: 200 }),
      });

      const json = await groqRes.json();
      if (json.error) {
        console.warn(`[OwnerBot] Model ${model} failed:`, json.error?.message || json.error);
        continue;
      }
      reply = json.choices?.[0]?.message?.content;
      if (reply) { console.log(`[OwnerBot] Used model: ${model}`); break; }
    }

    if (!reply) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // ── Detect and execute booking action ─────────────────────────────────────
    // Format: BOOK:{customerName}|{phone or empty}|{service}|{date YYYY-MM-DD}|{time HH:MM}
    const bookMatch = reply.match(/BOOK:([^|]+)\|([^|]*)\|([^|]+)\|(\d{4}-\d{2}-\d{2})\|(\d{2}:\d{2})/);
    if (bookMatch) {
      const [, customerName, phone, serviceName, date, time] = bookMatch;
      try {
        const svc = ctx.services.find(s => s.name.includes(serviceName.trim()) || serviceName.trim().includes(s.name));
        const dur = svc?.duration_minutes || 30;
        const startsAt = `${date}T${time}:00`;
        const endDate = new Date(new Date(startsAt).getTime() + dur * 60000);
        const _p = n => String(n).padStart(2, '0');
        const endsAt = `${endDate.getFullYear()}-${_p(endDate.getMonth()+1)}-${_p(endDate.getDate())}T${_p(endDate.getHours())}:${_p(endDate.getMinutes())}:00`;
        const cleanPhone = phone.replace(/[\s\-]/g, '');

        // Check if customer exists by name first
        const existingByName = db.prepare(
          `SELECT id FROM customers WHERE business_id = ? AND name = ? COLLATE NOCASE LIMIT 1`
        ).get(req.business.id, customerName.trim());

        // New customer with no phone — ask for it
        if (!existingByName && !cleanPhone) {
          return res.json({ reply: `מה מספר הטלפון של ${customerName.trim()}?` });
        }

        // Conflict check + INSERT in a single exclusive transaction to prevent race conditions
        const bookTransaction = db.transaction(() => {
          const conflict = db.prepare(
            `SELECT id FROM appointments WHERE business_id = ? AND status != 'cancelled' AND starts_at < ? AND ends_at > ?`
          ).get(req.business.id, endsAt, startsAt);
          if (conflict) return { conflict: true };

          let customer = existingByName;
          if (!customer) {
            // New customer — create with phone
            const r = db.prepare('INSERT INTO customers (business_id, whatsapp_phone, name) VALUES (?, ?, ?)').run(req.business.id, cleanPhone, customerName.trim());
            customer = { id: r.lastInsertRowid };
          }

          const staff = ctx.staff[0];
          db.prepare(`INSERT INTO appointments (business_id, customer_id, staff_id, service_id, starts_at, ends_at, price, status, source) VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'owner_bot')`)
            .run(req.business.id, customer.id, staff?.id || null, svc?.id || null, startsAt, endsAt, svc?.price || null);
          return { conflict: false };
        });

        const txResult = bookTransaction();
        if (txResult.conflict) {
          return res.json({ reply: `השעה ${time} תפוסה — יש כבר תור באותה שעה. תרצה לבחור שעה אחרת?` });
        }

        const io = req.app.get('io');
        if (io) io.to(`business_${req.business.id}`).emit('appointment:created', { starts_at: startsAt });

        const humanReply = reply.replace(/BOOK:[^\n]+/, `✓ נקבע תור ל${customerName.trim()} ב-${date} בשעה ${time}${svc ? ` (${svc.name})` : ''}.`);
        return res.json({ reply: humanReply });
      } catch (bookErr) {
        console.error('[OwnerBot] Booking error:', bookErr.message);
      }
    }

    // ── Detect and execute cancel action ──────────────────────────────────────
    // Format: CANCEL:{customerName}|{date YYYY-MM-DD}|{time HH:MM}
    const cancelMatch = reply.match(/CANCEL:([^|]+)\|(\d{4}-\d{2}-\d{2})\|(\d{2}:\d{2})/);
    if (cancelMatch) {
      const [, customerName, date, time] = cancelMatch;
      try {
        const startsAt = `${date}T${time}:00`;
        // Find by name+date, order by time proximity (in case AI gets the time slightly off)
        const appt = db.prepare(`
          SELECT a.id FROM appointments a
          LEFT JOIN customers c ON a.customer_id = c.id
          WHERE a.business_id = ? AND a.status != 'cancelled'
            AND date(a.starts_at) = ?
            AND (c.name LIKE ? OR c.name = ?)
          ORDER BY ABS(
            CAST(strftime('%H', a.starts_at) AS INTEGER) * 60 +
            CAST(strftime('%M', a.starts_at) AS INTEGER) -
            (CAST(substr(?, 1, 2) AS INTEGER) * 60 + CAST(substr(?, 4, 2) AS INTEGER))
          ) ASC
          LIMIT 1
        `).get(req.business.id, date, `%${customerName.trim()}%`, customerName.trim(), time, time);

        if (!appt) {
          return res.json({ reply: `לא מצאתי תור של ${customerName.trim()} ב-${date} בשעה ${time}.` });
        }

        db.prepare(`UPDATE appointments SET status = 'cancelled' WHERE id = ?`).run(appt.id);
        const io = req.app.get('io');
        if (io) io.to(`business_${req.business.id}`).emit('appointment:cancelled', { id: appt.id });
        return res.json({ reply: `✓ התור של ${customerName.trim()} ב-${date} בשעה ${time} בוטל.` });
      } catch (cancelErr) {
        console.error('[OwnerBot] Cancel error:', cancelErr.message);
      }
    }

    res.json({ reply });
  } catch (err) {
    console.error('[OwnerBot] Error:', err.message);
    res.status(500).json({ error: 'שגיאה פנימית, נסה שוב' });
  }
});

module.exports = router;
