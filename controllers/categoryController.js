import Category from "../models/Category.js";
import { v2 as cloudinary } from "cloudinary";

/* ================= CREATE ================= */
export const createCategory = async (req, res) => {
  try {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "divyaanza/categories" },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }

        const category = await Category.create({
          name: req.body.name,
          description: req.body.description,
          image: result.secure_url,
        });

        res.json(category);
      }
    );

    stream.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ================= */
export const getCategories = async (req, res) => {
  try {
    const cats = await Category.find();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) {
      return res.status(404).json({ message: "Not found" });
    }

    // try image delete but don't block DB delete
    if (cat.image) {
      try {
        const parts = cat.image.split("/");
        const file = parts.pop();
        const publicId =
          "divyaanza/categories/" + file.split(".")[0];

        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log("Cloudinary delete failed");
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: "Deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
