import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "Customer", trim: true },
    feedback: { type: String, required: true, trim: true },
    image: { type: String, default: "", trim: true },
    stars: { type: Number, default: 5, min: 1, max: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Testimonial", testimonialSchema);
