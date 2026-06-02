import mongoose, { Schema, Document } from 'mongoose';

export interface IVerificationCode extends Document {
    email: string;
    codeHash: string;
    /** Plain code, populated only outside production for Playwright/dev debug. */
    devPlain?: string;
    expiresAt: Date;
    attempts: number;
    consumed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const VerificationCodeSchema: Schema = new Schema(
    {
        email: { type: String, required: true, lowercase: true, trim: true, index: true },
        codeHash: { type: String, required: true },
        devPlain: { type: String, required: false },
        expiresAt: { type: Date, required: true },
        attempts: { type: Number, default: 0 },
        consumed: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Mongo TTL: remove documents the moment expiresAt passes.
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.VerificationCode ||
    mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
