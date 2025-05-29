import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectMember {
  userId: mongoose.Types.ObjectId;
  assignedAt: Date;
}

export interface IProject extends Document {
  nazwa: string;
  opis?: string;
  ownerId: mongoose.Types.ObjectId;
  members: IProjectMember[];
  viewers: IProjectMember[]; // Users who can view the project
  createdAt: Date;
}

const ProjectMemberSchema = new Schema<IProjectMember>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now }
});

const ProjectSchema = new Schema<IProject>({
  nazwa: { type: String, required: true },
  opis: { type: String },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [ProjectMemberSchema], default: [] },
  viewers: { type: [ProjectMemberSchema], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IProject>('Project', ProjectSchema);