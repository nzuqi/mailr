import mongoose, { ConnectOptions } from 'mongoose';
import { logger } from './utils';

mongoose.Promise = global.Promise;

const { MONGODB_URL } = process.env;

const connectToDatabase = async (): Promise<void> => {
  if (!MONGODB_URL) {
    throw new Error('MONGODB_URL is not defined');
  }

  const options: ConnectOptions = { autoIndex: true };

  await mongoose
    .connect(MONGODB_URL, options)
    .then(() => {
      logger.info(`🚀 Connected to the database.`);
    })
    .catch((err) => {
      logger.error(`❌ Cannot connect to the database: ${err}`);
      process.exit();
    });
};

export { connectToDatabase };
