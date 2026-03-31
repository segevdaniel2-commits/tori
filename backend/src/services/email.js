const { Resend } = require('resend');

// Lazy init: only instantiate when an API key is available
let _resend = null;
const getResend = () => {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[Email] RESEND_API_KEY not set, emails will be skipped');
      return null;
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
};

const FROM = process.env.FROM_EMAIL || 'noreply@tori.com';

function hebrewDate(date) {
  const d = new Date(date);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const baseStyle = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800&display=swap');
    body { margin: 0; padding: 0; background: #f5f3ff; font-family: 'Heebo', sans-serif; direction: rtl; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .card { background: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(124,58,237,0.08); }
    .logo { font-size: 28px; font-weight: 800; color: #7C3AED; margin-bottom: 24px; }
    .logo span { color: #F43F5E; }
    h1 { font-size: 24px; color: #1a1a2e; margin-bottom: 12px; }
    p { font-size: 16px; color: #444; line-height: 1.7; margin-bottom: 16px; }
    .btn { display: inline-block; background: #7C3AED; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; font-weight: 700; margin: 16px 0; }
    .btn-coral { background: #F43F5E; }
    .highlight { background: #f5f3ff; border-right: 4px solid #7C3AED; padding: 16px 20px; border-radius: 8px; margin: 16px 0; }
    .footer { text-align: center; color: #888; font-size: 13px; margin-top: 32px; }
    .divider { border: none; border-top: 1px solid #ede9fe; margin: 24px 0; }
  </style>
`;

async function sendEmail(to, subject, html) {
  const client = getResend();
  if (!client) {
    console.log(`[Email] DEV MODE - Would send "${subject}" to ${to}`);
    return;
  }
  try {
    await client.emails.send({ from: FROM, to, subject, html });
    console.log(`[Email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, err.message);
    throw err;
  }
}

async function sendWelcome(business) {
  const subject = `ברוך הבא לטורי! 🎉 התחל את 30 הימים חינם שלך`;
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="he">
  <head><meta charset="UTF-8">${baseStyle}</head>
  <body>
    <div class="container">
      <div class="card">
        <div class="logo">Tori<span>.</span></div>
        <h1>ברוך הבא, ${business.owner_name}! 🎉</h1>
        <p>תודה שנרשמת ל<strong>טורי</strong>, הבוט החכם שמנהל את התורים שלך 24/7 בוואטסאפ.</p>
        <div class="highlight">
          <strong>✅ העסק שלך:</strong> ${business.name}<br>
          <strong>📅 תקופת ניסיון:</strong> 30 יום חינם עד ${hebrewDate(business.trial_ends_at)}<br>
          <strong>💳 כרטיס אשראי:</strong> לא נדרש
        </div>
        <p>הצעדים הבאים:</p>
        <ol>
          <li>היכנס לדשבורד והגדר את השירותים שלך</li>
          <li>שתף את קישור הוואטסאפ עם הלקוחות שלך</li>
          <li>תן לבוט לעבוד בשבילך!</li>
        </ol>
        <a href="${process.env.CLIENT_URL}/dashboard" class="btn">כניסה לדשבורד →</a>
        <hr class="divider">
        <p>יש שאלות? אנחנו כאן: <a href="https://wa.me/972584532944">WhatsApp 058-4532944</a></p>
        <div class="footer">
          <p>טורי, הבוט שמנהל את העסק שלך</p>
          <p>© ${new Date().getFullYear()} Tori. כל הזכויות שמורות.</p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  await sendEmail(business.email, subject, html);
}

async function sendTrialEnding(business) {
  const subject = `הניסיון החינם שלך מסתיים מחר. אל תפסיד את הבוט! ⏰`;
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="he">
  <head><meta charset="UTF-8">${baseStyle}</head>
  <body>
    <div class="container">
      <div class="card">
        <div class="logo">Tori<span>.</span></div>
        <h1>היי ${business.owner_name}, הניסיון מסתיים מחר ⏰</h1>
        <p>30 הימים החינמיים שלך ב<strong>טורי</strong> מסתיימים ב-${hebrewDate(business.trial_ends_at)}.</p>
        <div class="highlight">
          <strong>כדי להמשיך לקבל תורים אוטומטיים, בחר תוכנית:</strong><br><br>
          <strong>Basic, ₪89 לחודש:</strong> עובד אחד<br>
          <strong>Business, ₪200 לחודש:</strong> 2+ עובדים
        </div>
        <p>כל לקוח שניסה לתאם תור אחרי מחר לא יוכל. אל תפסיד הכנסות!</p>
        <a href="${process.env.CLIENT_URL}/dashboard/settings" class="btn">שדרג עכשיו →</a>
        <hr class="divider">
        <div class="footer">
          <p>טורי, הבוט שמנהל את העסק שלך</p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  await sendEmail(business.email, subject, html);
}

async function sendTrialExpired(business) {
  const subject = `הניסיון החינם שלך הסתיים. הבוט הושהה`;
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="he">
  <head><meta charset="UTF-8">${baseStyle}</head>
  <body>
    <div class="container">
      <div class="card">
        <div class="logo">Tori<span>.</span></div>
        <h1>הניסיון הסתיים 😔</h1>
        <p>היי ${business.owner_name},</p>
        <p>תקופת הניסיון החינמי של <strong>${business.name}</strong> הסתיימה. הבוט הושהה זמנית.</p>
        <p>כדי להמשיך לקבל תורים אוטומטיים 24/7, שדרג לאחת מהתוכניות:</p>
        <div class="highlight">
          <strong>Basic, ₪89 לחודש:</strong> עובד אחד, תורים ללא הגבלה<br>
          <strong>Business, ₪200 לחודש:</strong> 2+ עובדים, ניתוח מתקדם
        </div>
        <a href="${process.env.CLIENT_URL}/dashboard/settings" class="btn btn-coral">חדש מנוי →</a>
        <hr class="divider">
        <p style="font-size:14px; color:#888">שאלות? דבר איתנו בוואטסאפ: 058-4532944</p>
        <div class="footer">
          <p>טורי © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  await sendEmail(business.email, subject, html);
}

async function sendPaymentFailed(business) {
  const subject = `תשלום נכשל. עדכן פרטי כרטיס 💳`;
  const html = `
  <!DOCTYPE html>
  <html dir="rtl" lang="he">
  <head><meta charset="UTF-8">${baseStyle}</head>
  <body>
    <div class="container">
      <div class="card">
        <div class="logo">Tori<span>.</span></div>
        <h1>שגיאה בתשלום ⚠️</h1>
        <p>היי ${business.owner_name},</p>
        <p>לא הצלחנו לגבות את התשלום עבור המנוי של <strong>${business.name}</strong>.</p>
        <p>כדי להמשיך להשתמש בבוט, עדכן את פרטי התשלום שלך:</p>
        <a href="${process.env.CLIENT_URL}/dashboard/settings" class="btn btn-coral">עדכן תשלום →</a>
        <hr class="divider">
        <p style="font-size:14px; color:#888">אם זו טעות, פנה אלינו בוואטסאפ: 058-4532944</p>
        <div class="footer">
          <p>טורי © ${new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  </body>
  </html>`;
  await sendEmail(business.email, subject, html);
}

module.exports = { sendWelcome, sendTrialEnding, sendTrialExpired, sendPaymentFailed };
