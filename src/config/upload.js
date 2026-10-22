'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, '../../uploads'),
  path.join(__dirname, '../../uploads/materials'),
  path.join(__dirname, '../../uploads/assignments'),
  path.join(__dirname, '../../uploads/solutions')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx',
  'xls', 'xlsx', 'txt', 'png', 'jpg',
  'jpeg', 'webp', 'zip', 'c', 'cpp',
  'h', 'hpp', 'py', 'java', 'js', 'ts',
  'sql', 'sh', 'json', 'md'
];

function createStorage(subfolder) {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      const dest = path.join(__dirname, '../../uploads', subfolder);
      cb(null, dest);
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
      const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
      const safeBase = path.basename(file.originalname, path.extname(file.originalname))
        .replace(/[^a-zA-Z0-9_\-\.]/g, '_')
        .slice(0, 40);
      cb(null, `${safeBase}-${uniqueSuffix}.${ext}`);
    }
  });
}

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`File type .${ext} is not allowed. Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`));
  }
  cb(null, true);
}

// 50 MB limit
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const materialUpload = multer({
  storage: createStorage('materials'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

const assignmentUpload = multer({
  storage: createStorage('assignments'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

const solutionUpload = multer({
  storage: createStorage('solutions'),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = {
  materialUpload,
  assignmentUpload,
  solutionUpload,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE
};
