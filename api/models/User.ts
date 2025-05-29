import mongoose, { Document, Schema } from 'mongoose';

export interface ITimeLog extends Document {
  date: Date;
  hours: number;
  comment?: string;
  userId?: mongoose.Types.ObjectId; // Optional: to track who logged the time
  // createdAt will be handled by timestamps on the sub-document schema if needed
}

const TimeLogSchema = new Schema<ITimeLog>(
  {
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0.1 },
    comment: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } } // Add createdAt for each log entry
);

export interface ITask extends Document {
  name: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: mongoose.Types.ObjectId;
  storyId: mongoose.Types.ObjectId;
  assignedUserId?: mongoose.Types.ObjectId;
  estimatedTime?: number; // in hours
  loggedHours?: number; // Actual time spent, in hours - this will be the sum of timeLogs
  timeLogs?: ITimeLog[]; // Array to store individual time log entries
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    storyId: { type: Schema.Types.ObjectId, ref: 'Story', required: true },
    assignedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    estimatedTime: { type: Number }, // in hours
    loggedHours: { type: Number, default: 0 },
    timeLogs: [TimeLogSchema], // Embed the TimeLog schema
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { timestamps: true } // Adds createdAt and updatedAt automatically
);

export default mongoose.model<ITask>('Task', TaskSchema);