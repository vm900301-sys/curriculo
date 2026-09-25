const express = require('express');
const cors = require('cors');
require('dotenv').config();

const resumeRoutes = require('./src/routes/resumeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Injeta as rotas do nosso app prefixadas com /api/resumes
app.use('/api/resumes', resumeRoutes);

app.get('/status', (req, res) => {
  res.json({ status: "online", mensagem: "API pronta para receber o Wizard!" });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor completo rodando na porta ${PORT}`);
});
