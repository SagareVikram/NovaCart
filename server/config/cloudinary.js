import { v2 as cloudinary } from "cloudinary";

/**
 * Configure Cloudinary for NovaCart.
 *
 * Required environment variables:
 * CLOUDINARY_CLOUD_NAME
 * CLOUDINARY_API_KEY
 * CLOUDINARY_API_SECRET
 */
const configureCloudinary = () => {
  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  } = process.env;

  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    console.warn(
      "Cloudinary is not configured yet. Product image upload will remain unavailable until Cloudinary environment variables are added."
    );

    return false;
  }

  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });

  return true;
};

export { cloudinary, configureCloudinary };