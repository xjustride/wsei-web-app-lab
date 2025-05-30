import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash?: string;
  role: 'admin' | 'developer' | 'devops' | 'guest';
  authProvider: 'local' | 'google' | 'github';
  providerId?: string;
  googleId?: string; // For Google OAuth compatibility
  avatar?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  firstName: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 50 
  },
  lastName: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 50 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  passwordHash: { 
    type: String,
    required: function(this: IUser) {
      return this.authProvider === 'local';
    }
  },
  role: { 
    type: String, 
    enum: ['admin', 'developer', 'devops', 'guest'], 
    default: 'guest',
    required: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local',
    required: true
  },
  providerId: {
    type: String,
    sparse: true // Allows multiple null values but unique non-null values
  },
  googleId: {
    type: String,
    sparse: true // For Google OAuth compatibility
  },
  avatar: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash; // Never return password hash
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ authProvider: 1, providerId: 1 });

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) {
    return false;
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model<IUser>('User', userSchema);