// middleware/upload.js - VERSION CORRIGÉE
const multer = require('multer');
const path = require('path');

// Configuration du stockage pour les images
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/images');
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        // ✅ CORRECTION : Stocker le chemin complet accessible depuis le web
        req.fullImagePath = `/uploads/images/${filename}`;
        cb(null, filename);
    }
});

// Configuration du stockage pour les avatar
const imageAvatar = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/avatars');
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        // ✅ CORRECTION : Stocker le chemin complet accessible depuis le web
        req.fullAvatarPath = `/uploads/avatars/${filename}`;
        cb(null, filename);
    }
});

// Configuration du stockage pour les documents
const documentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/uploads/documents');
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        // ✅ CORRECTION : Stocker le chemin complet accessible depuis le web
        req.fullDocumentPath = `/uploads/documents/${filename}`;
        cb(null, filename);
    }
});

// Filtre pour les images (png, jpg, jpeg)
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Seuls les fichiers jpg, jpeg, png sont autorisés.'));
    }
};

// Filtre pour les documents (pdf, doc, docx)
const documentFileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Seuls les fichiers pdf, doc, docx sont autorisés.'));
    }
};

// Initialisation de multer pour les images
const uploadImage = multer({
    storage: imageStorage,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: imageFileFilter
});

// Initialisation de multer pour les images
const uploadAvatar = multer({
    storage: imageAvatar,
    limits: { fileSize: 1024 * 1024 * 5 },
    fileFilter: imageFileFilter
});

// Initialisation de multer pour les documents
const uploadDocument = multer({
    storage: documentStorage,
    limits: { fileSize: 1024 * 1024 * 10 },
    fileFilter: documentFileFilter
});

module.exports = {
    uploadImage,
    uploadDocument,
    uploadAvatar
};