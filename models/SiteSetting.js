import mongoose from "mongoose";

const siteSettingSchema = new mongoose.Schema(
  {
    logoUrl: { type: String, default: "" },
    contactNumber: { type: String, default: "+91 99999 99999" },
    whatsappNumber: { type: String, default: "919999999999" },
    address: { type: String, default: "India" },
    supportEmail: { type: String, default: "divyaanzastitch@gmail.com" },
    instagram: { type: String, default: "https://instagram.com" },
    facebook: { type: String, default: "https://facebook.com" },
    youtube: { type: String, default: "https://youtube.com" },
    aboutDescription: {
      type: String,
      default:
        "Divyanza Stitch blends devotion with design. Premium Japa bags for protection and rounded bags for modern styling.",
    },

    seoHomeTitle: { type: String, default: "" },
    seoHomeDescription: { type: String, default: "" },
    seoHomeKeywords: { type: String, default: "" },

    seoShopTitle: { type: String, default: "" },
    seoShopDescription: { type: String, default: "" },
    seoShopKeywords: { type: String, default: "" },

    seoAboutTitle: { type: String, default: "" },
    seoAboutDescription: { type: String, default: "" },
    seoAboutKeywords: { type: String, default: "" },

    seoContactTitle: { type: String, default: "" },
    seoContactDescription: { type: String, default: "" },
    seoContactKeywords: { type: String, default: "" },

    seoDefaultOgImage: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("SiteSetting", siteSettingSchema);
