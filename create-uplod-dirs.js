// create-upload-dirs.js - Script à exécuter une fois pour créer les dossiers
const fs = require('fs');
const path = require('path');

const createUploadDirectories = () => {
    const directories = [
        './public',
        './public/uploads',
        './public/uploads/images',
        './public/uploads/avatars',
        './public/uploads/documents'
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Dossier créé: ${dir}`);
        } else {
            console.log(`ℹ️  Dossier existe déjà: ${dir}`);
        }
    });

    // Créer un fichier .gitkeep pour garder les dossiers vides dans git
    const gitkeepDirs = [
        './public/uploads/images',
        './public/uploads/avatars',
        './public/uploads/documents'
    ];

    gitkeepDirs.forEach(dir => {
        const gitkeepPath = path.join(dir, '.gitkeep');
        if (!fs.existsSync(gitkeepPath)) {
            fs.writeFileSync(gitkeepPath, '');
            console.log(`✅ .gitkeep créé dans: ${dir}`);
        }
    });

    console.log('\n🎉 Tous les dossiers d\'upload sont prêts !');
};

// ✅ AJOUT : Fonction à ajouter dans app.js au démarrage
const ensureUploadDirs = () => {
    const directories = [
        path.join(__dirname, 'public'),
        path.join(__dirname, 'public/uploads'),
        path.join(__dirname, 'public/uploads/images'),
        path.join(__dirname, 'public/uploads/avatars'),
        path.join(__dirname, 'public/uploads/documents')
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`📁 Dossier créé: ${dir}`);
        }
    });
};

// Pour utilisation directe
if (require.main === module) {
    createUploadDirectories();
}

module.exports = { createUploadDirectories, ensureUploadDirs };