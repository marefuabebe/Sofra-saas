import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine the resource type based on mime type
    let resource_type = "auto";
    if (file.mimetype === "application/pdf") {
      resource_type = "auto"; // Cloudinary handles PDFs automatically now that the security setting is enabled
    }
    
    return {
      folder: "sofra/verification_documents",
      resource_type: resource_type,
      public_id: `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, "_")}`,
    };
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, JPG, PNG, and WebP are allowed."));
    }
  },
});

export class VerificationFileService {
  /**
   * Generates the internal file URL mapping to be saved in DB.
   * With Cloudinary, the file object from multer already contains the secure_url.
   */
  static getInternalFileUrl(file: Express.Multer.File): string {
    // Multer-storage-cloudinary attaches path to the file object which is the URL
    return file.path;
  }

  /**
   * Deletes a document from storage.
   */
  static async deleteDocument(fileUrl: string): Promise<void> {
    try {
      // Extract public_id from Cloudinary URL
      // Example URL: https://res.cloudinary.com/dl4albij/image/upload/v171.../sofra/verification_documents/172..._file_pdf.pdf
      const urlParts = fileUrl.split("/");
      const folderIndex = urlParts.findIndex(part => part === "sofra");
      if (folderIndex !== -1) {
        const publicIdWithExtension = urlParts.slice(folderIndex).join("/");
        const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (err) {
      console.error(`Failed to delete file from Cloudinary: ${fileUrl}`, err);
    }
  }
}

