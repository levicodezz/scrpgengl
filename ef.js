import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Corrige caminho para __dirname no ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Habilita CORS para qualquer origem
app.use(cors());

// Rota principal opcional
app.get('/', (req, res) => {
res.send('Servidor do EF Script rodando 🚀');
});

// Servir o script ef.js diretamente
app.get('/ef.js', (req, res) => {
res.sendFile(path.join(__dirname, 'ef.js'));
});

app.listen(PORT, () => {
console.log(Servidor escutando em http://localhost:${PORT});
});
