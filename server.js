const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const PASSWD_FILE = path.join(DATA_DIR, '.passwd');
const AUTH_TOKEN_FILE = path.join(DATA_DIR, '.token');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// --- Simple auth helpers ---
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getStoredToken() {
  try {
    if (fs.existsSync(AUTH_TOKEN_FILE)) {
      return fs.readFileSync(AUTH_TOKEN_FILE, 'utf8').trim();
    }
  } catch (e) {}
  return null;
}

function setStoredToken(token) {
  fs.writeFileSync(AUTH_TOKEN_FILE, token, 'utf8');
}

// Initialize token on first run
let AUTH_TOKEN = getStoredToken();
if (!AUTH_TOKEN) {
  AUTH_TOKEN = generateToken();
  setStoredToken(AUTH_TOKEN);
  console.log('[AUTH] Token gerado: ' + AUTH_TOKEN);
}

// --- Middleware ---
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));

// Rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Muitas requisições. Aguarde um minuto.' }
});
app.use('/api', limiter);

// Auth middleware
function auth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ') || header.slice(7) !== AUTH_TOKEN) {
    return res.status(401).json({ error: 'Não autorizado. Use o token correto.' });
  }
  next();
}

// --- Data helpers ---
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[DATA] Erro ao ler:', e.message);
  }
  return { os: [], clients: [], products: [], services: [], finance: [], config: {} };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Password protection
function getStoredPassword() {
  try {
    if (fs.existsSync(PASSWD_FILE)) {
      return fs.readFileSync(PASSWD_FILE, 'utf8').trim();
    }
  } catch (e) {}
  return null;
}

function setStoredPassword(pwd) {
  const hash = crypto.createHash('sha256').update(pwd).digest('hex');
  fs.writeFileSync(PASSWD_FILE, hash, 'utf8');
}

function verifyPassword(pwd) {
  const stored = getStoredPassword();
  if (!stored) return true; // no password set
  const hash = crypto.createHash('sha256').update(pwd).digest('hex');
  return hash === stored;
}

// --- Routes ---

// Health check (no auth required)
app.get('/api/health', (req, res) => {
  const stats = fs.existsSync(DATA_FILE) ? fs.statSync(DATA_FILE) : null;
  res.json({
    status: 'ok',
    version: '1.0.0',
    dataSize: stats ? stats.size : 0,
    uptime: process.uptime()
  });
});

// Auth: get token (requires password)
app.post('/api/auth', (req, res) => {
  const { password } = req.body || {};
  if (!verifyPassword(password)) {
    return res.status(403).json({ error: 'Senha incorreta' });
  }
  res.json({ token: AUTH_TOKEN, message: 'Autenticado com sucesso' });
});

// Auth: set password
app.post('/api/auth/password', auth, (req, res) => {
  const { password } = req.body || {};
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Senha deve ter no mínimo 4 caracteres' });
  }
  setStoredPassword(password);
  res.json({ message: 'Senha definida com sucesso' });
});

// Auth: reset token
app.post('/api/auth/reset-token', auth, (req, res) => {
  AUTH_TOKEN = generateToken();
  setStoredToken(AUTH_TOKEN);
  res.json({ token: AUTH_TOKEN, message: 'Token renovado' });
});

// Get data (auth required)
app.get('/api/data', auth, (req, res) => {
  const data = loadData();
  res.json({ data, ts: Date.now() });
});

// Save data (auth required)
app.put('/api/data', auth, (req, res) => {
  const { data } = req.body || {};
  if (!data) return res.status(400).json({ error: 'Campo "data" obrigatório' });
  saveData(data);
  res.json({ message: 'Dados salvos', ts: Date.now() });
});

// --- Serve dashboard static files (optional) ---
const STATIC_DIR = process.env.STATIC_DIR || path.join(__dirname, '..');
if (fs.existsSync(path.join(STATIC_DIR, 'dashboard.html'))) {
  app.use(express.static(STATIC_DIR));
  console.log('[STATIC] Servindo dashboard de: ' + STATIC_DIR);
}

// --- Start ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] InfoCell Sync rodando na porta ${PORT}`);
  console.log('[SERVER] Token de acesso: ' + AUTH_TOKEN);
  if (!getStoredPassword()) {
    console.log('[SERVER] ATENÇÃO: Nenhuma senha definida! Configure via POST /api/auth/password');
  }
});
