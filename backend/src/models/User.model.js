/**
 * User Model
 * Defines the schema for user accounts
 */

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
    validate: {
      validator: function (value) {
        // Require password if authProvider is 'local'
        if (this.authProvider === 'local') {
          return typeof value === 'string' && value.length > 0;
        }
        return true;
      },
      message: 'Password is required for local authentication users.',
    },
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local',
  },
  providerId: {
    type: String,
  },
  avatar: {
    type: String,
  },
  emailVerified: {
    type: Boolean,
    default: false,
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
    default: Date.now,
  },
});

// Indexes for optimized queries
// Compound index for OAuth provider lookups
UserSchema.index({ providerId: 1, authProvider: 1 }, { sparse: true });

// Individual index on providerId for partial matches (sparse since not all users have providerId)
UserSchema.index({ providerId: 1 }, { sparse: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
