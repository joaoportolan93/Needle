// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDatabase, saveDatabase, User } from '../database/schema.js';
import { generateToken, authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email e password são obrigatórios' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password deve ter no mínimo 6 caracteres' });
        }

        const db = getDatabase();

        // Verificar se já existe
        const existing = db.exec(`SELECT id FROM users WHERE username = '${username}' OR email = '${email}'`);
        if (existing.length > 0 && existing[0].values.length > 0) {
            return res.status(409).json({ error: 'Username ou email já existe' });
        }

        // Hash da senha
        const password_hash = await bcrypt.hash(password, 10);

        // Inserir usuário
        db.run(`INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)`, [username, email, password_hash]);
        saveDatabase();

        // Buscar o ID do usuário inserido
        const result = db.exec(`SELECT last_insert_rowid() as id`);
        const userId = result[0].values[0][0] as number;

        const token = generateToken(userId, username);

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            user: { id: userId, username, email },
            token
        });
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * POST /api/auth/login
 * Autentica um usuário existente
 */
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email e password são obrigatórios' });
        }

        const db = getDatabase();

        // Buscar usuário
        const result = db.exec(`SELECT * FROM users WHERE email = ?`, [email]);

        if (result.length === 0 || result[0].values.length === 0) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const columns = result[0].columns;
        const values = result[0].values[0];
        const user: any = {};
        columns.forEach((col, i) => user[col] = values[i]);

        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = generateToken(user.id, user.username);

        res.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                avatar_url: user.avatar_url
            },
            token
        });
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
    try {
        const db = getDatabase();
        const result = db.exec(`SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ?`, [req.userId!]);

        if (result.length === 0 || result[0].values.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const columns = result[0].columns;
        const values = result[0].values[0];
        const user: any = {};
        columns.forEach((col, i) => user[col] = values[i]);

        res.json({ user });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

export default router;
