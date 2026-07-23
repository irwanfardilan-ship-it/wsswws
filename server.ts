import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
// import { createServer as createViteServer } from 'vite'; // Moved to dynamic import

// Dynamic import helper for Google Sheets
async function getGoogleSheets() {
  if (process.env.VERCEL) {
    return {
      getOrCreateSpreadsheet: async () => ({ id: 'stub', url: 'stub' }),
      appendApprovedUserToSheet: async () => ({}),
      appendReportToSheet: async () => ({})
    };
  }
  return await import('./src/server/googleSheets.js');
}


if (!process.env.VERCEL) {
  dotenv.config();
}

const app = express();
const PORT = 3000;

// TODO: Configure TELEGRAM_BOT_TOKEN in .env for production verification
const TELEGRAM_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || '8892793996:AAFEBvD5fbQ8QAkUOFe5PHSFKHCocBbNSPA').trim().replace(/^["']|["']$/g, '');
const JWT_SECRET = (process.env.JWT_SECRET || 'azurlizeteam_secret_jwt_key_2026').trim().replace(/^["']|["']$/g, '');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check for Vercel debugging
app.get('/api/health', (_req, res) => {
  console.log('[AzurLizeTeam] Health check hit');
  res.json({ 
    status: 'ok', 
    environment: process.env.VERCEL ? 'vercel' : 'local',
    timestamp: new Date().toISOString()
  });
});

// HMAC SHA-256 verification function for Telegram WebApp initData
function verifyTelegramInitData(initData: string): { valid: boolean; user?: unknown; error?: string } {
  if (!initData) {
    return { valid: false, error: 'Missing initData string' };
  }

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    if (!hash) {
      return { valid: false, error: 'Hash parameter missing from initData' };
    }

    urlParams.delete('hash');

    // If bot token is not yet configured, allow validation in development mode with clear log
    if (!TELEGRAM_BOT_TOKEN) {
      console.warn('[Telegram Auth] TELEGRAM_BOT_TOKEN is not configured. Running in unverified development mode.');
      const userString = urlParams.get('user');
      const user = userString ? JSON.parse(userString) : null;
      return { valid: true, user };
    }

    // Sort parameters alphabetically
    const params: string[] = [];
    urlParams.forEach((val, key) => {
      params.push(`${key}=${val}`);
    });
    params.sort();

    const dataCheckString = params.join('\n');

    // HMAC-SHA256 calculation
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash === hash) {
      const userString = urlParams.get('user');
      const user = userString ? JSON.parse(userString) : null;
      return { valid: true, user };
    } else {
      return { valid: false, error: 'HMAC signature verification failed' };
    }
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Failed to parse initData' };
  }
}

// Middleware to protect API routes with JWT session token
function authenticateJWT(req: Request & { user?: unknown }, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Unauthorized: Session token missing' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(403).json({ success: false, error: 'Forbidden: Invalid or expired session token' });
  }
}

// API Endpoint: Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'AzurLizeTeam Mini Web App',
    telegramVerificationReady: Boolean(TELEGRAM_BOT_TOKEN),
    timestamp: new Date().toISOString()
  });
});

// API Endpoint: Verify Telegram initData & Issue JWT Session Token
app.post('/api/auth/verify-telegram', (req, res) => {
  const { initData } = req.body;

  if (!initData) {
    res.status(400).json({ success: false, error: 'initData is required' });
    return;
  }

  const verification = verifyTelegramInitData(initData);
  if (!verification.valid) {
    res.status(401).json({ success: false, error: verification.error || 'Invalid Telegram initData' });
    return;
  }

  const user = verification.user as { id: number; username?: string; first_name?: string };
  if (!user || !user.id) {
    res.status(400).json({ success: false, error: 'Telegram user ID not found in initData' });
    return;
  }

  // Issue JWT Session Token valid for 7 days
  const token = jwt.sign(
    {
      telegramId: String(user.id),
      username: user.username || '',
      firstName: user.first_name || ''
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    success: true,
    data: {
      token,
      telegramUser: user,
      verified: true
    }
  });
});

// API Endpoint: User Registration Session Verification
app.post('/api/auth/session-user', authenticateJWT, (req: Request & { user?: unknown }, res: Response) => {
  res.json({
    success: true,
    data: {
      sessionUser: req.user
    }
  });
});

// API Endpoint: Get Google Spreadsheet Link
app.get('/api/sheets/info', async (_req: Request, res: Response) => {
  try {
    const { getOrCreateSpreadsheet } = await getGoogleSheets();
    const info = await getOrCreateSpreadsheet();
    res.json({ success: true, data: info });
  } catch (err) {
    console.error('[Sheets API] Error getting sheet info:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Gagal mengakses Google Sheets' });
  }
});

// API Endpoint: Sync Approved User to Google Sheets
app.post('/api/sheets/sync-user', async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    if (!user || !user.telegramId) {
      res.status(400).json({ success: false, error: 'Data user tidak lengkap' });
      return;
    }

    const { appendApprovedUserToSheet } = await getGoogleSheets();
    const result = await appendApprovedUserToSheet(user);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Sheets API] Error syncing user to Google Sheets:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Gagal mencatat data ke Google Sheets' });
  }
});

// API Endpoint: Sync Daily Report to Google Sheets
app.post('/api/sheets/sync-report', async (req: Request, res: Response) => {
  try {
    const { report } = req.body;
    if (!report || !report.telegramId) {
      res.status(400).json({ success: false, error: 'Data laporan tidak lengkap' });
      return;
    }

    const { appendReportToSheet } = await getGoogleSheets();
    const result = await appendReportToSheet(report);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Sheets API] Error syncing report to Google Sheets:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Gagal mencatat laporan ke Google Sheets' });
  }
});

/**
 * TELEGRAM WEBHOOK HANDLER
 * Allows the bot to respond to commands like /id or /info in groups.
 * To use: Set your webhook URL to https://<your-app-url>/api/telegram/webhook
 */
app.post('/api/telegram/webhook', async (req: Request, res: Response) => {
  try {
    const { message, edited_message, channel_post, edited_channel_post } = req.body;
    
    // Process standard messages
    const msg = message || edited_message || channel_post || edited_channel_post;
    
    if (msg && msg.text && msg.text.startsWith('/start')) {
      const chatId = msg.chat.id;
      const threadId = msg.message_thread_id;
      const firstName = msg.from?.first_name || 'Teman';
      
      let responseText = `👋 <b>Halo, ${firstName}! Selamat datang di AzurLizeTeam Bot!</b>\n\n`;
      responseText += `Saya adalah bot asisten resmi untuk <b>AzurLizeTeam</b>.\n\n`;
      responseText += `🚀 <b>Mini Web App kami sudah siap digunakan!</b> Anda dapat mengelola laporan harian, memantau data pelamar, memeriksa postingan harian, dan melihat statistik performa secara langsung dan real-time.\n\n`;
      responseText += `📱 <b>Cara membuka Mini Web App:</b>\n`;
      responseText += `• Klik tombol <b>"Buka Mini App"</b> di bawah ini.\n`;
      responseText += `• Atau klik tombol menu/web app di pojok kiri bawah obrolan ini.\n\n`;
      responseText += `<i>Jika Anda membutuhkan bantuan info chat/grup, gunakan perintah /id atau /info. Selamat bekerja!</i>`;

      // Get WebApp URL dynamically
      const host = req.get('host') || 'ais-dev-zbqn5b46dflqymdy6ajpnm-268860382066.asia-east1.run.app';
      const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const webAppUrl = `${protocol}://${host}`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🚀 Buka Mini App',
              web_app: { url: webAppUrl }
            }
          ],
          [
            {
              text: '🔗 Link Alternatif Browser',
              url: webAppUrl
            }
          ]
        ]
      };

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText,
          parse_mode: 'HTML',
          reply_markup: keyboard,
          message_thread_id: threadId
        })
      });
    }

    if (msg && msg.text && (msg.text.startsWith('/id') || msg.text.startsWith('/info'))) {
      const chatId = msg.chat.id;
      const threadId = msg.message_thread_id;
      const chatTitle = msg.chat.title || msg.chat.username || msg.chat.first_name || 'Private Chat';
      const isTopic = Boolean(threadId);

      let responseText = `<b>📍 TELEGRAM CHAT INFO</b>\n\n`;
      responseText += `🏷️ <b>Title:</b> ${chatTitle}\n`;
      responseText += `🆔 <b>Chat ID:</b> <code>${chatId}</code>\n`;
      
      if (isTopic) {
        responseText += `🧵 <b>Topic ID:</b> <code>${threadId}</code>\n`;
      }
      
      responseText += `\n<i>Gunakan ID di atas pada Pengaturan Aplikasi AzurLize.</i>`;

      // Reply to the message
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: responseText,
          parse_mode: 'HTML',
          reply_to_message_id: msg.message_id,
          message_thread_id: threadId // Ensure reply stays in the same topic
        })
      });
    }

    // Always respond 200 OK to Telegram
    res.status(200).send('OK');
  } catch (err) {
    console.error('[Telegram Webhook] Error:', err);
    res.status(200).send('OK'); // Still send 200 to avoid retries from Telegram
  }
});

// API Endpoint: Set Telegram Webhook
app.post('/api/telegram/set-webhook', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ success: false, error: 'URL webhook diperlukan' });
      return;
    }

    if (!TELEGRAM_BOT_TOKEN) {
      res.status(400).json({ success: false, error: 'Token Bot Telegram tidak dikonfigurasi.' });
      return;
    }

    const cleanUrl = url.replace(/\/$/, '');
    const webhookUrl = `${cleanUrl}/api/telegram/webhook`;
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const result = await response.json();

    if (result.ok) {
      res.json({ success: true, message: 'Webhook berhasil diatur!', data: result });
    } else {
      res.status(400).json({ success: false, error: result.description || 'Gagal mengatur webhook' });
    }
  } catch (err) {
    console.error('[Telegram API] Error setting webhook:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Gagal mengatur webhook' });
  }
});

// API Endpoint: Get Bot Info
app.get('/api/telegram/bot-info', async (_req: Request, res: Response) => {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      res.status(400).json({ success: false, error: 'Token Bot Telegram tidak dikonfigurasi.' });
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const result = await response.json();

    if (result.ok) {
      res.json({ success: true, data: result.result });
    } else {
      res.status(400).json({ success: false, error: result.description || 'Gagal mengambil info bot' });
    }
  } catch (err) {
    console.error('[Telegram API] Error getting bot info:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Gagal mengambil info bot' });
  }
});

// API Endpoint: Send Post (Multiple Images) to Telegram Group
app.post('/api/telegram/send-post', async (req: Request, res: Response) => {
  try {
    const { links, startNumber, images, recruiterName, recruiterUsername, groupId, topicId } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      res.status(400).json({ success: false, error: 'Setidaknya satu gambar diperlukan.' });
      return;
    }

    const targetGroup = groupId || process.env.TELEGRAM_GROUP_ID || '';
    const targetTopic = topicId || process.env.TELEGRAM_TOPIC_ID || '';

    if (!targetGroup) {
      res.status(400).json({ success: false, error: 'ID Grup Telegram belum dikonfigurasi.' });
      return;
    }

    if (!TELEGRAM_BOT_TOKEN) {
      res.status(400).json({ success: false, error: 'Token Bot Telegram tidak dikonfigurasi.' });
      return;
    }

    // Format Dates for display and database (WIB)
    const nowInJakarta = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
    const jakartaDate = new Date(nowInJakarta);
    const yyyy = jakartaDate.getFullYear();
    const mm = String(jakartaDate.getMonth() + 1).padStart(2, '0');
    const dd = String(jakartaDate.getDate()).padStart(2, '0');
    
    const dateDb = `${yyyy}-${mm}-${dd}`;
    const dateDisplay = `${dd}-${mm}-${yyyy}`;
    
    const endNumber = (startNumber || 1) + (links ? links.length : 0) - 1;
    const rangeStr = `${startNumber}-${endNumber}`;
    
    const recTag = recruiterUsername ? `@${recruiterUsername.replace(/^@/, '')}` : recruiterName;
    const header = `${dateDisplay}\n\n${rangeStr}\n\n`;
    const footer = `\n\n👤 <b>Recruiter:</b> ${recTag}`;
    
    // Telegram limit is 1024. Let's aim for 1000 for safety.
    const maxCaptionLen = 1000;
    const availableLen = maxCaptionLen - header.length - footer.length;
    
    let linkList = links && Array.isArray(links) 
      ? links.map((l: string, i: number) => `${startNumber + i}. ${l}`).join('\n')
      : '';

    if (linkList.length > availableLen) {
      // Truncate link list and add notice
      const notice = '\n... (beberapa link dipotong karena terlalu panjang)';
      linkList = linkList.substring(0, availableLen - notice.length);
      // Try to cut at the last newline to be clean
      const lastNewline = linkList.lastIndexOf('\n');
      if (lastNewline > 0) {
        linkList = linkList.substring(0, lastNewline);
      }
      linkList += notice;
    }

    const fullCaption = `${header}${linkList}${footer}`.trim();

    const formData = new FormData();
    formData.append('chat_id', targetGroup);
    if (targetTopic) {
      formData.append('message_thread_id', String(targetTopic));
    }

    // Process images
    const mediaArray = [];
    
    for (let i = 0; i < images.length; i++) {
      const dataUrl = images[i];
      const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
      
      if (match) {
        const mimeType = match[1];
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType });
        
        const fileKey = `photo${i}`;
        formData.append(fileKey, blob, `post_${Date.now()}_${i}.jpg`);
        
        mediaArray.push({
          type: 'photo',
          media: `attach://${fileKey}`,
          caption: i === 0 ? fullCaption : '', // Caption only on the first photo
          parse_mode: 'HTML'
        });
      }
    }

    formData.append('media', JSON.stringify(mediaArray));

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMediaGroup`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    if (result.ok) {
      res.json({ success: true, data: result.result });
    } else {
      console.error('[Telegram API] sendMediaGroup Error:', result);
      res.status(400).json({ success: false, error: result.description || 'Gagal mengirim postingan ke Telegram' });
    }
  } catch (err) {
    console.error('[Telegram API] Error sending post:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Gagal mengirim postingan' });
  }
});

// API Endpoint: Send Daily Report & Video directly to Telegram Group Topic
app.post('/api/telegram/send-report', async (req: Request, res: Response) => {
  try {
    const { report, videoDataUrl, groupId, topicId } = req.body;
    if (!report) {
      res.status(400).json({ success: false, error: 'Data laporan tidak ditemukan' });
      return;
    }

    const targetGroup = groupId || process.env.TELEGRAM_GROUP_ID || '';
    const targetTopic = topicId || process.env.TELEGRAM_TOPIC_ID || '';

    if (!targetGroup) {
      res.status(400).json({
        success: false,
        error: 'ID Grup Telegram belum dikonfigurasi. Mohon isi ID Grup di Pengaturan.'
      });
      return;
    }

    if (!TELEGRAM_BOT_TOKEN) {
      res.status(400).json({ success: false, error: 'Token Bot Telegram tidak dikonfigurasi.' });
      return;
    }

    const recUsername = report.recruiterUsername ? `@${report.recruiterUsername.replace(/^@/, '')}` : (report.username ? `@${report.username}` : report.name);
    const applicantTg = report.applicantTelegramUsername ? `@${report.applicantTelegramUsername.replace(/^@/, '')}` : '-';

    const captionHtml = `
UID : ${report.uid9Kucing || '-'}
WA : ${report.applicantWhatsapp || '-'}
Username Telegram : ${applicantTg}
Rekomendasi dari : ${recUsername}
Info dari sosmed : ${report.channel || '-'}

Grub : ${report.grup || '-'}
`.trim();

    // Send video if available
    if (videoDataUrl && typeof videoDataUrl === 'string' && videoDataUrl.startsWith('data:')) {
      const match = videoDataUrl.match(/^data:(.*?);base64,(.*)$/);
      if (match) {
        const mimeType = match[1] || 'video/mp4';
        const base64Data = match[2];
        const buffer = Buffer.from(base64Data, 'base64');
        const blob = new Blob([buffer], { type: mimeType });

        const formData = new FormData();
        formData.append('chat_id', targetGroup);
        if (targetTopic) {
          formData.append('message_thread_id', String(targetTopic));
        }
        formData.append('caption', captionHtml);
        formData.append('parse_mode', 'HTML');

        const ext = mimeType.includes('quicktime') || mimeType.includes('mov') ? 'mov' : 'mp4';
        formData.append('video', blob, `laporan_${report.reportId || Date.now()}.${ext}`);

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (result.ok) {
          res.json({ success: true, data: result.result, message: 'Laporan dan Video berhasil terkirim ke Telegram Group Topic!' });
          return;
        } else {
          console.warn('[Telegram API] sendVideo failed, falling back to sendMessage:', result);
        }
      }
    } else if (videoDataUrl && typeof videoDataUrl === 'string' && videoDataUrl.startsWith('http')) {
      const payload: Record<string, unknown> = {
        chat_id: targetGroup,
        video: videoDataUrl,
        caption: captionHtml,
        parse_mode: 'HTML'
      };
      if (targetTopic) payload.message_thread_id = Number(targetTopic);

      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendVideo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.ok) {
        res.json({ success: true, data: result.result, message: 'Laporan dan Video berhasil terkirim ke Telegram Group Topic!' });
        return;
      }
    }

    // Text-only message fallback
    const isDataUrl = videoDataUrl && typeof videoDataUrl === 'string' && videoDataUrl.startsWith('data:');
    const textPayload: Record<string, unknown> = {
      chat_id: targetGroup,
      text: captionHtml + (videoDataUrl && !isDataUrl ? `\n\n📹 <b>Video Bukti:</b> ${videoDataUrl}` : ''),
      parse_mode: 'HTML'
    };
    if (targetTopic) textPayload.message_thread_id = Number(targetTopic);

    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(textPayload)
    });

    const result = await response.json();
    if (result.ok) {
      res.json({ success: true, data: result.result, message: 'Laporan berhasil terkirim ke Telegram Group Topic!' });
    } else {
      res.status(400).json({ success: false, error: result.description || 'Gagal mengirim pesan ke Telegram' });
    }
  } catch (err) {
    console.error('[Telegram API] Error sending report:', err);
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : 'Gagal mengirim laporan ke Telegram' });
  }
});

// Fallback for unmatched /api routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.url} not found on this server.`
  });
});

// Global JSON error handler for /api routes
app.use('/api', (err: any, req: Request, res: Response, next: any) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Express Server and mount Vite Middleware
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.js') {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (ext === '.css') {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (ext === '.json') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        } else if (ext === '.png') {
          res.setHeader('Content-Type', 'image/png');
        } else if (ext === '.jpg' || ext === '.jpeg') {
          res.setHeader('Content-Type', 'image/jpeg');
        } else if (ext === '.svg') {
          res.setHeader('Content-Type', 'image/svg+xml');
        } else if (ext === '.ico') {
          res.setHeader('Content-Type', 'image/x-icon');
        }
      }
    }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Only listen and mount static/dev middleware if not running on Vercel as a Serverless Function
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[AzurLizeTeam Server] Running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
