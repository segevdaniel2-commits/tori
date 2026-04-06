const axios = require('axios');
const { getDb } = require('../config/database');

async function groqChat(messages, temperature = 0.4, maxTokens = 600) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'];
  let lastErr;
  for (const model of models) {
    try {
      const res = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        { model, messages, temperature, max_tokens: maxTokens, response_format: { type: 'json_object' } },
        { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      return res.data.choices[0].message.content;
    } catch (err) {
      const detail = err.response?.data?.error?.message || err.message;
      console.error(`[AI] Groq error (${model}):`, detail);
      lastErr = err;
    }
  }
  throw lastErr;
}

// ─── Hebrew helpers ───────────────────────────────────────────────────────────

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

const HEBREW_NUMBER_WORDS = {
  'אחת': 1, 'אחד': 1, 'שתיים': 2, 'שניים': 2, 'שתי': 2, 'שני': 2,
  'שלוש': 3, 'שלשה': 3, 'ארבע': 4, 'ארבעה': 4, 'חמש': 5, 'חמישה': 5,
  'שש': 6, 'ששה': 6, 'שבע': 7, 'שבעה': 7, 'שמונה': 8, 'תשע': 9, 'תשעה': 9,
  'עשר': 10, 'עשרה': 10, 'אחת עשרה': 11, 'שתים עשרה': 12, 'שלוש עשרה': 13,
  'ארבע עשרה': 14, 'חמש עשרה': 15, 'שש עשרה': 16, 'שבע עשרה': 17,
  'שמונה עשרה': 18, 'תשע עשרה': 19, 'עשרים': 20,
};

function resolveHebrewDate(text) {
  const now = new Date();
  const lower = text.toLowerCase();

  if (/היום|עכשיו/.test(lower)) return formatDate(now);
  if (/מחר/.test(lower)) { const d = new Date(now); d.setDate(d.getDate() + 1); return formatDate(d); }
  if (/מחרתיים/.test(lower)) { const d = new Date(now); d.setDate(d.getDate() + 2); return formatDate(d); }
  if (/שלשום/.test(lower)) { const d = new Date(now); d.setDate(d.getDate() - 1); return formatDate(d); }

  // Day of week match (next occurrence)
  for (let i = 0; i < HEBREW_DAYS.length; i++) {
    if (lower.includes(HEBREW_DAYS[i])) {
      const d = new Date(now);
      const diff = (i - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
      return formatDate(d);
    }
  }

  // DD/MM pattern
  const ddmm = lower.match(/(\d{1,2})[\/\.\-](\d{1,2})/);
  if (ddmm) {
    const day = parseInt(ddmm[1]);
    const month = parseInt(ddmm[2]) - 1;
    const d = new Date(now.getFullYear(), month, day);
    if (d < now) d.setFullYear(d.getFullYear() + 1);
    return formatDate(d);
  }

  // Month name
  for (let i = 0; i < HEBREW_MONTHS.length; i++) {
    if (lower.includes(HEBREW_MONTHS[i])) {
      const numMatch = lower.match(/(\d{1,2})/);
      if (numMatch) {
        const d = new Date(now.getFullYear(), i, parseInt(numMatch[1]));
        if (d < now) d.setFullYear(d.getFullYear() + 1);
        return formatDate(d);
      }
    }
  }

  return null;
}

function resolveHebrewTime(text) {
  const lower = text.toLowerCase();

  // Explicit time: 14:00, 2:30, 14.30
  const explicit = lower.match(/(\d{1,2})[:.](\d{2})/);
  if (explicit) {
    const h = parseInt(explicit[1]);
    const m = parseInt(explicit[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // "בשלוש", "בארבע" etc
  for (const [word, num] of Object.entries(HEBREW_NUMBER_WORDS)) {
    if (lower.includes(`ב${word}`) || lower.includes(word)) {
      let h = num;
      if (/אחה"צ|אחרי הצהריים|אחה״צ/.test(lower) && h < 12) h += 12;
      if (/בוקר/.test(lower) && h === 12) h = 0;
      if (h >= 7 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
    }
  }

  // Number only: "ב9", "ב10"
  const numOnly = lower.match(/ב(\d{1,2})(?::(\d{2}))?/);
  if (numOnly) {
    let h = parseInt(numOnly[1]);
    const m = numOnly[2] ? parseInt(numOnly[2]) : 0;
    if (/אחה"צ|אחרי הצהריים/.test(lower) && h < 12) h += 12;
    if (h >= 7 && h <= 23) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return null;
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatHebrewDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} (${HEBREW_DAYS[d.getDay()]})`;
}

// ─── Availability helpers ──────────────────────────────────────────────────

function isBusinessOpen(business, hours, dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const dayHours = hours.find(h => h.day_of_week === dayOfWeek);
  if (!dayHours || !dayHours.is_open) return false;
  return true;
}

function getAvailableSlots(db, business, staff, service, dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const hours = db.prepare('SELECT * FROM business_hours WHERE business_id = ? AND day_of_week = ?').get(business.id, dayOfWeek);

  if (!hours || !hours.is_open) return [];

  const [openH, openM] = hours.open_time.split(':').map(Number);
  const [closeH, closeM] = hours.close_time.split(':').map(Number);
  const duration = service ? service.duration_minutes : 30;
  const buffer = business.buffer_minutes || 15;

  const startMinutes = openH * 60 + openM;
  const endMinutes = closeH * 60 + closeM;

  // Get existing appointments and blocked times for this day
  const staffId = staff ? staff.id : null;
  const existingAppts = db.prepare(`
    SELECT starts_at, ends_at FROM appointments
    WHERE business_id = ? AND (staff_id = ? OR ? IS NULL)
      AND date(starts_at) = ? AND status NOT IN ('cancelled')
  `).all(business.id, staffId, staffId, dateStr);

  const blocked = db.prepare(`
    SELECT starts_at, ends_at FROM blocked_times
    WHERE business_id = ? AND (staff_id = ? OR staff_id IS NULL) AND date(starts_at) = ?
  `).all(business.id, staffId, dateStr);

  const busy = [...existingAppts, ...blocked].map(b => ({
    start: timeToMinutes(b.starts_at.split('T')[1]?.slice(0, 5) || b.starts_at.slice(11, 16)),
    end: timeToMinutes(b.ends_at.split('T')[1]?.slice(0, 5) || b.ends_at.slice(11, 16)),
  }));

  const slots = [];
  let cursor = startMinutes;

  while (cursor + duration <= endMinutes) {
    const slotEnd = cursor + duration;
    const isBusy = busy.some(b => cursor < b.end + buffer && slotEnd > b.start - buffer);
    if (!isBusy) {
      slots.push(minutesToTime(cursor));
    }
    cursor += 30; // 30-min increments
  }

  return slots;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(m) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// ─── System prompt builders ───────────────────────────────────────────────────

function buildSelectionPrompt(businesses) {
  const list = businesses.map((b, i) => `${i + 1}. *${b.name}* ${b.city || b.address || ''}`).join('\n');
  return `אתה טורי (Tori) - עוזר חכם לתיאום תורים בוואטסאפ.

אתה מדבר בעברית בלבד, בגובה העיניים, קצר ולעניין.
תפקידך עכשיו: לברר לאיזה עסק הלקוח מחפש תור.

רשימת העסקים הרשומים במערכת:
${list}

כשהלקוח מציין עסק, ענה עם JSON בפורמט:
{"selected_business_id": <מספר>, "message": "<הודעה בעברית>"}

אם הלקוח שאל שאלה כללית, ענה ידידותי ובקש ממנו לבחור עסק.
אם אתה לא מזהה את העסק, שאל שוב בנעימות.

ענה תמיד ב-JSON בלבד:
{"selected_business_id": null, "message": "<הודעה>"}
או
{"selected_business_id": <id>, "message": "<הודעה>"}`;
}

const TONE_PROMPTS = {
  friendly: `סגנון: חבר סחבק — "אחי", "סבבה", "יאללה", עממי לחלוטין. שעות במילים: "בשלוש", "בשלוש וחצי".`,
  professional: `סגנון: מקצועי ורגיל — ישיר, עבודה בלבד. שעות במילים: "בשלוש", "בארבע".`,
  formal: `סגנון: רשמי ויוקרתי — סמכותי כמו מלצר במסעדת יוקרה, פניות מכובדות. שעות במספרים: "15:00", "15:30".`,
};

function buildBusinessSystemPrompt(business, staffList, services, customer, hours, lockedStaff) {
  const servicesText = services.length
    ? services.map(s => `- ${s.name}: ${s.duration_minutes} דק׳, ₪${s.price}`).join('\n')
    : '- אין שירותים מוגדרים עדיין';
  const staffText = lockedStaff
    ? `- ${lockedStaff.name} (${lockedStaff.role || 'מטפל'}) — נבחר על ידי הלקוח`
    : staffList.length
      ? staffList.map(s => `- ${s.name} (${s.role || 'מטפל'})`).join('\n')
      : '- אין עובדים מוגדרים עדיין';
  const hoursText = hours.length
    ? hours.map(h => {
        const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        return `${days[h.day_of_week]}: ${h.is_open ? `${h.open_time}–${h.close_time}` : 'סגור'}`;
      }).join(' | ')
    : 'שעות לא מוגדרות';

  const customerName = customer?.name || null;
  const tone = TONE_PROMPTS[business.bot_tone] || TONE_PROMPTS.friendly;

  return `אתה טורי — הבוט של "${business.name}".
${business.description ? `על העסק: ${business.description}` : ''}

שעות פעילות: ${hoursText}
צוות: ${staffText}
שירותים: ${servicesText}
${customerName ? `לקוח: ${customerName}` : 'לקוח חדש — שאל שם ושם משפחה לפני הכל (פעם אחת בלבד, נשמר לתמיד)'}

===
${TONE_PROMPTS[business.bot_tone] || TONE_PROMPTS.professional}

כללי תפעול:
1. **מינימליזם** — תשובה קצרה ביותר. דוגמה: "יש תור בשלוש?" → "כן, לקבוע?"
2. **שם** — שאל שם ושם משפחה פעם אחת בלבד בתחילת הקשר. לאחר מכן השתמש בשם תמיד.
3. **זמינות** — בדוק לפי השעות הפנויות שמסופקות. אם תפוס — הצע שתי חלופות (אחת לפני, אחת אחרי).
4. **אישור** — אחרי "כן"/"סבבה"/"בסדר" רשום רק: "סגרנו תור ל[תאריך] ב[שעה]" ותו לא. פרטים נוספים רק אם הלקוח מבקש.
5. **החלפת עסק** — רק אם הלקוח מבקש במפורש ומאשר פעמיים.
6. **מחיר/פרט לא ידוע** — "אעביר לבעל העסק, נשריין?"
7. **כתובת/טלפון** — רק באישור סופי.
8. **אל תמציא** שירותים או מחירים שלא ברשימה.

ענה תמיד ב-JSON בלבד:
{
  "message": "<הודעה קצרה ביותר>",
  "intent": "booking|cancel|info|chat|collect_name|collect_service|collect_date|collect_time|confirm_booking",
  "extracted": {
    "service_name": null,
    "service_id": null,
    "date": null,
    "time": null,
    "customer_name": null
  },
  "ready_to_book": false,
  "cancel_appointment_id": null
}

כללי JSON קריטיים:
- customer_name: רק שם שהלקוח כתב — לא שם עובד/בעלים
- ready_to_book=true רק אחרי אישור מפורש + כל הפרטים
- intent="confirm_booking" רק ברגע האישור הסופי`;
}

// ─── Conversation state ───────────────────────────────────────────────────────

function getConversation(db, phone) {
  let conv = db.prepare('SELECT * FROM conversations WHERE whatsapp_phone = ?').get(phone);
  if (!conv) {
    db.prepare('INSERT INTO conversations (whatsapp_phone) VALUES (?)').run(phone);
    conv = db.prepare('SELECT * FROM conversations WHERE whatsapp_phone = ?').get(phone);
  }
  return {
    ...conv,
    extracted_data: JSON.parse(conv.extracted_data || '{}'),
    history: JSON.parse(conv.history || '[]'),
  };
}

function saveConversation(db, phone, updates) {
  const ed = updates.extracted_data ? JSON.stringify(updates.extracted_data) : undefined;
  const hist = updates.history ? JSON.stringify(updates.history.slice(-20)) : undefined;

  db.prepare(`
    UPDATE conversations SET
      business_id = COALESCE(?, business_id),
      stage = COALESCE(?, stage),
      extracted_data = COALESCE(?, extracted_data),
      history = COALESCE(?, history),
      msg_count = msg_count + 1,
      greeted = COALESCE(?, greeted),
      last_message_at = datetime('now'),
      updated_at = datetime('now')
    WHERE whatsapp_phone = ?
  `).run(
    updates.business_id || null,
    updates.stage || null,
    ed || null,
    hist || null,
    updates.greeted !== undefined ? (updates.greeted ? 1 : 0) : null,
    phone
  );
}

// ─── Main entry point ─────────────────────────────────────────────────────────

async function processMessage(phone, text, io) {
  const db = getDb();

  const conv = getConversation(db, phone);

  const assoc = db.prepare('SELECT * FROM customer_associations WHERE whatsapp_phone = ?').get(phone);
  const businessId = assoc ? assoc.business_id : null;

  // Stage 1: Select business
  if (!businessId) {
    return await handleBusinessSelection(db, phone, text, conv, io);
  }

  // Stage 2: Select staff (if multiple active staff and not yet locked)
  const staffList = db.prepare('SELECT * FROM staff WHERE business_id = ? AND is_active = 1').all(businessId);
  if (staffList.length > 1 && !assoc.staff_id) {
    return await handleStaffSelection(db, phone, text, conv, businessId, staffList, io);
  }

  // Stage 3: Business bot
  const lockedStaff = assoc.staff_id ? staffList.find(s => s.id === assoc.staff_id) || null : null;
  return await handleBusinessBot(db, phone, text, conv, businessId, lockedStaff, io);
}

// ─── Stage 1: Business selection ─────────────────────────────────────────────

async function handleBusinessSelection(db, phone, text, conv, io) {
  const businesses = db.prepare(`
    SELECT id, name, type, city, address FROM businesses
    WHERE is_active = 1 AND plan != 'cancelled'
      AND (plan = 'trial' OR subscription_status IN ('active', 'trialing'))
    ORDER BY name
  `).all();

  if (!businesses.length) {
    const allBiz = db.prepare('SELECT id, name, is_active, plan, subscription_status, trial_ends_at FROM businesses').all();
    console.log('[AI] No active businesses found. All businesses in DB:', JSON.stringify(allBiz));
    return 'שלום! מצטער, אין עסקים פעילים כרגע. נסה שוב מאוחר יותר.';
  }

  if (businesses.length === 1) {
    // Auto-select if only one
    return await lockAndGreet(db, phone, businesses[0], conv, io);
  }

  const businessList = businesses.map((b, i) => `${i + 1}. ${b.name}${b.city ? ` - ${b.city}` : ''}`).join('\n');

  // Try to match by name
  const lower = text.toLowerCase();
  for (const b of businesses) {
    if (lower.includes(b.name.toLowerCase()) || b.name.toLowerCase().includes(lower)) {
      return await lockAndGreet(db, phone, b, conv, io);
    }
  }

  // Try number selection
  const numMatch = text.match(/^(\d+)$/);
  if (numMatch) {
    const idx = parseInt(numMatch[1]) - 1;
    if (idx >= 0 && idx < businesses.length) {
      return await lockAndGreet(db, phone, businesses[idx], conv, io);
    }
  }

  // First message: greeting
  if (!conv.greeted) {
    saveConversation(db, phone, { greeted: 1 });
    return `שלום! 👋 אני טורי, הבוט החכם לתיאום תורים.\n\nאיזה עסק אתה מחפש?\n\n${businessList}\n\nפשוט כתוב את השם או המספר 😊`;
  }

  return `לא זיהיתי את העסק 😅 בבקשה בחר מהרשימה:\n\n${businessList}`;
}

async function lockAndGreet(db, phone, business, conv, io) {
  // Lock association
  db.prepare('INSERT OR REPLACE INTO customer_associations (whatsapp_phone, business_id) VALUES (?, ?)').run(phone, business.id);

  // Ensure customer record exists
  db.prepare('INSERT OR IGNORE INTO customers (business_id, whatsapp_phone) VALUES (?, ?)').run(business.id, phone);

  saveConversation(db, phone, { business_id: business.id, stage: 'business_bot' });

  const terms = business.terms_text
    ? `\n\n📋 *תקנון:* ${business.terms_text}`
    : '';

  return `מעולה! חיברתי אותך ל*${business.name}* 🎉\n\nהיי! אני הבוט של ${business.name}. אפשר לקבוע תור, לבטל, לשאול על מחירים ושעות, הכל בוואטסאפ 24/7 💪\n\nמה אפשר לעשות בשבילך?${terms}`;
}

// ─── Stage 2: Staff selection ─────────────────────────────────────────────────

async function handleStaffSelection(db, phone, text, conv, businessId, staffList, io) {
  const staffMenu = staffList.map((s, i) => `${i + 1}. ${s.name}${s.role ? ` (${s.role})` : ''}`).join('\n');

  // Try number selection
  const numMatch = text.match(/^(\d+)$/);
  if (numMatch) {
    const idx = parseInt(numMatch[1]) - 1;
    if (idx >= 0 && idx < staffList.length) {
      const chosen = staffList[idx];
      db.prepare('UPDATE customer_associations SET staff_id = ? WHERE whatsapp_phone = ?').run(chosen.id, phone);
      saveConversation(db, phone, { stage: 'business_bot' });
      return `מעולה! תואמת אותך עם *${chosen.name}* 💪\n\nאיך אפשר לעזור לך?`;
    }
  }

  // Try name match
  const lower = text.toLowerCase();
  for (const s of staffList) {
    if (lower.includes(s.name.toLowerCase())) {
      db.prepare('UPDATE customer_associations SET staff_id = ? WHERE whatsapp_phone = ?').run(s.id, phone);
      saveConversation(db, phone, { stage: 'business_bot' });
      return `מעולה! תואמת אותך עם *${s.name}* 💪\n\nאיך אפשר לעזור לך?`;
    }
  }

  return `עם מי תרצה לקבוע תור? 😊\n\n${staffMenu}\n\nפשוט כתוב את השם או המספר`;
}

// ─── Stage 3: Business bot ────────────────────────────────────────────────────

async function handleBusinessBot(db, phone, text, conv, businessId, lockedStaff, io) {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(businessId);
  if (!business || !business.is_active) {
    return 'מצטער, העסק אינו פעיל כרגע. נסה שוב מאוחר יותר.';
  }

  // Check if plan is active
  if (business.plan === 'cancelled') {
    return `מצטער, ${business.name} אינו פעיל כרגע. פנה אלינו ישירות בטלפון ${business.phone || ''}.`;
  }

  if (business.plan === 'trial') {
    const trialEnd = new Date(business.trial_ends_at);
    if (trialEnd < new Date()) {
      return `מצטער, תקופת הניסיון של ${business.name} הסתיימה. פנה אלינו ישירות בטלפון ${business.phone || ''}.`;
    }
  }

  const staffList = db.prepare('SELECT * FROM staff WHERE business_id = ? AND is_active = 1').all(businessId);
  const services = db.prepare('SELECT * FROM services WHERE business_id = ? AND is_active = 1 ORDER BY sort_order').all(businessId);
  const hours = db.prepare('SELECT * FROM business_hours WHERE business_id = ? ORDER BY day_of_week').all(businessId);
  const customer = db.prepare('SELECT * FROM customers WHERE business_id = ? AND whatsapp_phone = ?').get(businessId, phone);

  // Build history with current message
  const history = conv.history || [];
  history.push({ role: 'user', content: text });

  // Pre-resolve Hebrew dates/times in text
  const resolvedDate = resolveHebrewDate(text);
  const resolvedTime = resolveHebrewTime(text);

  // Enrich context
  let contextHint = '';
  if (resolvedDate) contextHint += `\n[מערכת: זיהיתי תאריך: ${resolvedDate} (${formatHebrewDate(resolvedDate)})]`;
  if (resolvedTime) contextHint += `\n[מערכת: זיהיתי שעה: ${resolvedTime}]`;

  // If we have partial data from previous turns, inject
  const ed = conv.extracted_data || {};
  if (ed.date && !resolvedDate) contextHint += `\n[מערכת: תאריך שנבחר קודם: ${ed.date}]`;
  if (ed.time && !resolvedTime) contextHint += `\n[מערכת: שעה שנבחרה קודם: ${ed.time}]`;
  if (ed.service_id) {
    const sv = services.find(s => s.id === ed.service_id);
    if (sv) contextHint += `\n[מערכת: שירות שנבחר קודם: ${sv.name}]`;
  }
  if (ed.customer_name) contextHint += `\n[מערכת: שם לקוח שנמסר: ${ed.customer_name}]`;

  // Check available slots if we have date
  const dateToCheck = resolvedDate || ed.date;
  if (dateToCheck) {
    const staffForSlots = lockedStaff || staffList[0] || null;
    const defaultService = ed.service_id ? services.find(s => s.id === ed.service_id) : services[0];
    const slots = getAvailableSlots(db, business, staffForSlots, defaultService, dateToCheck);
    if (slots.length > 0) {
      contextHint += `\n[מערכת: שעות פנויות ב-${formatHebrewDate(dateToCheck)}: ${slots.slice(0, 8).join(', ')}]`;
    } else {
      contextHint += `\n[מערכת: אין שעות פנויות ב-${formatHebrewDate(dateToCheck)}]`;
    }
  }

  if (lockedStaff) contextHint += `\n[מערכת: הלקוח בחר לעבוד עם ${lockedStaff.name}]`;

  // Hint about default service
  if (customer?.default_service_id && !ed.service_id) {
    const defaultSvc = services.find(s => s.id === customer.default_service_id);
    if (defaultSvc) contextHint += `\n[מערכת: השירות הרגיל של הלקוח: ${defaultSvc.name} — השתמש בו אוטומטית אלא אם ביקש אחר]`;
  }

  const systemPrompt = buildBusinessSystemPrompt(business, staffList, services, customer, hours, lockedStaff);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-12).map(m => ({ role: m.role, content: m.content })),
  ];

  if (contextHint) {
    messages.push({ role: 'system', content: contextHint });
  }

  let aiResponse;
  try {
    aiResponse = await groqChat(messages);
  } catch (err) {
    return 'סורי, משהו השתבש אצלנו 😅 נסה שוב בעוד רגע!';
  }

  let parsed;
  try {
    parsed = JSON.parse(aiResponse);
  } catch (e) {
    console.error('[AI] JSON parse error:', aiResponse);
    return 'סורי, קרתה שגיאה טכנית 😅 נסה שוב!';
  }

  const replyMessage = parsed.message || 'סורי, לא הבנתי. נסה שוב 😊';
  const extracted = parsed.extracted || {};

  // Merge extracted data with previous — only accept values the USER explicitly provided
  const newEd = { ...ed };
  if (extracted.service_name) {
    const svc = services.find(s =>
      s.name.toLowerCase().includes(extracted.service_name.toLowerCase()) ||
      extracted.service_name.toLowerCase().includes(s.name.toLowerCase())
    );
    if (svc) { newEd.service_id = svc.id; newEd.service_name = svc.name; }
  }
  if (extracted.service_id && services.find(s => s.id === extracted.service_id)) {
    newEd.service_id = extracted.service_id;
  }
  if (resolvedDate) newEd.date = resolvedDate;
  else if (extracted.date && /^\d{4}-\d{2}-\d{2}$/.test(extracted.date)) newEd.date = extracted.date;
  if (resolvedTime) newEd.time = resolvedTime;
  else if (extracted.time && /^\d{2}:\d{2}$/.test(extracted.time)) newEd.time = extracted.time;
  // Only accept customer_name if user explicitly wrote it (not auto-filled from owner/staff names)
  if (extracted.customer_name && extracted.customer_name.trim().length >= 2) {
    newEd.customer_name = extracted.customer_name.trim();
    // Save name to customer record permanently
    if (customer) {
      db.prepare('UPDATE customers SET name = ? WHERE id = ?').run(newEd.customer_name, customer.id);
    }
  }

  // If customer already has a name saved, always use it
  if (!newEd.customer_name && customer?.name) {
    newEd.customer_name = customer.name;
  }

  // Lock default service: save when first chosen, use automatically unless customer requests a different one
  if (newEd.service_id && customer) {
    if (!customer.default_service_id) {
      // First time — save as default
      db.prepare('UPDATE customers SET default_service_id = ? WHERE id = ?').run(newEd.service_id, customer.id);
    } else if (newEd.service_id !== customer.default_service_id) {
      // Customer explicitly chose a different service — update default
      db.prepare('UPDATE customers SET default_service_id = ? WHERE id = ?').run(newEd.service_id, customer.id);
    }
  }
  // Auto-fill service from customer default if not yet specified this session
  if (!newEd.service_id && customer?.default_service_id) {
    const defaultSvc = services.find(s => s.id === customer.default_service_id);
    if (defaultSvc) {
      newEd.service_id = defaultSvc.id;
      newEd.service_name = defaultSvc.name;
    }
  }

  // Update history
  history.push({ role: 'assistant', content: replyMessage });

  // Save conversation
  saveConversation(db, phone, { extracted_data: newEd, history });

  // Book only when ALL 4 fields confirmed AND intent is confirm_booking
  const canBook = parsed.ready_to_book
    && parsed.intent === 'confirm_booking'
    && newEd.service_id
    && newEd.date
    && newEd.time
    && newEd.customer_name;

  if (canBook) {
    // Verify slot is still available
    const service = services.find(s => s.id === newEd.service_id);
    const staffForSlots = lockedStaff || staffList[0] || null;
    const available = getAvailableSlots(db, business, staffForSlots, service, newEd.date);
    if (available.includes(newEd.time)) {
      const staffForBooking = lockedStaff ? [lockedStaff] : staffList;
      await bookAppointment(db, phone, businessId, business, newEd, services, staffForBooking, io);
      saveConversation(db, phone, { extracted_data: {} });
    }
  }

  // Handle cancellation
  if (parsed.cancel_appointment_id) {
    await cancelAppointment(db, parsed.cancel_appointment_id, businessId, io);
  }

  return replyMessage;
}

// ─── Book appointment ─────────────────────────────────────────────────────────

async function bookAppointment(db, phone, businessId, business, ed, services, staffList, io) {
  try {
    const service = services.find(s => s.id === ed.service_id);
    if (!service) return;

    const [h, m] = ed.time.split(':').map(Number);
    const startsAt = `${ed.date}T${ed.time}:00`;
    const endDate = new Date(`${ed.date}T${ed.time}:00`);
    endDate.setMinutes(endDate.getMinutes() + service.duration_minutes);
    const endsAt = endDate.toISOString().slice(0, 19);

    // Assign staff
    const staff = staffList[0];
    const staffId = staff ? staff.id : null;

    // Get or create customer
    let customer = db.prepare('SELECT * FROM customers WHERE business_id = ? AND whatsapp_phone = ?').get(businessId, phone);
    if (customer) {
      db.prepare('UPDATE customers SET name = COALESCE(?, name), total_visits = total_visits + 1, last_visit_at = ? WHERE id = ?').run(ed.customer_name, startsAt, customer.id);
    } else {
      const res = db.prepare('INSERT INTO customers (business_id, whatsapp_phone, name, total_visits) VALUES (?, ?, ?, 1)').run(businessId, phone, ed.customer_name);
      customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(res.lastInsertRowid);
    }

    const result = db.prepare(`
      INSERT INTO appointments (business_id, customer_id, staff_id, service_id, starts_at, ends_at, price, status, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'whatsapp')
    `).run(businessId, customer.id, staffId, service.id, startsAt, endsAt, service.price);

    const appointment = db.prepare(`
      SELECT a.*, c.name as customer_name, sv.name as service_name, s.name as staff_name
      FROM appointments a
      LEFT JOIN customers c ON a.customer_id = c.id
      LEFT JOIN services sv ON a.service_id = sv.id
      LEFT JOIN staff s ON a.staff_id = s.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    // Real-time update
    if (io) {
      io.to(`business_${businessId}`).emit('appointment:created', appointment);
    }

    console.log(`[AI] Booked appointment #${result.lastInsertRowid} for ${phone}`);
  } catch (err) {
    console.error('[AI] Booking error:', err);
  }
}

// ─── Cancel appointment ───────────────────────────────────────────────────────

async function cancelAppointment(db, appointmentId, businessId, io) {
  try {
    db.prepare("UPDATE appointments SET status = 'cancelled', updated_at = datetime('now') WHERE id = ? AND business_id = ?").run(appointmentId, businessId);
    if (io) {
      io.to(`business_${businessId}`).emit('appointment:cancelled', { id: appointmentId });
    }
  } catch (err) {
    console.error('[AI] Cancel error:', err);
  }
}

module.exports = { processMessage };
