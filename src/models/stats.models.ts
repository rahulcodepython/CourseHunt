import { Schema, model, models } from 'mongoose';

const StatsSchema = new Schema({
    totalStudents: { type: Number, required: true },
    activeCourses: { type: Number, required: true },
    monthlyRevenue: { type: Number, required: true },
    totalRevenue: { type: Number, required: true },
    month: { type: String, required: true },
    year: { type: String, required: true },
    lastUpdated: { type: Date, default: Date.now }
});

export const Stats = models.Stats || model('Stats', StatsSchema);