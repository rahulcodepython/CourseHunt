import mongoose, { HydratedDocument, InferSchemaType, Schema } from 'mongoose';

const UserSchema = new Schema({
    name: { type: String, required: true },
    firstName: { type: String, required: false },
    lastName: { type: String, required: false },
    phone: { type: String, required: false },
    address: { type: String, required: false },
    city: { type: String, required: false },
    country: { type: String, required: false },
    zip: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    role: { type: String, enum: ['admin', 'user'], required: true },
    avatar: { type: String, required: false },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    purchasedCourses: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course',
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
        }
    ]
});

type UserInferSchema = InferSchemaType<typeof UserSchema>;

export type UserDocumentType = HydratedDocument<UserInferSchema>;

export const User = mongoose.models.User || mongoose.model('User', UserSchema);