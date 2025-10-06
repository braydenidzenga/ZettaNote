import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminAccountSchema = new mongoose.Schema({
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
    minlength: 8,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'moderator'],
    default: 'admin',
    required: true,
  },
  permissions: {
    type: [String],
    default: ['read_users', 'read_pages'],
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
    required: true,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  firstLogin: {
    type: Boolean,
    default: true,
    required: true,
  },
  mustChangePassword: {
    type: Boolean,
    default: true,
    required: true,
  },
  loginAttempts: {
    type: Number,
    default: 0,
    required: true,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  ipWhitelist: {
    type: [String],
    default: [],
  },
  twoFactorSecret: {
    type: String,
    default: null,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminAccount',
    default: null,
  },
  auditLog: [
    {
      action: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      ip: String,
      userAgent: String,
      details: mongoose.Schema.Types.Mixed,
    },
  ],
});

// Virtual for checking if account is locked
AdminAccountSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware to hash password
AdminAccountSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = 12; // Higher than normal user passwords
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
AdminAccountSchema.methods.comparePassword = async function (candidatePassword) {
  if (this.isLocked) {
    throw new Error('Account is temporarily locked');
  }

  try {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);

    if (isMatch) {
      // Reset login attempts on successful login
      if (this.loginAttempts > 0) {
        this.loginAttempts = 0;
        this.lockUntil = null;
        await this.save();
      }
      return true;
    } else {
      // Increment login attempts
      this.loginAttempts += 1;

      // Lock account after 5 failed attempts for 30 minutes
      if (this.loginAttempts >= 5) {
        this.lockUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
      }

      await this.save();
      return false;
    }
  } catch (error) {
    throw error;
  }
};

// Method to add audit log entry
AdminAccountSchema.methods.addAuditLog = function (action, ip, userAgent, details = {}) {
  this.auditLog.push({
    action,
    ip,
    userAgent,
    details,
  });

  // Keep only last 1000 audit log entries per admin
  if (this.auditLog.length > 1000) {
    this.auditLog = this.auditLog.slice(-1000);
  }
};

// Static method to check permissions
AdminAccountSchema.statics.hasPermission = function (admin, permission) {
  if (admin.role === 'super_admin') return true;
  return admin.permissions.includes(permission);
};

// Define permission constants
AdminAccountSchema.statics.PERMISSIONS = {
  READ_USERS: 'read_users',
  WRITE_USERS: 'write_users',
  DELETE_USERS: 'delete_users',
  BAN_USERS: 'ban_users',
  READ_PAGES: 'read_pages',
  DELETE_PAGES: 'delete_pages',
  READ_ANALYTICS: 'read_analytics',
  MANAGE_ADMINS: 'manage_admins',
  SYSTEM_CONFIG: 'system_config',
};

// Define role-based default permissions
AdminAccountSchema.statics.ROLE_PERMISSIONS = {
  super_admin: Object.values(AdminAccountSchema.statics.PERMISSIONS),
  admin: ['read_users', 'write_users', 'ban_users', 'read_pages', 'delete_pages', 'read_analytics'],
  moderator: ['read_users', 'ban_users', 'read_pages', 'delete_pages'],
};

export default mongoose.model('AdminAccount', AdminAccountSchema);
