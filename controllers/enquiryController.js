import Enquiry from "../models/Enquiry.js";
import { sendMail } from "../utils/mailer.js";

const sendEnquiryMail = async (enquiry) => {
  const receiver = process.env.ENQUIRY_RECEIVER_EMAIL || "divyajajoriya014@gmail.com";
  await sendMail({
    to: receiver,
    subject: `New Contact Enquiry from ${enquiry.name}`,
    text: `Name: ${enquiry.name}\nPhone: ${enquiry.phone}\nEmail: ${enquiry.email}\n\nMessage:\n${enquiry.message}`,
  });
};

export const createEnquiry = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !phone || !email || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const enquiry = await Enquiry.create({ name, phone, email, message });
    let mailSent = true;
    try {
      await sendEnquiryMail(enquiry);
    } catch (mailErr) {
      mailSent = false;
      console.log("Enquiry email failed:", mailErr.message);
    }
    res.status(201).json({ success: true, enquiry, mailSent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getEnquiries = async (_req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.json(enquiries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
