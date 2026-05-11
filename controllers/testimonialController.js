import Testimonial from "../models/Testimonial.js";
import { v2 as cloudinary } from "cloudinary";

const getField = (body, key, fallback = "") => {
  const value = body?.[key];
  if (Array.isArray(value)) return value[0] ?? fallback;
  if (value === undefined || value === null) return fallback;
  return value;
};

export const getTestimonials = async (_req, res) => {
  try {
    const items = await Testimonial.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAdminTestimonials = async (_req, res) => {
  try {
    const items = await Testimonial.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createTestimonial = async (req, res) => {
  try {
    const safeName = String(getField(req.body, "name", "")).trim();
    const safeFeedback = String(getField(req.body, "feedback", "")).trim();
    const role = String(getField(req.body, "role", "Customer")).trim();
    const imageUrl = String(getField(req.body, "imageUrl", "")).trim();
    const stars = Number(getField(req.body, "stars", 5));
    const isActive = String(getField(req.body, "isActive", "true")) === "true";
    if (!safeName || !safeFeedback) {
      return res.status(400).json({ message: "Name and feedback are required" });
    }
    let resolvedImageUrl = imageUrl || "";
    if (req.file) {
      resolvedImageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "divyaanza/testimonials" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    }

    const item = await Testimonial.create({
      name: safeName,
      role: role || "Customer",
      feedback: safeFeedback,
      image: resolvedImageUrl,
      stars: Number.isFinite(stars) ? stars : 5,
      isActive,
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTestimonial = async (req, res) => {
  try {
    const existing = await Testimonial.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: "Testimonial not found" });

    let imageUrl = getField(req.body, "imageUrl", undefined);
    if (req.file) {
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "divyaanza/testimonials" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    }

    const patch = {
      name: getField(req.body, "name", undefined),
      role: getField(req.body, "role", undefined),
      feedback: getField(req.body, "feedback", undefined),
      image: imageUrl,
      stars: getField(req.body, "stars", undefined),
      isActive: getField(req.body, "isActive", undefined),
    };
    Object.keys(patch).forEach((key) => {
      if (patch[key] === undefined) delete patch[key];
    });
    if (patch.name !== undefined) patch.name = String(patch.name).trim();
    if (patch.feedback !== undefined) patch.feedback = String(patch.feedback).trim();
    if (patch.role !== undefined) patch.role = String(patch.role).trim();
    if (patch.stars !== undefined) patch.stars = Number(patch.stars);
    if (patch.isActive !== undefined) patch.isActive = String(patch.isActive) === "true";

    const updated = await Testimonial.findByIdAndUpdate(existing._id, patch, {
      new: true,
      runValidators: true,
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTestimonial = async (req, res) => {
  try {
    const deleted = await Testimonial.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Testimonial not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
