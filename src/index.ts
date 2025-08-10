import express from 'express';
import { connectToDatabase } from './db-connection';
import { errorHandler } from './utils/middleware/error-handler';
import routes from './routes';

const HOST = process.env.HOST || 'http://localhost';
const PORT = parseInt(process.env.PORT || '4500');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/', routes);

app.get('/', (req, res) => {
  return res.json({ message: 'Silence is golden!' });
});

app.use(errorHandler);

app.listen(PORT, async () => {
  await connectToDatabase();

  console.log(`Mailr is running on ${HOST}:${PORT} 🚀`);
});
