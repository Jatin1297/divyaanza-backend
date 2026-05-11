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
          defaultProductWeight: Number(req.body.defaultProductWeight || 0),
          seoTitle: req.body.seoTitle || "",
          seoDescription: req.body.seoDescription || "",
          seoKeywords: req.body.seoKeywords || "",
          seoOgImage: req.body.seoOgImage || "",
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

export const updateCategory = async (req, res) => {
  try {
    const existing = await Category.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Not found" });
    }

    let image = existing.image;
    if (req.file) {
      image = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "divyaanza/categories" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name ?? existing.name,
        description: req.body.description ?? existing.description,
        image,
        defaultProductWeight:
          req.body.defaultProductWeight !== undefined
            ? Number(req.body.defaultProductWeight || 0)
            : existing.defaultProductWeight,
        seoTitle: req.body.seoTitle ?? existing.seoTitle,
        seoDescription: req.body.seoDescription ?? existing.seoDescription,
        seoKeywords: req.body.seoKeywords ?? existing.seoKeywords,
        seoOgImage: req.body.seoOgImage ?? existing.seoOgImage,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
