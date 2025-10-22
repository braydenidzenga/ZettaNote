/**
 * Page Model
 * Defines the schema for note pages
 */

import mongoose from 'mongoose';

const PageSchema = new mongoose.Schema({
  pageName: {
    type: String,
    required: true,
  },
  pageData: {
    type: String,
    required: false,
    default: '',
  },
  owner: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  sharedTo: {
    type: [mongoose.Types.ObjectId],
    required: true,
    default: [],
  },
  publicShareId: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  allowDownload: { type: Boolean, default: false },
});

// Indexes for optimized queries
// Index on owner for fast owned pages queries
PageSchema.index({ owner: 1 });

// Index on sharedTo for fast shared pages queries
PageSchema.index({ sharedTo: 1 });

// Index on publicShareId for fast public share lookups
PageSchema.index({ publicShareId: 1 }, { sparse: true });

// Compound index for owner + createdAt for sorted owned pages
PageSchema.index({ owner: 1, createdAt: -1 });

// Compound index for sharedTo + createdAt for sorted shared pages
PageSchema.index({ sharedTo: 1, createdAt: -1 });

export default mongoose.model('Page', PageSchema);
