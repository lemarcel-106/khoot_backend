const fs = require('fs');
const path = require('path');

// Script de migration pour convertir PUT/DELETE/PATCH en POST
const migrateRoutes = () => {
    const routesDir = path.join(__dirname, 'routes', 'api');
    
    // Liste des fichiers à modifier
    const filesToModify = [
        'pointRoutes.js',
        'participantRoutes.js',
        'planificationRoutes.js',
        'abonnementRoutes.js',
        'paysRoutes.js',
        'faqRoutes.js',
        'avatarRoutes.js',
        'questionRoutes.js',
        'adminRoutes.js',
        'ecoleRoutes.js',
        'jeuRoutes.js',
        'reponseRoutes.js',
        'reponseAppRoutes.js',
        'apprenantRoutes.js',
        'roleRoutes.js',
        'typeQuestionRoutes.js',
        'userRoutes.js',
        'temoignageRoutes.js',
        'notificationRoutes.js'
    ];
    
    filesToModify.forEach(fileName => {
        const filePath = path.join(routesDir, fileName);
        
        try {
            let content = fs.readFileSync(filePath, 'utf8');
            const originalContent = content;
            
            // Remplacer router.put par router.post
            content = content.replace(/router\.put\(/g, 'router.post(');
            
            // Remplacer router.delete par router.post
            content = content.replace(/router\.delete\(/g, 'router.post(');
            
            // Remplacer router.patch par router.post
            content = content.replace(/router\.patch\(/g, 'router.post(');
            
            // Pour les routes GET utilisées pour delete (cas spéciaux)
            if (fileName === 'questionRoutes.js' || fileName === 'reponseRoutes.js') {
                content = content.replace(/router\.get\((.*?)\/delete\//g, 'router.post($1/delete/');
            }
            
            // Ajuster les routes d'abonnement et FAQ pour ajouter /update et /delete
            if (fileName === 'abonnementRoutes.js' || fileName === 'faqRoutes.js' || fileName === 'temoignageRoutes.js') {
                // Pour les routes update
                content = content.replace(/router\.post\('\/(:id)'\s*,\s*ctrl\.update/g, "router.post('/:id/update', ctrl.update");
                // Pour les routes delete
                content = content.replace(/router\.post\('\/(:id)'\s*,\s*ctrl\.remove/g, "router.post('/:id/delete', ctrl.remove");
            }
            
            // Sauvegarder le fichier si des modifications ont été apportées
            if (content !== originalContent) {
                // Créer une sauvegarde
                fs.writeFileSync(`${filePath}.backup`, originalContent);
                // Écrire le nouveau contenu
                fs.writeFileSync(filePath, content);
                console.log(`✅ Modifié: ${fileName}`);
            } else {
                console.log(`ℹ️  Aucune modification nécessaire: ${fileName}`);
            }
            
        } catch (error) {
            console.error(`❌ Erreur lors de la modification de ${fileName}:`, error.message);
        }
    });
    
    console.log('\n📋 Migration terminée!');
    console.log('Des fichiers .backup ont été créés pour chaque fichier modifié.');
};

// Fonction pour restaurer les sauvegardes
const restoreBackups = () => {
    const routesDir = path.join(__dirname, 'routes', 'api');
    
    fs.readdirSync(routesDir).forEach(file => {
        if (file.endsWith('.backup')) {
            const backupPath = path.join(routesDir, file);
            const originalPath = backupPath.replace('.backup', '');
            
            try {
                const backupContent = fs.readFileSync(backupPath, 'utf8');
                fs.writeFileSync(originalPath, backupContent);
                fs.unlinkSync(backupPath);
                console.log(`✅ Restauré: ${path.basename(originalPath)}`);
            } catch (error) {
                console.error(`❌ Erreur lors de la restauration de ${file}:`, error.message);
            }
        }
    });
};

// Fonction pour afficher les changements sans les appliquer
const previewChanges = () => {
    const routesDir = path.join(__dirname, 'routes', 'api');
    const changes = [];
    
    const filesToCheck = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
    
    filesToCheck.forEach(fileName => {
        const filePath = path.join(routesDir, fileName);
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Rechercher les occurrences
        const putMatches = content.match(/router\.put\(/g) || [];
        const deleteMatches = content.match(/router\.delete\(/g) || [];
        const patchMatches = content.match(/router\.patch\(/g) || [];
        const getDeleteMatches = content.match(/router\.get\(.*?\/delete\//g) || [];
        
        if (putMatches.length + deleteMatches.length + patchMatches.length + getDeleteMatches.length > 0) {
            changes.push({
                file: fileName,
                put: putMatches.length,
                delete: deleteMatches.length,
                patch: patchMatches.length,
                getDelete: getDeleteMatches.length
            });
        }
    });
    
    console.log('\n📊 Résumé des modifications nécessaires:\n');
    changes.forEach(change => {
        console.log(`${change.file}:`);
        if (change.put > 0) console.log(`  - ${change.put} route(s) PUT`);
        if (change.delete > 0) console.log(`  - ${change.delete} route(s) DELETE`);
        if (change.patch > 0) console.log(`  - ${change.patch} route(s) PATCH`);
        if (change.getDelete > 0) console.log(`  - ${change.getDelete} route(s) GET (delete)`);
    });
    
    const total = changes.reduce((acc, c) => acc + c.put + c.delete + c.patch + c.getDelete, 0);
    console.log(`\nTotal: ${total} routes à modifier dans ${changes.length} fichiers`);
};

// Exécuter selon les arguments
const args = process.argv.slice(2);

if (args.includes('--preview')) {
    previewChanges();
} else if (args.includes('--restore')) {
    restoreBackups();
} else if (args.includes('--migrate')) {
    migrateRoutes();
} else {
    console.log('Usage:');
    console.log('  node migrate-routes.js --preview  : Afficher les changements sans les appliquer');
    console.log('  node migrate-routes.js --migrate  : Appliquer les changements');
    console.log('  node migrate-routes.js --restore  : Restaurer les fichiers depuis les sauvegardes');
}