import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectMember {
  userId: mongoose.Types.ObjectId;
  assignedAt: Date;
}

export interface IProjectViewer {
  userId: mongoose.Types.ObjectId;
  assignedAt: Date;
}

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  nazwa: string;
  opis?: string;
  ownerId: mongoose.Types.ObjectId;
  members: IProjectMember[];
  viewers: IProjectViewer[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const projectViewerSchema = new Schema<IProjectViewer>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const projectSchema = new Schema<IProject>({
  nazwa: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  opis: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [projectMemberSchema],
  viewers: [projectViewerSchema],
  isActive: {
    type: Boolean,
    default: true
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
projectSchema.index({ ownerId: 1 });
projectSchema.index({ 'members.userId': 1 });
projectSchema.index({ 'viewers.userId': 1 });
projectSchema.index({ isActive: 1 });

export default mongoose.model<IProject>('Project', projectSchema);