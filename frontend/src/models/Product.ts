import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  url: string;
  title: string;
  brand: string;
  article: string;
  composition?: string;
  gender?: string;
  categories: string[];
  breadcrumbs?: { text: string; url: string | null }[];
  price?: string;
  discount_price?: string;
  sizes: string[];
  images: string[];
  description?: any;
  parsedPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    url: { type: String, required: true },
    title: { type: String, required: true },
    brand: { type: String, index: true },
    article: { type: String },
    composition: { type: String },
    gender: { type: String, index: true },
    categories: [{ type: String, index: true }],
    breadcrumbs: [{ type: Schema.Types.Mixed }],
    price: { type: String },
    discount_price: { type: String },
    sizes: [{ type: String }],
    images: [{ type: String }],
    description: { type: Schema.Types.Mixed },
    parsedPrice: { type: Number, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
