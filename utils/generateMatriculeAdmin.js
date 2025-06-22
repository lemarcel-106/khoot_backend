const Ecole = require('../models/Ecole');
const Admin = require('../models/Admin');

async function generateMatricule(ecoleId) {
    try {
        // Récupérer l'école
        const ecole = await Ecole.findById(ecoleId);
        if (!ecole) throw new Error("École non trouvée");

        console.log(ecole)
        // Prendre les 3 premières lettres de l'école en majuscules
        const ecolePrefix = ecole.libelle.substring(0, 3).toUpperCase();
        
        // Compter le nombre d'admins existants pour cette école
        const adminCount = await Admin.countDocuments({ ecole: ecoleId });
        
        // Générer un numéro séquentiel sur 4 chiffres
        const sequence = String(adminCount + 1).padStart(4, '0');
        
        // Générer l'année courante sur 2 chiffres
        const year = new Date().getFullYear().toString().substr(-2);
        
        // Combiner le tout : ECO-0001-23
        const matricule = `${ecolePrefix}-${sequence}-${year}`;
        
        return matricule;
    } catch (error) {
        throw new Error(`Erreur lors de la génération du matricule: ${error.message}`);
    }
}

module.exports = generateMatricule;