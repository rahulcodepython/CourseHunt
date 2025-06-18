import mongoose, { Schema } from 'mongoose';

const FeedbackSchema: Schema = new Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    createdAt: { type: Date, default: Date.now },
    courseId: { type: String, required: true },
    courseName: { type: String, required: true },
    message: { type: String, required: true },
});

export const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema);