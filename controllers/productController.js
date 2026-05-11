import Product from "../models/Product.js";
import Category from "../models/Category.js";
import { v2 as cloudinary } from "cloudinary";

/* ================= CREATE ================= */
export const createProduct = async (req, res) => {
  try {

    // ✅ Allow 1–6 images
    if (!req.files || req.files.length < 1 || req.files.length > 6) {
      return res.status(400).json({
        message: "Upload 1 to 6 images"
      });
    }

    // ✅ Parallel uploads (FASTER)
    const uploads = req.files.map(file =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "divyaanza/products" },
          (err, result) => err ? reject(err) : resolve(result.secure_url)
        );
        stream.end(file.buffer);
      })
    );

    const urls = await Promise.all(uploads);

    const categoryDoc = await Category.findById(req.body.category).select("defaultProductWeight");
    const parsedWeight = Number(req.body.weight);
    const resolvedWeight = Number.isFinite(parsedWeight)
      ? parsedWeight
      : Number(categoryDoc?.defaultProductWeight || 0);

    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      weight: resolvedWeight,
      description: req.body.description,
      images: urls,
      seoTitle: req.body.seoTitle || "",
      seoDescription: req.body.seoDescription || "",
      seoKeywords: req.body.seoKeywords || "",
      seoOgImage: req.body.seoOgImage || "",
    });

    const populated = await Product.findById(product._id)
      .populate("category");

    res.json(populated);

  } catch (err) {
    console.log("UPLOAD ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ================= GET ================= */
export const getProducts = async (req, res) => {
  const data = await Product.find()
    .populate("category")
    .sort({ createdAt: -1 });

  res.json(data);
};

/* ================= DELETE ================= */
export const deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
};

/* ================= UPDATE ================= */
export const updateProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found" });
    }

    let urls = existing.images;
    if (req.files && req.files.length) {
      if (req.files.length > 6) {
        return res.status(400).json({ message: "Upload up to 6 images" });
      }
      urls = await Promise.all(
        req.files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                { folder: "divyaanza/products" },
                (err, result) => (err ? reject(err) : resolve(result.secure_url))
              );
              stream.end(file.buffer);
            })
        )
      );
    }

    const categoryId = req.body.category ?? existing.category;
    const categoryDoc = await Category.findById(categoryId).select("defaultProductWeight");
    const parsedWeight = Number(req.body.weight);
    const resolvedWeight = Number.isFinite(parsedWeight)
      ? parsedWeight
      : Number(existing.weight ?? categoryDoc?.defaultProductWeight ?? 0);

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name ?? existing.name,
        category: categoryId,
        price: req.body.price ?? existing.price,
        weight: resolvedWeight,
        description: req.body.description ?? existing.description,
        images: urls,
        seoTitle: req.body.seoTitle ?? existing.seoTitle,
        seoDescription: req.body.seoDescription ?? existing.seoDescription,
        seoKeywords: req.body.seoKeywords ?? existing.seoKeywords,
        seoOgImage: req.body.seoOgImage ?? existing.seoOgImage,
      },
      { new: true }
    ).populate("category");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
