// src/index.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/schema.js';

// Rotas
import spotifyRoutes from './routes/spotify.js';
import authRoutes from './routes/auth.js';
import reviewsRoutes from './routes/reviews.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Rotas da API
app.use('/api/spotify', spotifyRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewsRoutes);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Inicializar banco antes do servidor
async function start() {
    await initializeDatabase();

    app.listen(PORT, () => {
        console.log(`🎵 Sonora Backend rodando em http://localhost:${PORT}`);
        console.log('📚 Endpoints disponíveis:');
        console.log('   GET  /api/health');
        console.log('   GET  /api/spotify/token');
        console.log('   POST /api/auth/register');
        console.log('   POST /api/auth/login');
        console.log('   GET  /api/auth/me');
        console.log('   GET  /api/reviews');
        console.log('   POST /api/reviews');
        console.log('   PUT  /api/reviews/:id');
        console.log('   DEL  /api/reviews/:id');
    });
}

start().catch(console.error);
