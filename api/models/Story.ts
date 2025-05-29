import mongoose, { Document, Schema } from 'mongoose';

export interface IStory extends Document {
  projectId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  ownerId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StorySchema = new Schema<IStory>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    name: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export default mongoose.model<IStory>('Story', StorySchema);