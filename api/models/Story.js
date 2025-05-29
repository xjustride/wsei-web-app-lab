const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, trim: true },
  priority:     { type: String, enum: ['low','medium','high','critical'], default: 'medium' },
  state:        { type: String, enum: ['todo','doing','done'], default: 'todo' },
  project:      { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  tasks:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) { ret.id = ret._id; delete ret._id; delete ret.__v; return ret; }
  }
});

module.exports = mongoose.model('Story', storySchema);
