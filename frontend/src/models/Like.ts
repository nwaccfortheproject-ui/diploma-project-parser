import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILike extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LikeSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  },
  { timestamps: true }
);

LikeSchema.index({ userId: 1, productId: 1 }, { unique: true });

export default mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);
