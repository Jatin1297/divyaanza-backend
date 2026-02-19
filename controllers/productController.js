import Product from "../models/Product.js";
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

    const product = await Product.create({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      description: req.body.description,
      images: urls,
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
