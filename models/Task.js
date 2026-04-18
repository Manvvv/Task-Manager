
//  Mongoose schema & model for a Task document

const mongoose = require('mongoose');

// ── SCHEMA ────────────────────────────────────────────────────
const taskSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Task title is required'],
      trim:      true,
      maxlength: [120, 'Title cannot exceed 120 characters']
    },

    desc: {
      type:    String,
      trim:    true,
      default: ''
    },

    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high'],
      default: 'medium'
    },

    category: {
      type:    String,
      enum:    ['general', 'work', 'personal', 'study', 'health'],
      default: 'general'
    },

    completed: {
      type:    Boolean,
      default: false
    },

    updatedAt: {
      type: Date
    }
  },
  {
    // Automatically adds `createdAt` and `updatedAt` timestamps
    timestamps: { createdAt: 'createdAt', updatedAt: false }
  }
);

// ── INDEXES ───────────────────────────────────────────────────
taskSchema.index({ priority:  1 });
taskSchema.index({ completed: 1 });
taskSchema.index({ createdAt: -1 });

// Text index for search across title and desc
taskSchema.index({ title: 'text', desc: 'text' });

// ── VIRTUALS ──────────────────────────────────────────────────
// Returns how old the task is in human-readable form
taskSchema.virtual('age').get(function () {
  const diff = Date.now() - this.createdAt.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
});

// ── INSTANCE METHODS ──────────────────────────────────────────
// Mark task as complete
taskSchema.methods.complete = async function () {
  this.completed = true;
  this.updatedAt = new Date();
  return this.save();
};

// Mark task as active
taskSchema.methods.reopen = async function () {
  this.completed = false;
  this.updatedAt = new Date();
  return this.save();
};

// ── STATIC METHODS (collection-level) ─────────────────────────
// Get counts grouped by priority
taskSchema.statics.countByPriority = async function () {
  return this.aggregate([
    { $match: { completed: false } },
    { $group: { _id: '$priority', count: { $sum: 1 } } }
  ]);
};

// Bulk delete all completed tasks
taskSchema.statics.clearCompleted = async function () {
  return this.deleteMany({ completed: true });
};

// ── PRE-SAVE HOOKS ────────────────────────────────────────────
// Capitalise first letter of title before saving
taskSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.title = this.title.charAt(0).toUpperCase() + this.title.slice(1);
  }
  next();
});

// ── MODEL ─────────────────────────────────────────────────────
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
