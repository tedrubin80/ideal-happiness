require('dotenv').config();

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const app = express();
const PORT = process.env.PORT || 3001;
const FROM = process.env.FROM_EMAIL;

const ses = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

app.use(express.json({ limit: '64kb' }));
app.use(cors({ origin: ['https://wooleryapp.com', 'https://www.wooleryapp.com', 'http://localhost'] }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

function isValidEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 254;
}

// POST /api/email-pattern
// Sends the converted pattern to the user's own email
app.post('/api/email-pattern', async (req, res) => {
    const { to, pattern, mode } = req.body;

    if (!isValidEmail(to)) return res.status(400).json({ error: 'Invalid email address.' });
    if (!pattern || typeof pattern !== 'string') return res.status(400).json({ error: 'No pattern provided.' });
    if (pattern.length > 50000) return res.status(400).json({ error: 'Pattern too large.' });

    const modeLabel = mode === 'abbreviated' ? 'Shortened pattern' : 'Plain-English pattern';
    const subject = `Your ${modeLabel} from Woolery`;

    const textBody = [
        `Here's your ${modeLabel.toLowerCase()} from Woolery App:`,
        '',
        '─'.repeat(40),
        '',
        pattern,
        '',
        '─'.repeat(40),
        '',
        'Happy knitting!',
        '',
        'Woolery App — wooleryapp.com',
        'Translate any knitting pattern to plain English, free.',
    ].join('\n');

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf7f4;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#8b5e3c;padding:32px 40px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#faf7f4;letter-spacing:-0.3px;">Woolery</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(250,247,244,0.65);text-transform:uppercase;letter-spacing:1.5px;">Pattern Translator</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 20px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2a1f18;letter-spacing:-0.3px;">Here's your ${modeLabel.toLowerCase()}.</p>
            <p style="margin:0;font-size:15px;color:#7a6655;line-height:1.6;">Ready to knit with.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:#f0ebe4;border-radius:8px;padding:24px;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:1.8;color:#3a2e26;white-space:pre-wrap;word-break:break-word;">${pattern.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 36px;">
            <a href="https://wooleryapp.com" style="display:inline-block;background:#8b5e3c;color:#faf7f4;text-decoration:none;padding:13px 26px;border-radius:7px;font-size:14px;font-weight:700;letter-spacing:-0.2px;">Translate another pattern</a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 32px;border-top:1px solid #e8e0d6;">
            <p style="margin:0;font-size:12px;color:#a89080;line-height:1.6;">
              You requested this from <a href="https://wooleryapp.com" style="color:#8b5e3c;text-decoration:none;">wooleryapp.com</a>.
              No account, no spam &mdash; just your pattern.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        await ses.send(new SendEmailCommand({
            Source: FROM,
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: {
                    Text: { Data: textBody, Charset: 'UTF-8' },
                    Html:  { Data: htmlBody,  Charset: 'UTF-8' },
                },
            },
        }));
        res.json({ ok: true });
    } catch (err) {
        console.error('SES send-pattern error:', err);
        res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }
});

// POST /api/share
// Sends a "check out Woolery" email to a friend
app.post('/api/share', async (req, res) => {
    const { to, from } = req.body;

    if (!isValidEmail(to)) return res.status(400).json({ error: 'Invalid recipient email.' });

    const fromLabel = isValidEmail(from) ? from : 'A fellow knitter';
    const subject = `${fromLabel} thinks you'll love this knitting tool`;

    const textBody = [
        `${fromLabel} wanted to share something with you:`,
        '',
        'Woolery translates knitting pattern abbreviations into plain English.',
        'Paste in any pattern — Etsy PDF, Ravelry download, whatever —',
        'and it spells out every k2tog, ssk, and yo instantly.',
        'Free, no account required.',
        '',
        'Try it: https://wooleryapp.com',
        '',
        '— Woolery App',
    ].join('\n');

    const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#faf7f4;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#8b5e3c;padding:32px 40px;">
            <p style="margin:0;font-size:22px;font-weight:700;color:#faf7f4;letter-spacing:-0.3px;">Woolery</p>
            <p style="margin:6px 0 0;font-size:13px;color:rgba(250,247,244,0.65);text-transform:uppercase;letter-spacing:1.5px;">Pattern Translator</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 24px;">
            <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#2a1f18;letter-spacing:-0.3px;">${fromLabel.replace(/&/g,'&amp;').replace(/</g,'&lt;')} thinks you'll love this.</p>
            <p style="margin:0;font-size:16px;color:#5a4030;line-height:1.7;">
              Woolery translates knitting pattern abbreviations into plain English.
              Paste in any pattern &mdash; Etsy PDF, Ravelry download, Grandma's notebook &mdash;
              and it spells out every k2tog, ssk, and yo. Instantly.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 16px;">
            <table style="background:#f0ebe4;border-radius:10px;padding:20px 24px;width:100%;" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family:'Courier New',Courier,monospace;font-size:14px;color:#7a5a40;">k2tog, ssk, yo, pm</td>
              </tr>
              <tr><td style="padding:8px 0;color:#a89080;font-size:13px;">↓ Woolery translates</td></tr>
              <tr>
                <td style="font-size:14px;color:#3a7a4a;font-weight:600;">knit 2 together, slip slip knit, yarn over, place marker</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 36px;">
            <a href="https://wooleryapp.com" style="display:inline-block;background:#8b5e3c;color:#faf7f4;text-decoration:none;padding:14px 28px;border-radius:7px;font-size:15px;font-weight:700;letter-spacing:-0.2px;">Try it free &rarr;</a>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid #e8e0d6;">
            <p style="margin:0;font-size:12px;color:#a89080;line-height:1.6;">
              This was sent by a Woolery user. You won't hear from us again unless you visit
              <a href="https://wooleryapp.com" style="color:#8b5e3c;text-decoration:none;">wooleryapp.com</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    try {
        await ses.send(new SendEmailCommand({
            Source: FROM,
            ReplyToAddresses: isValidEmail(from) ? [from] : [],
            Destination: { ToAddresses: [to] },
            Message: {
                Subject: { Data: subject, Charset: 'UTF-8' },
                Body: {
                    Text: { Data: textBody, Charset: 'UTF-8' },
                    Html:  { Data: htmlBody,  Charset: 'UTF-8' },
                },
            },
        }));
        res.json({ ok: true });
    } catch (err) {
        console.error('SES share error:', err);
        res.status(500).json({ error: 'Failed to send email. Please try again.' });
    }
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

const http = require('http');
const OLLAMA_PORT = 11434;
const ALLOWED_MODELS = ['llama3.2', 'mistral'];

const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

// POST /api/ai-explain — streams Ollama response about a knitting pattern
app.post('/api/ai-explain', aiLimiter, (req, res) => {
    const { pattern, question, model } = req.body;

    if (!pattern || typeof pattern !== 'string') return res.status(400).json({ error: 'No pattern provided.' });
    if (pattern.length > 8000) return res.status(400).json({ error: 'Pattern too large.' });
    if (!question || typeof question !== 'string' || question.length > 500) return res.status(400).json({ error: 'Invalid question.' });

    const chosenModel = ALLOWED_MODELS.includes(model) ? model : 'llama3.2';

    const systemPrompt = `You are a knitting expert helping someone understand their knitting pattern. Be warm, clear, and concise. Explain stitches and techniques in plain English. Keep responses short — 2–4 sentences unless more detail is needed.`;

    const userMessage = `Here is the knitting pattern:\n\n${pattern.slice(0, 4000)}\n\nQuestion: ${question}`;

    const body = JSON.stringify({
        model: chosenModel,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
        ],
        stream: true,
    });

    const options = {
        hostname: '127.0.0.1',
        port: OLLAMA_PORT,
        path: '/api/chat',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const ollamaReq = http.request(options, (ollamaRes) => {
        ollamaRes.on('data', (chunk) => {
            try {
                const lines = chunk.toString().split('\n').filter(Boolean);
                for (const line of lines) {
                    const json = JSON.parse(line);
                    const token = json?.message?.content || '';
                    if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
                    if (json.done) res.write('data: [DONE]\n\n');
                }
            } catch (_) {}
        });
        ollamaRes.on('end', () => res.end());
    });

    ollamaReq.on('error', (err) => {
        console.error('Ollama error:', err);
        res.write('data: [ERROR]\n\n');
        res.end();
    });

    req.on('close', () => ollamaReq.destroy());
    ollamaReq.write(body);
    ollamaReq.end();
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Woolery mailer running on port ${PORT}`);
});
