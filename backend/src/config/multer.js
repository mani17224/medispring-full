// src/config/multer.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const storage = (subfolder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.env.UPLOAD_DIR || "src/uploads", subfolder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

const imageFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
};

const docFilter = (req, file, cb) => {
  if (ALLOWED_DOC_TYPES.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Only PDF, JPEG, and PNG files are allowed"), false);
};

const uploadProfileImage = multer({
  storage: storage("profiles"),
  fileFilter: imageFilter,
  limits: { fileSize: MAX_SIZE },
});

const uploadLabReport = multer({
  storage: storage("lab-reports"),
  fileFilter: docFilter,
  limits: { fileSize: MAX_SIZE },
});

module.exports = { uploadProfileImage, uploadLabReport };
