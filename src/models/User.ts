// src/models/User.ts
import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  results: [
    {
      type: String, // or refine this with { result: String, createdAt: Date } later
    },
  ],
});

export const User = mongoose.models.User || mongoose.model('User', UserSchema);
