import redis from 'redis';
import config from './index.js';
import logger from '../utils/logger.js';

let redisClient = null;
let connected = false;
let errorLogged = false; // to avoid repeating the same error

export const ConnectRedis = async () => {
  if (!config.redis?.url) {
    logger.warn('⚠️ Redis URL not provided. Skipping Redis connection.');
    return;
  }

  redisClient = redis.createClient({ url: config.redis.url });

  redisClient.on('error', (err) => {
    if (!errorLogged && !connected) {
      logger.warn('⚠️ Redis unavailable, continuing without cache.');
      errorLogged = true;
    } else if (connected) {
      logger.warn(`⚠️ Redis error after connection: ${err.message}`);
    }
  });

  try {
    await redisClient.connect();
    connected = true;
    logger.info('✅ Connected to Redis');
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    logger.warn('⚠️ Failed to connect to Redis, disabling cache.');
    connected = false;
  }
};

export const isConnected = () => connected;

export const safeRedisCall = async (fn, ...args) => {
  if (!connected || !redisClient) {
    return null;
  }
  try {
    return await redisClient[fn](...args);
  } catch (err) {
    logger.debug(`Redis ${fn} failed: ${err.message}`);
    return null;
  }
};

export { redisClient };
