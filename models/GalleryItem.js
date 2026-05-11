import mongoose from "mongoose";

const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    caption: { type: String, default: "", trim: true },
    image: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("GalleryItem", galleryItemSchema);
