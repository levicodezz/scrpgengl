import express from 'express';
import cors from 'cors';

const app = express();

// Configura CORS para liberar só o domínio do seu site
app.use(cors({
  origin: 'https://learn.corporate.ef.com',
}));

// Permite receber JSON no body das requisições
app.use(express.json());

// Rota de exemplo /api/vincular
app.post('/api/vincular', (req, res) => {
  const data = req.body.data;
  console.log('Dados recebidos:', data);

  // Aqui você pode fazer o que precisar com esses dados (ex: salvar, processar...)

  res.json({ success: true, message: 'Dados vinculados com sucesso!' });
});

// Porta padrão para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
