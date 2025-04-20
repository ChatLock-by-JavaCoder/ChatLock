import multer from "multer";
import path from "path";

// Set file size limit (e.g., 5MB)
const fileSizeLimit = 5 * 1024 * 1024; // 5MB

// Allow only image file types
const allowedFileTypes = /jpg|jpeg|png|gif/;

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/messages/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter to accept only image file types
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValid = allowedFileTypes.test(ext);
  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type! Only image files are allowed."), false);
  }
};

// Multer setup with file size limit and file filter
export const upload = multer({
  storage,
  limits: { fileSize: fileSizeLimit },
  fileFilter,
});
