const Ecole = require('../models/Ecole');
const Admin = require('../models/Admin');

async function generateMatricule(ecoleId) {
    try {
        // Vérifier que l'école existe (optionnel, pour validation)
        if (ecoleId) {
            const ecole = await Ecole.findById(ecoleId);
            if (!ecole) throw new Error("École non trouvée");
            console.log('École trouvée:', ecole.libelle);
        }
        
        // Compter le nombre total d'admins existants (tous confondus)
        const adminCount = await Admin.countDocuments({});
        
        // Générer un numéro séquentiel sur 5 chiffres avec le préfixe P
        const sequence = String(adminCount + 1).padStart(5, '0');
        
        // Format final : AKILI-P00001
        const matricule = `AKILI-P${sequence}`;
        
        // Vérifier l'unicité du matricule généré
        const existingAdmin = await Admin.findOne({ matricule });
        if (existingAdmin) {
            // Si le matricule existe déjà, utiliser un compteur plus élevé
            const maxMatricule = await Admin.findOne({}, { matricule: 1 })
                .sort({ matricule: -1 })
                .lean();
            
            let nextNumber = 1;
            if (maxMatricule && maxMatricule.matricule) {
                // Extraire le numéro du dernier matricule
                const match = maxMatricule.matricule.match(/AKILI-P(\d+)/);
                if (match) {
                    nextNumber = parseInt(match[1]) + 1;
                }
            }
            
            const newSequence = String(nextNumber).padStart(5, '0');
            return `AKILI-P${newSequence}`;
        }
        
        console.log('Matricule généré:', matricule);
        return matricule;
    } catch (error) {
        throw new Error(`Erreur lors de la génération du matricule: ${error.message}`);
    }
}

// Fonction alternative pour générer un matricule unique avec retry
async function generateUniqueMatricule(ecoleId, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const matricule = await generateMatricule(ecoleId);
            
            // Vérifier une dernière fois l'unicité
            const exists = await Admin.findOne({ matricule });
            if (!exists) {
                return matricule;
            }
            
            console.log(`Tentative ${attempt}: Matricule ${matricule} déjà existant, nouvelle tentative...`);
            
            // Pour les tentatives suivantes, forcer un nouveau numéro
            if (attempt > 1) {
                const maxMatricule = await Admin.findOne({}, { matricule: 1 })
                    .sort({ matricule: -1 })
                    .lean();
                
                let nextNumber = attempt;
                if (maxMatricule && maxMatricule.matricule) {
                    const match = maxMatricule.matricule.match(/AKILI-P(\d+)/);
                    if (match) {
                        nextNumber = parseInt(match[1]) + attempt;
                    }
                }
                
                const newSequence = String(nextNumber).padStart(5, '0');
                const newMatricule = `AKILI-P${newSequence}`;
                
                const stillExists = await Admin.findOne({ matricule: newMatricule });
                if (!stillExists) {
                    return newMatricule;
                }
            }
            
        } catch (error) {
            if (attempt === maxRetries) {
                throw error;
            }
            console.log(`Tentative ${attempt} échouée:`, error.message);
        }
    }
    
    throw new Error(`Impossible de générer un matricule unique après ${maxRetries} tentatives`);
}

module.exports = generateUniqueMatricule;