import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (fileBuffer: Buffer, folder: string = "sofra"): Promise<string> => {
  if (!process.env.CLOUDINARY_API_KEY) {
    console.warn("Cloudinary not configured. Returning placeholder.");
    return "https://via.placeholder.com/150";
  }
  
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        if (result) return resolve(result.secure_url);
        reject(new Error("No result from Cloudinary"));
      }
    );
    uploadStream.end(fileBuffer);
  });
};
