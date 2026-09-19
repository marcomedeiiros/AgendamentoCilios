import express from 'express';
import cors from 'cors';
import { rotasDepoimentos } from './modules/depoimentos/rotas';
import { uploadsPath } from './modules/depoimentos/armazenamento';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
// As fotos chegam como data URL dentro do JSON; o cliente já reduz a imagem
// antes de enviar, e o limite aqui é a última barreira.
app.use(express.json({ limit: '6mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend rodando perfeitamente!' });
});

app.use('/uploads', express.static(uploadsPath, { maxAge: '7d' }));
app.use('/api/depoimentos', rotasDepoimentos);

// Em breve: rotas de agendamento (/api/agendamentos) e cursos (/api/cursos)
// integradas ao Prisma.

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
