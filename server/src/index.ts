import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
const PORT: number = parseInt(process.env.PORT || '8010', 10);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR: string = path.join(__dirname, '../..', 'dist');

app.use(cors({
    origin: '*',
    credentials: true,
    methods: '*',
    allowedHeaders: '*'
}));

app.use(express.json());

app.use(express.static(DIST_DIR));

app.get(/^(?!\/api).+/, (req: Request, res: Response) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
        if (err) {
            res.status(404).send('index.html not found');
        }
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Process terminated');
    });
});