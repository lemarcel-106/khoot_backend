const Apprenant = require('../models/Apprenant');
const Planification = require('../models/Planification')

const generateUniqueMatricule = async () => {
    let unique = false;
    let matricule = '';
    while (!unique) {
        matricule = 'AKILI-' + require('crypto').randomBytes(4).toString('hex').toUpperCase();
        const existingParticipant = await Apprenant.findOne({ matricule });
        if (!existingParticipant) {
            unique = true;
        }
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
