import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend rodando perfeitamente!' });
});

// Em breve: Rotas de agendamento (/api/agendamentos) e cursos (/api/cursos) integradas ao Prisma

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
