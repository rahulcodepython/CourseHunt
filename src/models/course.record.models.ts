import mongoose, { Schema, models } from "mongoose";

const CourseRecordSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    completedLessons: { type: Number, default: 0 },
    courses: [
        {
            courseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Course',
                required: true,
            },
            totalLessons: { type: Number, default: 0 },
            completedLessons: { type: Number, default: 0 },
            lastViewedLessonId: { type: String, default: '' },
            viewed: [{
                chapters: [
                    {
                        chapterId: { type: String, required: true },
                        lessons: [
                            {
                                lessonId: { type: String, required: true },
                                viewedAt: { type: Date, default: Date.now },
                            },
                        ],
                    },
                ],
            }],
        },
    ],
});



export const CourseRecord = models.CourseRecord || mongoose.model("CourseRecord", CourseRecordSchema);