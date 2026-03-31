import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { successResponse } from './utils/response.formatter';

const app: Application = express();

app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json(
    successResponse("Stud'Housing Trust API est opérationnelle 🚀", {
       environment: process.env.NODE_ENV,
       timestamp: new Date().toISOString()
    })
  );
});

app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Ressource introuvable' });
});

export default app;
