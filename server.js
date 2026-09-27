const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const os      = require('os');

const app  = express();
const PORT = 3000;

// ── middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/images', express.static(path.join(__dirname, 'images')));

// ── detect if filesystem is writable (local) or read-only (Vercel) ──
const DATA_DIR     = path.join(__dirname, 'data');
const DATA_FILE    = path.join(DATA_DIR, 'data.json');
const GALLERY_FILE = path.join(DATA_DIR, 'gallery.json');

let isWritable = false;
try {
  fs.accessSync(__dirname, fs.constants.W_OK);
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  isWritable = true;
} catch (e) {
  isWritable = false;
}

// ── in-memory fallback (used on Vercel) ──
let memData = {
  visitors: 0,
  bio: {
    name       : "Master Craftsman",
    title      : "Artisan Carpenter",
    experience : "20",
    description: "With two decades of hands-on experience, I've dedicated my life to the ancient art of carpentry. Every piece I create is a fusion of traditional craftsmanship and modern design — built to last generations.",
    description_gu: "વીસ વર્ષના અનુભવ સાથે, મેં મારું જીવન સુથારીકામની પ્રાચીન કળાને સમર્પિત કર્યું છે."
  }
};
let memGallery = { photos: [] };

// ── data helpers ──────────────────────────────────────────────
function readData() {
  if (!isWritable) return memData;
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { fs.writeFileSync(DATA_FILE, JSON.stringify(memData, null, 2)); return memData; }
}
function saveData(d) {
  if (!isWritable) { memData = d; return; }
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

function readGallery() {
  if (!isWritable) return memGallery;
  try { return JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf8')); }
  catch { fs.writeFileSync(GALLERY_FILE, JSON.stringify(memGallery, null, 2)); return memGallery; }
}
function saveGallery(g) {
  if (!isWritable) { memGallery = g; return; }
  fs.writeFileSync(GALLERY_FILE, JSON.stringify(g, null, 2));
}

// ── multer (image uploads) ────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: isWritable ? storage : multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ══════════════════════════════════════════════════════════════
//  API ROUTES
// ══════════════════════════════════════════════════════════════

// ── visitor counter ──────────────────────────────────────────
app.post('/api/visitor', (req, res) => {
  const d = readData();
  d.visitors++;
  saveData(d);
  res.json({ visitors: d.visitors });
});

app.get('/api/visitor', (req, res) => {
  res.json({ visitors: readData().visitors });
});

// ── bio ───────────────────────────────────────────────────────
app.get('/api/bio', (req, res) => {
  res.json(readData().bio);
});

app.post('/api/bio', (req, res) => {
  const d = readData();
  d.bio = { ...d.bio, ...req.body };
  saveData(d);
  res.json({ success: true, bio: d.bio });
});

// ── gallery ───────────────────────────────────────────────────
// Files to exclude from gallery (logos, system files etc.)
const GALLERY_EXCLUDE = ['desktop.ini', 'Screenshot 2026-09-27 121930.png'];

app.get('/api/gallery', (req, res) => {
  const gallery = readGallery();
  const imagesDir = path.join(__dirname, 'images');
  let staticImgs = [];
  try {
    staticImgs = fs.readdirSync(imagesDir)
      .filter(f =>
        /\.(jpg|jpeg|png|gif|webp)$/i.test(f) &&
        !GALLERY_EXCLUDE.includes(f) &&
        !gallery.photos.find(p => p.filename === f)
      )
      .map(f => ({
        filename: f,
        title   : 'Woodwork',
        category: 'furniture',
        src     : '/images/' + encodeURIComponent(f)
      }));
  } catch (e) { staticImgs = []; }
  res.json({ photos: [...gallery.photos, ...staticImgs] });
});

app.post('/api/gallery/upload', upload.array('photos', 20), (req, res) => {
  if (!isWritable) return res.json({ success: false, message: 'Uploads not supported in this environment.' });
  const gallery = readGallery();
  const added = req.files.map(file => ({
    filename: file.filename,
    title   : req.body.title    || 'Woodwork',
    category: req.body.category || 'furniture',
    src     : '/images/' + file.filename
  }));
  gallery.photos.push(...added);
  saveGallery(gallery);
  res.json({ success: true, added });
});

app.delete('/api/gallery/:filename', (req, res) => {
  const gallery  = readGallery();
  gallery.photos = gallery.photos.filter(p => p.filename !== req.params.filename);
  saveGallery(gallery);
  if (isWritable) {
    const filePath = path.join(__dirname, 'images', req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  res.json({ success: true });
});

app.patch('/api/gallery/:filename', (req, res) => {
  const gallery = readGallery();
  const photo   = gallery.photos.find(p => p.filename === req.params.filename);
  if (photo) { Object.assign(photo, req.body); saveGallery(gallery); }
  res.json({ success: true });
});

// ── serve pages ───────────────────────────────────────────────
app.get('/',        (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'gallery.html')));
app.get('/admin',   (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ══════════════════════════════════════════════════════════════
//  START SERVER (local only — Vercel uses export)
// ══════════════════════════════════════════════════════════════
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    let localIP = 'localhost';
    for (const ifaces of Object.values(os.networkInterfaces())) {
      for (const iface of ifaces) {
        if (iface.family === 'IPv4' && !iface.internal) { localIP = iface.address; break; }
      }
    }
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║   🪵  WoodCraft Pro — Server Running  🪵  ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  💻 Local  : http://localhost:${PORT}         ║`);
    console.log(`║  📱 WiFi   : http://${localIP}:${PORT}   ║`);
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  🔧 Admin  : http://localhost:${PORT}/admin   ║`);
    console.log(`║  🖼  Gallery: http://localhost:${PORT}/gallery ║`);
    console.log('╚══════════════════════════════════════════╝\n');
  });
}

// Vercel needs this export
module.exports = app;
