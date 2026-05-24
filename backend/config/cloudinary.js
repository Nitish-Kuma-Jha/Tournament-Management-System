const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const createStorage = (folder, allowedFormats = ['jpg', 'jpeg', 'png', 'webp', 'pdf']) => {
  return new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `tournament-system/${folder}`,
      allowed_formats: allowedFormats,
      resource_type: 'auto',
    },
  });
};

const uploadAvatar = multer({
  storage: createStorage('avatars', ['jpg', 'jpeg', 'png', 'webp']),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadDocument = multer({
  storage: createStorage('documents', ['jpg', 'jpeg', 'png', 'pdf']),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadBanner = multer({
  storage: createStorage('banners', ['jpg', 'jpeg', 'png', 'webp']),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const deleteImage = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

module.exports = { cloudinary, uploadAvatar, uploadDocument, uploadBanner, deleteImage };
