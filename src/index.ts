import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import cors from 'cors';
import { connectToDatabase } from './db-connection';
import { errorHandler } from './utils/middleware/error-handler';
import routes from './routes';
import { logger, startMessageProcessor } from './utils';

const HOST = process.env.HOST || 'http://localhost';
const PORT = parseInt(process.env.PORT || '4500');

const app = express();

app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/', routes);

app.get('/', (req, res) => {
  return res.json({ message: 'Silence is golden!' });
});

app.use(errorHandler);

const startServer = async () => {
  await connectToDatabase();

  const env = process.env.MAILR_ENV || 'dev';
  const message: string = `🚀 Mailr is running on ${HOST}:${PORT}`;

  if (env === 'prod') {
    const options = {
      key: fs.readFileSync('/etc/letsencrypt/live/mailr.martin.co.ke/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/mailr.martin.co.ke/fullchain.pem'),
    };

    https.createServer(options, app).listen(PORT, () => {
      logger.info(`${message} (HTTPS)`);
      startMessageProcessor();
    });
    return;
  }

  http.createServer(app).listen(PORT, () => {
    logger.info(`${message} (HTTP)`);
    startMessageProcessor();
  });
};

startServer();
