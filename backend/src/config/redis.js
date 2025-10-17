import redisClient from 'redis';
import config from './index.js';
import logger from '../utils/logger.js';

// Create and connect Redis client
const client = redisClient.createClient({
  url: config.redis.url,
});

const ConnectRedis = async () => {
  client.on('error', (err) => logger.error('Redis Client Error', err));
  await client.connect();
  logger.info('✅ Connected to Redis');
};

export { ConnectRedis, client as redisClient };
