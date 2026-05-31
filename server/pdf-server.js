require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const pdfParse = require('pdf-parse');

const app = express();
const PORT = process.env.PDF_PORT || 3003;

app.use(cors({ origin: ['https://wooleryapp.com', 'https://www.wooleryapp.com', 'http://localhost'] }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
app.use('/api/', limiter);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.match(/\.pdf$/i)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});

app.post('/api/extract-pdf', upload.single('pdf'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No PDF file provided.' });

    try {
        const data = await pdfParse(req.file.buffer);
        const text = data.text || '';
        res.json({ text, pages: data.numpages || 1 });
    } catch (err) {
        console.error('PDF parse error:', err);
        res.status(422).json({ error: 'Could not read PDF. The file may be scanned or encrypted.' });
    }
});

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'PDF too large. Maximum size is 10MB.' });
    if (err.message === 'Only PDF files are allowed') return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: 'Unexpected error.' });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`Woolery PDF server running on port ${PORT}`);
});
