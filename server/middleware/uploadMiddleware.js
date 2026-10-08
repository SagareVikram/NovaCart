import multer from "multer";

import {
  cloudinary,
} from "../config/cloudinary.js";

/**
 * =========================================================
 * NOVACART CLOUDINARY MULTER STORAGE
 * =========================================================
 *
 * We use a small custom Multer storage engine instead of
 * multer-storage-cloudinary.
 *
 * This keeps NovaCart compatible with:
 *
 * - Multer 2.x
 * - Cloudinary 2.x
 *
 * The uploaded file object will contain:
 *
 * file.path
 *     -> Cloudinary secure image URL
 *
 * file.filename
 *     -> Cloudinary public ID
 *
 * Those names intentionally match the existing
 * adminController.js code, so no controller rewrite
 * is required.
 */

/**
 * Upload one Multer file stream directly to Cloudinary.
 */
const uploadFileToCloudinary = (
  file,
  callback
) => {
  /**
   * Cloudinary credentials are configured from server.js
   * before Express starts accepting requests.
   *
   * Still perform this check so the API returns a useful
   * error if image upload is attempted before credentials
   * have been configured.
   */
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
    return callback(
      new Error(
        "Cloudinary is not configured. Add the Cloudinary environment variables before uploading product images."
      )
    );
  }

  const uploadStream =
    cloudinary.uploader.upload_stream(
      {
        folder:
          "novacart/products",

        resource_type:
          "image",

        /**
         * Keep uploaded images at a maximum of
         * 1200 x 1200 without enlarging smaller images.
         */
        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: "limit",
            quality: "auto",
            fetch_format:
              "auto",
          },
        ],
      },

      (
        error,
        result
      ) => {
        if (error) {
          return callback(
            error
          );
        }

        if (
          !result ||
          !result.secure_url ||
          !result.public_id
        ) {
          return callback(
            new Error(
              "Cloudinary did not return valid image information."
            )
          );
        }

        return callback(
          null,
          {
            /**
             * Existing adminController.js expects:
             *
             * file.path
             * file.filename
             */
            path:
              result.secure_url,

            filename:
              result.public_id,

            /**
             * Additional useful metadata.
             */
            secure_url:
              result.secure_url,

            public_id:
              result.public_id,

            format:
              result.format,

            width:
              result.width,

            height:
              result.height,

            bytes:
              result.bytes,
          }
        );
      }
    );

  /**
   * Multer gives us a readable stream.
   *
   * Pipe it directly to Cloudinary instead of first
   * writing the file to the local server disk.
   */
  file.stream.pipe(
    uploadStream
  );

  return undefined;
};

/**
 * =========================================================
 * CUSTOM MULTER STORAGE ENGINE
 * =========================================================
 */
const cloudinaryStorage = {
  /**
   * Called by Multer for each uploaded file.
   */
  _handleFile(
    req,
    file,
    callback
  ) {
    uploadFileToCloudinary(
      file,
      callback
    );
  },

  /**
   * Called by Multer if it needs to roll back/remove
   * an already uploaded file.
   */
  _removeFile(
    req,
    file,
    callback
  ) {
    const publicId =
      file.filename ||
      file.public_id;

    if (!publicId) {
      return callback(
        null
      );
    }

    cloudinary.uploader.destroy(
      publicId,
      {
        resource_type:
          "image",
      },
      (error) => {
        /**
         * Multer expects the callback even when Cloudinary
         * deletion fails.
         */
        if (error) {
          console.error(
            "Cloudinary rollback delete error:",
            error.message
          );
        }

        callback(null);
      }
    );

    return undefined;
  },
};

/**
 * =========================================================
 * FILE TYPE VALIDATION
 * =========================================================
 */
const fileFilter = (
  req,
  file,
  callback
) => {
  const allowedMimeTypes =
    [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

  if (
    allowedMimeTypes.includes(
      file.mimetype
    )
  ) {
    return callback(
      null,
      true
    );
  }

  return callback(
    new Error(
      "Only JPG, JPEG, PNG and WEBP image files are allowed."
    ),
    false
  );
};

/**
 * =========================================================
 * MULTER CONFIGURATION
 * =========================================================
 *
 * Maximum individual image size:
 * 5 MB
 *
 * Number of images:
 * Controlled by the route:
 *
 * upload.array("images", 6)
 */
const upload = multer({
  storage:
    cloudinaryStorage,

  limits: {
    fileSize:
      5 *
      1024 *
      1024,
  },

  fileFilter,
});

export {
  upload,
};