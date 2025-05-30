import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeLog {
  _id?: mongoose.Types.ObjectId;
  date: Date;
  hours: number;
  comment?: string;
  userId?: mongoose.Types.ObjectId;
  createdAt?: Date;
}

const timeLogSchema = new Schema<ITimeLog>({
  date: {
    type: Date,
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: 0.1,
    max: 24
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  storyId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedUserId?: mongoose.Types.ObjectId;
  estimatedTime?: number; // in hours
  loggedHours: number;
  timeLogs: ITimeLog[];
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  storyId: {
    type: Schema.Types.ObjectId,
    ref: 'Story',
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
  assignedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  estimatedTime: {
    type: Number,
    min: 0,
    default: 0
  },
  loggedHours: {
    type: Number,
    min: 0,
    default: 0
  },
  timeLogs: [timeLogSchema],
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
taskSchema.index({ projectId: 1 });
taskSchema.index({ storyId: 1 });
taskSchema.index({ assignedUserId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ storyId: 1, status: 1 });

// Pre-save middleware to update loggedHours
taskSchema.pre('save', function(next) {
  if (this.isModified('timeLogs')) {
    this.loggedHours = this.timeLogs.reduce((total, log) => total + log.hours, 0);
  }
  next();
});

export default mongoose.model<ITask>('Task', taskSchema);