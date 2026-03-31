const cron = require('node-cron');
const { getDb } = require('../config/database');
const { sendTrialEnding, sendTrialExpired } = require('./email');
const { sendWhatsAppMessage } = require('../routes/whatsapp');

function startScheduler() {
  // Every day at 10:00 AM: check trial ending tomorrow
  cron.schedule('0 10 * * *', async () => {
    console.log('[Scheduler] Running trial ending check...');
    try {
      const db = getDb();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const businesses = db.prepare(`
        SELECT b.* FROM businesses b
        WHERE b.plan = 'trial'
          AND date(b.trial_ends_at) = ?
          AND b.is_active = 1
          AND NOT EXISTS (
            SELECT 1 FROM trial_notifications tn
            WHERE tn.business_id = b.id AND tn.type = 'day_before'
          )
      `).all(tomorrowStr);

      for (const business of businesses) {
        try {
          await sendTrialEnding(business);
          db.prepare("INSERT INTO trial_notifications (business_id, type) VALUES (?, 'day_before')").run(business.id);

          // Also send WhatsApp if they have a phone
          if (business.phone) {
            const msg = `שלום ${business.owner_name}! 👋 הניסיון החינמי של טורי ל-${business.name} מסתיים מחר. כדי להמשיך לקבל תורים אוטומטיים, שדרג ב: ${process.env.CLIENT_URL}/dashboard/settings`;
            await sendWhatsAppMessage(business.phone.replace(/\D/g, '').replace(/^0/, '972'), msg);
          }

          console.log(`[Scheduler] Sent trial ending notification to ${business.email}`);
        } catch (err) {
          console.error(`[Scheduler] Failed to notify ${business.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Trial ending check error:', err);
    }
  }, { timezone: 'Asia/Jerusalem' });

  // Every day at 10:00 AM: check trial expired
  cron.schedule('5 10 * * *', async () => {
    console.log('[Scheduler] Running trial expiry check...');
    try {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];

      const businesses = db.prepare(`
        SELECT b.* FROM businesses b
        WHERE b.plan = 'trial'
          AND date(b.trial_ends_at) < ?
          AND b.is_active = 1
          AND NOT EXISTS (
            SELECT 1 FROM trial_notifications tn
            WHERE tn.business_id = b.id AND tn.type = 'expired'
          )
      `).all(today);

      for (const business of businesses) {
        try {
          // Deactivate bot
          db.prepare("UPDATE businesses SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(business.id);
          await sendTrialExpired(business);
          db.prepare("INSERT INTO trial_notifications (business_id, type) VALUES (?, 'expired')").run(business.id);

          console.log(`[Scheduler] Paused trial-expired business: ${business.name}`);
        } catch (err) {
          console.error(`[Scheduler] Failed to expire ${business.email}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Scheduler] Trial expiry check error:', err);
    }
  }, { timezone: 'Asia/Jerusalem' });

  // Every 30 minutes: send appointment reminders (24h and 1h before)
  cron.schedule('*/30 * * * *', async () => {
    try {
      const db = getDb();
      const now = new Date();

      // Window: appointments starting between (now + windowStart) and (now + windowEnd) minutes
      async function sendReminders(windowStart, windowEnd, label) {
        const from = new Date(now.getTime() + windowStart * 60000).toISOString().slice(0, 16);
        const to   = new Date(now.getTime() + windowEnd   * 60000).toISOString().slice(0, 16);

        const appts = db.prepare(`
          SELECT a.*,
            c.name  as customer_name, c.whatsapp_phone,
            s.name  as service_name,  s.duration_minutes,
            st.name as staff_name,
            b.name  as business_name, b.phone as business_phone,
            b.address, b.buffer_minutes
          FROM appointments a
          JOIN customers c  ON a.customer_id = c.id
          JOIN services  s  ON a.service_id  = s.id
          JOIN businesses b ON a.business_id = b.id
          LEFT JOIN staff st ON a.staff_id = st.id
          WHERE a.status = 'confirmed'
            AND a.starts_at >= ? AND a.starts_at < ?
            AND a.reminder_${label}_sent = 0
            AND c.whatsapp_phone IS NOT NULL
            AND c.whatsapp_phone NOT LIKE 'manual_%'
        `).all(from, to);

        for (const appt of appts) {
          try {
            const startTime = appt.starts_at.slice(11, 16);
            const startDate = appt.starts_at.slice(0, 10).split('-').reverse().join('/');
            const staffLine = appt.staff_name ? ` עם ${appt.staff_name}` : '';

            const msg = label === '24h'
              ? `היי ${appt.customer_name || ''} 👋\nתזכורת: מחר יש לך תור ב*${appt.business_name}*\n📅 ${startDate} בשעה ${startTime}${staffLine}\n✂️ ${appt.service_name}\n\nלביטול שלח "ביטול תור" 🙏`
              : `היי ${appt.customer_name || ''} ⏰\nבעוד שעה התור שלך ב*${appt.business_name}*\n🕐 ${startTime}${staffLine} · ${appt.service_name}\n\n${appt.address ? `📍 ${appt.address}` : ''}`;

            const phone = appt.whatsapp_phone.replace(/\D/g, '').replace(/^0/, '972');
            await sendWhatsAppMessage(phone, msg);

            db.prepare(`UPDATE appointments SET reminder_${label}_sent = 1 WHERE id = ?`).run(appt.id);
            console.log(`[Scheduler] Sent ${label} reminder to ${phone} for appt #${appt.id}`);
          } catch (err) {
            console.error(`[Scheduler] Reminder error appt #${appt.id}:`, err.message);
          }
        }
      }

      // 24h window: 23.5h–24.5h from now
      await sendReminders(23 * 60 + 30, 24 * 60 + 30, '24h');
      // 1h window: 55–65 min from now
      await sendReminders(55, 65, '1h');

    } catch (err) {
      console.error('[Scheduler] Reminder job error:', err);
    }
  }, { timezone: 'Asia/Jerusalem' });

  // Every day at midnight: log active businesses
  cron.schedule('0 0 * * *', () => {
    try {
      const db = getDb();
      const stats = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN plan = 'trial' THEN 1 ELSE 0 END) as trial,
          SUM(CASE WHEN plan = 'basic' THEN 1 ELSE 0 END) as basic,
          SUM(CASE WHEN plan = 'business' THEN 1 ELSE 0 END) as business,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
        FROM businesses
      `).get();
      console.log(`[Scheduler] Daily stats: ${JSON.stringify(stats)}`);
    } catch (err) {
      console.error('[Scheduler] Daily stats error:', err);
    }
  }, { timezone: 'Asia/Jerusalem' });

  console.log('[Scheduler] Jobs started');
}

module.exports = { startScheduler };
