import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    price: { type: Number, required: true },
    weight: { type: Number, required: true, min: 0, default: 0 },

    description: { type: String, required: true },

    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    seoKeywords: { type: String, default: "" },
    seoOgImage: { type: String, default: "" },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: function(arr) {
          return arr.length >= 1 && arr.length <= 6;
        },
        message: "Upload 1–6 images"
      }
    }
    ,
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
