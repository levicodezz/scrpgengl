const bcrypt = require('bcryptjs');
const jsonfile = require('jsonfile');
const path = require('path');
const USERS_FILE = path.join(__dirname, 'users.json');

(async () => {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'admin123';
  const hash = await bcrypt.hash(password, 10);
  const admin = { id: 'admin-' + Date.now(), username, passwordHash: hash, role: 'admin', active: true };
  await jsonfile.writeFile(USERS_FILE, [admin], { spaces: 2 });
  console.log('Admin criado:', username, 'senha:', password);
})();
