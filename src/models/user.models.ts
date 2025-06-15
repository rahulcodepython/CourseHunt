import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    clerk_id: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);