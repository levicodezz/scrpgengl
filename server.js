import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// compatibilidade __dirname em ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// rota para receber vinculação
app.post("/api/vincular", (req, res) => {
    console.log("Novo usuário vinculado:", req.body);
    res.json({ status: "ok", recebido: req.body });
});

// rota para servir o script remoto
app.get("/ef.js", (req, res) => {
    res.sendFile(path.join(__dirname, "ef.js"));
});

// rota painel
app.get("/painel", (req, res) => {
    const user = req.query.user || "desconhecido";
    res.send(`
        <h1>Bem-vindo, ${user}</h1>
        <p>Você foi vinculado com sucesso!</p>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));
