import mongoose, { Document, Schema } from 'mongoose';

export interface IStory extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  ownerId: mongoose.Types.ObjectId;
  assignedUserId?: mongoose.Types.ObjectId;
  estimatedPoints?: number;
  actualPoints?: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<IStory>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    required: true
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  estimatedPoints: {
    type: Number,
    min: 0,
    max: 100
  },
  actualPoints: {
    type: Number,
    min: 0,
    max: 100
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
storySchema.index({ projectId: 1 });
storySchema.index({ ownerId: 1 });
storySchema.index({ assignedUserId: 1 });
storySchema.index({ status: 1 });
storySchema.index({ priority: 1 });
storySchema.index({ projectId: 1, status: 1 });

export default mongoose.model<IStory>('Story', storySchema);