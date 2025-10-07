import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  pages: {
    type: [mongoose.Types.ObjectId],
    required: true,
    default: [],
  },
  sharedPages: {
    type: [mongoose.Types.ObjectId],
    required: true,
    default: [],
  },
  banned: {
    type: Boolean,
    required: true,
    default: false,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
});

export default new mongoose.model('User', UserSchema);
