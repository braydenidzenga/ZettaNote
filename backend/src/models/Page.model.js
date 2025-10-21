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

export default mongoose.model('Page', PageSchema);
