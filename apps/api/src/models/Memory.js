import mongoose from 'mongoose';
import { LIMITS } from '@web-memory/shared';

const memorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [LIMITS.TITLE_MAX_LENGTH, `Title cannot exceed ${LIMITS.TITLE_MAX_LENGTH} characters`],
    },
    url: {
      type: String,
      required: [true, 'URL is required'],
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['page', 'highlight', 'snippet', 'note'],
      default: 'page',
      index: true,
    },
    selectedText: {
      type: String,
      default: '',
      maxlength: [LIMITS.SELECTED_TEXT_MAX_LENGTH, `Selected text cannot exceed ${LIMITS.SELECTED_TEXT_MAX_LENGTH} characters`],
    },
    note: {
      type: String,
      default: '',
      maxlength: [LIMITS.NOTE_MAX_LENGTH, `Note cannot exceed ${LIMITS.NOTE_MAX_LENGTH} characters`],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    summary: {
      type: String,
      default: null,
    },
    embedding: {
      type: [Number],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user recent memories list
memorySchema.index({ userId: 1, createdAt: -1 });

// Text index for search across title, note, selectedText, and tags
memorySchema.index({
  title: 'text',
  note: 'text',
  selectedText: 'text',
  tags: 'text',
});

export const Memory = mongoose.model('Memory', memorySchema);
