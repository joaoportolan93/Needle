// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends Request {
    userId?: number;
    username?: string;
}

export interface JwtPayload {
    userId: number;
    username: string;
}

/**
 * Middleware de autenticação JWT
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.userId = decoded.userId;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

/**
 * Gera um token JWT para o usuário
 */
export function generateToken(userId: number, username: string): string {
    return jwt.sign(
        { userId, username } as JwtPayload,
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}
