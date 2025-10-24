import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
  // Cloudinary public ID for the image
  publicId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // Full Cloudinary URL
  url: {
    type: String,
    required: true,
  },

  // Original filename if provided
  originalName: {
    type: String,
    default: null,
  },

  // Size in bytes
  size: {
    type: Number,
    default: 0,
  },

  // MIME type
  mimeType: {
    type: String,
    default: 'image/jpeg',
  },

  // User who uploaded the image
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // Pages that currently use this image (for reference counting)
  usedInPages: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
    },
  ],

  // Reference count - how many places use this image
  referenceCount: {
    type: Number,
    default: 0,
    min: 0,
  },

  // Status of the image
  status: {
    type: String,
    enum: ['active', 'marked_for_deletion', 'deleted'],
    default: 'active',
    index: true,
  },

  // When to delete if marked for deletion (grace period)
  deleteAt: {
    type: Date,
    default: null,
  },

  // Upload timestamp
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  // Last used timestamp (updated when referenced)
  lastUsedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
imageSchema.index({ status: 1, deleteAt: 1 });
imageSchema.index({ uploadedBy: 1, status: 1 });
imageSchema.index({ usedInPages: 1 });

// Pre-save middleware to update reference count
imageSchema.pre('save', function (next) {
  this.referenceCount = this.usedInPages.length;
  next();
});

// Static method to find images marked for deletion
imageSchema.statics.findMarkedForDeletion = function () {
  return this.find({
    status: 'marked_for_deletion',
    deleteAt: { $lte: new Date() },
  });
};

// Static method to find orphaned images (no references)
imageSchema.statics.findOrphaned = function () {
  return this.find({
    referenceCount: 0,
    status: 'active',
  });
};

// Instance method to mark for deletion
imageSchema.methods.markForDeletion = function (gracePeriodHours = 24) {
  this.status = 'marked_for_deletion';
  this.deleteAt = new Date(Date.now() + gracePeriodHours * 60 * 60 * 1000);
  return this.save();
};

// Instance method to restore from deletion
imageSchema.methods.restore = function () {
  this.status = 'active';
  this.deleteAt = null;
  return this.save();
};

// Instance method to add page reference
imageSchema.methods.addPageReference = function (pageId) {
  if (!this.usedInPages.includes(pageId)) {
    this.usedInPages.push(pageId);
    this.lastUsedAt = new Date();
  }
  return this.save();
};

// Instance method to remove page reference
imageSchema.methods.removePageReference = function (pageId) {
  const index = this.usedInPages.indexOf(pageId);
  if (index > -1) {
    this.usedInPages.splice(index, 1);
    this.lastUsedAt = new Date();
  }
  return this.save();
};

const Image = mongoose.model('Image', imageSchema);

export default Image;
