const Apprenant = require('../models/Apprenant');
const Planification = require('../models/Planification')

const generateUniqueMatricule = async () => {
    try {
        // Compter le nombre d'apprenants existants
        const apprenantCount = await Apprenant.countDocuments();
        
        // Générer un numéro séquentiel sur 5 chiffres (commence à 1)
        const sequence = String(apprenantCount + 1).padStart(5, '0');
        
        // Format: AKILI-E + numéro séquentiel
        const matricule = `AKILI-E${sequence}`;
        
        // Vérifier l'unicité (au cas où il y aurait eu des suppressions)
        const existingApprenant = await Apprenant.findOne({ matricule });
        if (existingApprenant) {
            // Si le matricule existe, essayer avec le prochain numéro
            return await generateUniqueMatriculeRecursive(apprenantCount + 2);
        }
        
        return matricule;
    } catch (error) {
        throw new Error(`Erreur lors de la génération du matricule: ${error.message}`);
    }
};

// Fonction récursive pour gérer les cas où un matricule existe déjà
const generateUniqueMatriculeRecursive = async (startNumber) => {
    const sequence = String(startNumber).padStart(5, '0');
    const matricule = `AKILI-E${sequence}`;
    
    const existingApprenant = await Apprenant.findOne({ matricule });
    if (existingApprenant) {
        // Si le matricule existe encore, essayer le suivant
        return await generateUniqueMatriculeRecursive(startNumber + 1);
    }
    
    return matricule;
};

const generatePin = async () => {
    let unique = false;
    let pin = '';
    while (!unique) {
        pin = require('crypto').randomBytes(4).toString('hex').toUpperCase();
        const existingParticipant = await Planification.findOne({ pin });
        if (!existingParticipant) {
            unique = true;
        }
    }
    return pin;
};

module.exports = { generateUniqueMatricule, generatePin };