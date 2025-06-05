import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  result: { type: String, required: true },
  form: {
    drug: String,
    disease: String,
    audience: String,
    intensity: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export const Result = mongoose.models.Result || mongoose.model('Result', ResultSchema);
