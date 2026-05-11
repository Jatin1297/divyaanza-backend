import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    image: String,
    defaultProductWeight: { type: Number, min: 0, default: 0 },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: String, default: "" },
    seoOgImage: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
