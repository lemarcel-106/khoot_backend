// Script à exécuter UNE SEULE FOIS pour corriger la base de données
// Vous pouvez l'exécuter via MongoDB Compass, MongoDB CLI, ou créer un script temporaire

// Option 2: Via un script Node.js temporaire
// =========================================
const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndexes() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connecté à MongoDB');

        // Obtenir la collection Apprenant
        const collection = mongoose.connection.db.collection('apprenants');

        // Lister tous les index existants
        const indexes = await collection.listIndexes().toArray();
        console.log('📋 Index existants:', indexes.map(i => i.name));

        // Supprimer l'index unique sur phone (s'il existe)
        try {
            await collection.dropIndex("phone_1");
            console.log('✅ Index unique sur "phone" supprimé');
        } catch (error) {
            console.log('ℹ️ Index "phone_1" n\'existe pas ou déjà supprimé');
        }

        // Supprimer l'index unique sur email (s'il existe)
        try {
            await collection.dropIndex("email_1");
            console.log('✅ Index unique sur "email" supprimé');
        } catch (error) {
            console.log('ℹ️ Index "email_1" n\'existe pas ou déjà supprimé');
        }

        // Vérifier les index restants
        const remainingIndexes = await collection.listIndexes().toArray();
        console.log('📋 Index restants:', remainingIndexes.map(i => i.name));

        console.log('🎉 Correction terminée ! Vous pouvez maintenant créer des apprenants.');
        
    } catch (error) {
        console.error('❌ Erreur:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Déconnecté de MongoDB');
    }
}

// Exécuter le script
fixIndexes();
