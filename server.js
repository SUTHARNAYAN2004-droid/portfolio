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
app.use(express.static(__dirname));          // serve frontend
app.use('/images', express.static(path.join(__dirname, 'images')));

// ── data file paths ─────────────────────────────────────────
const DATA_FILE    = path.join(__dirname, 'data', 'data.json');
const GALLERY_FILE = path.join(__dirname, 'data', 'gallery.json');

// create data dir if missing
if (!fs.existsSync(path.join(__dirname, 'data')))
  fs.mkdirSync(path.join(__dirname, 'data'));

// default data
const defaultData = {
  visitors : 0,
  bio: {
    name       : "Master Craftsman",
    title      : "Artisan Carpenter",
    experience : "20",
    description: "With two decades of hands-on experience, I've dedicated my life to the ancient art of carpentry. Every piece I create is a fusion of traditional craftsmanship and modern design — built to last generations.",
    description_gu: "વીસ વર્ષના અનુભવ સાથે, મેં મારું જીવન સુથારીકામની પ્રાચીન કળાને સમર્પિત કર્યું છે. હું જે દરેક ટુકડો બનાવું છું તે પરંપરાગત કારીગરી અને આધુનિક ડિઝાઇનનું સંયોજન છે."
  }
};

const defaultGallery = { photos: [] };

function readData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2)); return defaultData; }
}
function saveData(d) { fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2)); }

function readGallery() {
  try { return JSON.parse(fs.readFileSync(GALLERY_FILE, 'utf8')); }
  catch { fs.writeFileSync(GALLERY_FILE, JSON.stringify(defaultGallery, null, 2)); return defaultGallery; }
}
function saveGallery(g) { fs.writeFileSync(GALLERY_FILE, JSON.stringify(g, null, 2)); }

// ── multer (image uploads) ───────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'images');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

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
  const d = readData();
  res.json({ visitors: d.visitors });
});

// ── bio / profile ────────────────────────────────────────────
app.get('/api/bio', (req, res) => {
  res.json(readData().bio);
});

app.post('/api/bio', (req, res) => {
  const d = readData();
  d.bio = { ...d.bio, ...req.body };
  saveData(d);
  res.json({ success: true, bio: d.bio });
});

// ── gallery ──────────────────────────────────────────────────
app.get('/api/gallery', (req, res) => {
  // merge static images + uploaded images
  const gallery = readGallery();
  const staticImgs = fs.readdirSync(path.join(__dirname, 'images'))
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f) && !gallery.photos.find(p => p.filename === f))
    .map(f => ({ filename: f, title: 'Woodwork', category: 'furniture', src: '/images/' + encodeURIComponent(f) }));
  res.json({ photos: [...gallery.photos, ...staticImgs] });
});

app.post('/api/gallery/upload', upload.array('photos', 20), (req, res) => {
  const gallery = readGallery();
  const added = req.files.map(file => ({
    filename : file.filename,
    title    : req.body.title    || 'Woodwork',
    category : req.body.category || 'furniture',
    src      : '/images/' + file.filename
  }));
  gallery.photos.push(...added);
  saveGallery(gallery);
  res.json({ success: true, added });
});

app.delete('/api/gallery/:filename', (req, res) => {
  const filename = req.params.filename;
  const gallery  = readGallery();
  gallery.photos  = gallery.photos.filter(p => p.filename !== filename);
  saveGallery(gallery);
  // delete physical file
  const filePath = path.join(__dirname, 'images', filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  res.json({ success: true });
});

app.patch('/api/gallery/:filename', (req, res) => {
  const gallery = readGallery();
  const photo   = gallery.photos.find(p => p.filename === req.params.filename);
  if (photo) { Object.assign(photo, req.body); saveGallery(gallery); }
  res.json({ success: true });
});

// ── serve pages ──────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'gallery.html')));
app.get('/admin',   (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ══════════════════════════════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════════════════════════════
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
