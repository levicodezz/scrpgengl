// server.js
const express = require('express');
const cors = require('cors');
const jsonfile = require('jsonfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'troque_ja_no_render_ou_env';
const JWT_EXP = process.env.JWT_EXP || '8h';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// helpers
async function readUsers() {
  try { return await jsonfile.readFile(USERS_FILE); } catch { return []; }
}
async function writeUsers(users) {
  await jsonfile.writeFile(USERS_FILE, users, { spaces: 2 });
}
function ensureUsersFile() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  }
}
ensureUsersFile();

// --- AUTH (user login) ---
// Nota: este login aceita duas formas:
// 1) se o campo passwordHash começa com '$2' -> compara com bcrypt (hash seguro)
// 2) se não começa com '$2' -> compara string em texto (apenas para setup inicial)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });
  const users = await readUsers();
  const u = users.find(x => x.username === username);
  if (!u) return res.status(401).json({ error: 'invalid credentials' });

  try {
    const stored = u.passwordHash || '';
    let ok = false;
    if (stored.startsWith('$2')) {
      // bcrypt hash stored
      ok = await bcrypt.compare(password, stored);
    } else {
      // plain-text (only for initial convenience)
      ok = password === stored;
    }
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }

  if (!u.active) return res.status(403).json({ error: 'account_inactive' });

  const token = jwt.sign({ uid: u.id, username: u.username, role: u.role }, JWT_SECRET, { expiresIn: JWT_EXP });
  res.json({ token, expiresIn: JWT_EXP, username: u.username, role: u.role });
});

app.get('/api/auth/validate', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ valid: false });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const u = users.find(x => x.id === payload.uid);
    if (!u || !u.active) return res.status(401).json({ valid: false });
    return res.json({ valid: true, username: u.username, role: u.role });
  } catch (e) {
    return res.status(401).json({ valid: false });
  }
});

// --- ADMIN middleware (expects admin JWT) ---
async function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'no_token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const users = await readUsers();
    const u = users.find(x => x.id === payload.uid);
    if (!u || !u.active) return res.status(403).json({ error: 'forbidden' });
    req.admin = u;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// --- ADMIN endpoints: CRUD users ---
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const users = await readUsers();
  // never send password hashes
  res.json(users.map(u => ({ id: u.id, username: u.username, role: u.role, active: u.active, fullName: u.fullName || '', cargo: u.cargo || '' })));
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { username, password, role = 'user', active = true, fullName = '', cargo = '' } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username+password required' });
  const users = await readUsers();
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'exists' });
  // store as bcrypt hash by default for newly created users
  const hash = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), username, passwordHash: hash, role, active: !!active, fullName, cargo };
  users.push(newUser);
  await writeUsers(users);
  res.json({ ok: true, id: newUser.id });
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { password, active, role, fullName, cargo } = req.body || {};
  const users = await readUsers();
  const u = users.find(x => x.id === id);
  if (!u) return res.status(404).json({ error: 'not_found' });
  if (typeof active === 'boolean') u.active = active;
  if (role) u.role = role;
  if (fullName !== undefined) u.fullName = fullName;
  if (cargo !== undefined) u.cargo = cargo;
  if (password) u.passwordHash = await bcrypt.hash(password, 10);
  await writeUsers(users);
  res.json({ ok: true });
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  let users = await readUsers();
  users = users.filter(u => u.id !== id);
  await writeUsers(users);
  res.json({ ok: true });
});

// health
app.get('/', (req, res) => res.send('H5P auth server'));

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on', PORT));
