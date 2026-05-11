import { v2 as cloudinary } from "cloudinary";
import GalleryItem from "../models/GalleryItem.js";

export const getGalleryItems = async (_req, res) => {
  try {
    const items = await GalleryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createGalleryItem = async (req, res) => {
  try {
    const { title, caption } = req.body;
    if (!title || !req.file) {
      return res.status(400).json({ message: "Title and image are required" });
    }

    const imageUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "divyaanza/gallery" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    const item = await GalleryItem.create({
      title,
      caption: caption || "",
      image: imageUrl,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteGalleryItem = async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (item.image) {
      try {
        const parts = item.image.split("/");
        const file = parts.pop();
        const publicId = `divyaanza/gallery/${file.split(".")[0]}`;
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // best effort cleanup
      }
    }

    await GalleryItem.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateGalleryItem = async (req, res) => {
  try {
    const updated = await GalleryItem.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        caption: req.body.caption,
      },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Item not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
