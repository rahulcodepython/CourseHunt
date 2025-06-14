import mongoose, { Schema, models } from "mongoose";


const courseCategorySchema = new Schema({
    name: { type: String, required: true }
});


export const CourseCategory = models.Categories || mongoose.model("Categories", courseCategorySchema);