import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
dotenv.config();

if (process.env.CLOUDINARY_API_KEY === undefined) {
  logger.error('CLOUDINARY_API_KEY is not defined in environment variables');
}
if (process.env.CLOUDINARY_CLOUD_NAME === undefined) {
  logger.error('CLOUDINARY_CLOUD_NAME is not defined in environment variables');
}
if (process.env.CLOUDINARY_SECRET === undefined) {
  logger.error('CLOUDINARY_SECRET is not defined in environment variables');
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export default cloudinary;
