// server.js
const express = require('express');
const cors = require('cors');
const jsonfile = require('jsonfile');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'troque_ja_essa_secret_no_render';
const JWT_EXP = process.env.JWT_EXP || '8h';

const app = express();
app.use(cors()); // ajuste em prod para origem específica se quiser
app.use(express.json());

// util
async function readUsers() {
  try { return await jsonfile.readFile(USERS_FILE); } catch(e) { return []; }
}
async function writeUsers(users) { await jsonfile.writeFile(USERS_FILE, users, { spaces: 2 }); }

// ---------- Auth endpoints for users (script clients) ----------
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });
  const users = await readUsers();
  const u = users.find(x => x.username === username);
  if (!u) return res.status(401).json({ error: 'invalid credentials' });
  const match = await bcrypt.compare(password, u.passwordHash);
  if (!match) return res.status(401).json({ error: 'invalid credentials' });
  if (!u.active) return res.status(403).json({ error: 'account_inactive' });
  const token = jwt.sign({ uid: u.id, username: u.username, role: u.role }, JWT_SECRET, { expiresIn: JWT_EXP });
  return res.json({ token, expiresIn: JWT_EXP });
});

app.get('/api/auth/validate', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ valid: false });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const u = users.find(x => x.id === payload.uid);
    if (!u || !u.active) return res.status(401).json({ valid: false, reason: 'user_not_active' });
    return res.json({ valid: true, username: u.username, role: u.role });
  } catch (e) {
    return res.status(401).json({ valid: false });
  }
});

// ---------- Admin endpoints (manage users) ----------
// Simple admin protection: require admin token
async function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'no_token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const users = await readUsers();
    const u = users.find(x => x.id === payload.uid);
    if (!u || u.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    req.adminUser = u;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// list users
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const users = await readUsers();
  // don't return passwordHash
  res.json(users.map(u => ({ id: u.id, username: u.username, active: u.active, role: u.role })));
});

// create user
app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { username, password, role = 'user', active = true } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });
  const users = await readUsers();
  if (users.find(u => u.username === username)) return res.status(409).json({ error: 'exists' });
  const hash = await bcrypt.hash(password, 10);
  const newUser = { id: uuidv4(), username, passwordHash: hash, active: !!active, role };
  users.push(newUser);
  await writeUsers(users);
  res.json({ ok: true, user: { id: newUser.id, username: newUser.username, active: newUser.active, role: newUser.role }});
});

// update user (edit / toggle active)
app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { password, active, role } = req.body || {};
  const users = await readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  if (typeof active === 'boolean') users[idx].active = active;
  if (role) users[idx].role = role;
  if (password) users[idx].passwordHash = await bcrypt.hash(password, 10);
  await writeUsers(users);
  res.json({ ok: true, user: { id: users[idx].id, username: users[idx].username, active: users[idx].active, role: users[idx].role }});
});

// delete
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  let users = await readUsers();
  users = users.filter(u => u.id !== id);
  await writeUsers(users);
  res.json({ ok: true });
});

// simple route to show server is running
app.get('/', (req, res) => res.send('H5P Auth server'));

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
