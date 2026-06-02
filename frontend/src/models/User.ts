import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: false },
    name: { type: String, required: false },
  },
  { timestamps: true, collection: 'auth_users' }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
