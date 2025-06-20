import mongoose, { Schema, models } from "mongoose";


const courseSchema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: String },
    students: { type: Number },
    rating: { type: Number },
    reviews: { type: Number },
    price: { type: Number },
    originalPrice: { type: Number },
    category: { type: String },
    discount: { type: String },
    totalRevenue: { type: Number, default: 0, required: false },
    imageUrl: {
        url: { type: String, required: false, default: '' },
        fileType: { type: String, required: false, default: '' },
    },
    previewVideoUrl: {
        url: { type: String, required: false, default: '' },
        fileType: { type: String, required: false, default: '' },
    },
    longDescription: { type: String },
    whatYouWillLearn: [String],
    prerequisites: [String],
    requirements: [String],
    chapters: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            title: { type: String },
            preview: { type: Boolean },
            lessons: [
                {
                    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
                    title: { type: String },
                    duration: { type: String },
                    type: { type: String, enum: ['video', 'reading'] },
                    videoUrl: {
                        url: { type: String, required: false, default: '' },
                        fileType: { type: String, required: false, default: '' },
                    },
                    content: { type: String },
                },
            ],
            totallessons: { type: Number },
        },
    ],
    chaptersCount: { type: Number },
    lessonsCount: { type: Number },
    isPublished: { type: Boolean },
    faq: [
        {
            question: { type: String },
            answer: { type: String },
        },
    ],
    resources: [
        {
            title: { type: String },
            fileUrl: {
                url: { type: String, required: false, default: '' },
                fileType: { type: String, required: false, default: '' },
            },
        },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    enrolledStudents: [
        {
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: false,
            },
            email: {
                type: String,
                required: false,
            },
        }
    ],
});


export const Course = models.Course || mongoose.model("Course", courseSchema);