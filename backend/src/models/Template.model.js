/**
 * Template model
 * Defines schema for templates
 */

import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  templateName: {
    type: String,
    required: true,
  },
  templateData: {
    type: String,
    required: true,
  },
  templateOwner: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  isPublic: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// TODO: indexing (will add later)

export default new mongoose.model('Template', TemplateSchema);
