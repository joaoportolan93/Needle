// src/database/schema.ts
import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../sonora.db');

let db: SqlJsDatabase;

/**
 * Inicializa o banco de dados SQLite
 */
export async function initializeDatabase(): Promise<SqlJsDatabase> {
    const SQL = await initSqlJs();

    // Carregar banco existente ou criar novo
    try {
        if (fs.existsSync(dbPath)) {
            const fileBuffer = fs.readFileSync(dbPath);
            db = new SQL.Database(fileBuffer);
            console.log('✅ Banco de dados existente carregado!');
        } else {
            db = new SQL.Database();
            console.log('✅ Novo banco de dados criado!');
        }
    } catch (error) {
        db = new SQL.Database();
        console.log('✅ Novo banco de dados criado!');
    }

    // Criar tabelas
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            avatar_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            spotify_album_id TEXT NOT NULL,
            album_name TEXT NOT NULL,
            album_artist TEXT NOT NULL,
            album_cover_url TEXT,
            rating REAL NOT NULL CHECK (rating >= 0 AND rating <= 5),
            review_text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, spotify_album_id)
        )
    `);

    // Índices
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_spotify_album_id ON reviews(spotify_album_id)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating DESC)`);
    db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC)`);

    // Salvar banco
    saveDatabase();

    console.log('✅ Schema inicializado com sucesso!');
    return db;
}

/**
 * Salva o banco de dados no disco
 */
export function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(dbPath, buffer);
    }
}

/**
 * Retorna a instância do banco
 */
export function getDatabase(): SqlJsDatabase {
    return db;
}

// Tipos TypeScript
export interface User {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface Review {
    id: number;
    user_id: number;
    spotify_album_id: string;
    album_name: string;
    album_artist: string;
    album_cover_url: string | null;
    rating: number;
    review_text: string | null;
    created_at: string;
    updated_at: string;
}
