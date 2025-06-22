const Participation = require('../models/Participant');
const Planification = require('../models/Planification');

const ParticipationService = {

    createParticipation: async (participationData) => {
        try {
            const { apprenant, planification } = participationData;

            // Création de la participation
            const newParticipation = new Participation(participationData);
            //ajout dun avatar par défaut si l'apprenant n'en a pas
            if (!newParticipation.apprenant.avatar) {
                newParticipation.apprenant.avatar = 'https://static.vecteezy.com/system/resources/previews/023/246/275/non_2x/university-avatar-icon-illustration-vector.jpg';
            }
            const savedParticipation = await newParticipation.save();

            // Ajout de l'apprenant à la planification
            await ParticipationService.addApprenantToPlanification(savedParticipation._id, planification);

            return savedParticipation;
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création du participant : ' + error.message);
            }
        }
    },

    addApprenantToPlanification: async (apprenantId, planificationId) => {
        // Récupérer la planification par ID
        const planification = await Planification.findById(planificationId);
        if (!planification) {
            throw new Error('Planification non trouvée');
        }
    
        // Vérifie si l'apprenant est déjà dans la planification
        if (planification.participants.includes(apprenantId)) {
            throw new Error("L'apprenant est déjà ajouté à la planification");
        }
    
        // Vérifie si la limite de participants est atteinte
        if (planification.participants.length >= planification.limite_participant) {
            throw new Error('La limite de participants pour cette planification est atteinte');
        }
    
        // Vérifie le type de la planification
        if (planification.type === 'attribuer') {
            const now = new Date();
            
            console.log(planification.date_debut, planification.heure_debut);
            
            // Convertir les dates et heures personnalisées au format ISO
            const dateDebutString = `${planification.date_debut.replace(/\//g, '-')}T${planification.heure_debut.replace('h', ':')}:00.000Z`;
            const dateFinString = `${planification.date_fin.replace(/\//g, '-')}T${planification.heure_fin.replace('h', ':')}:00.000Z`;
    
            const dateDebut = new Date(dateDebutString);
            const dateFin = new Date(dateFinString);
    
            console.log(`Date actuelle : ${now}`);
            console.log(`Date de début : ${dateDebut}`);
            console.log(`Date de fin : ${dateFin}`);
    
            // Vérifier si les dates sont valides
            if (isNaN(dateDebut.getTime())) {
                throw new Error("La date de début est invalide.");
            }
            if (isNaN(dateFin.getTime())) {
                throw new Error("La date de fin est invalide.");
            }
    
            // Vérifier si la date actuelle est avant la date de début ou après la date de fin
            if (now < dateDebut) {
                throw new Error("La planification n'a pas encore débuté. Veuillez revenir plus tard.");
            } else if (now > dateFin) {
                throw new Error("La date de la planification est dépassée.");
            }
        }
    
        // Ajouter l'ID de l'apprenant au tableau `participants` de la planification
        planification.participants.push(apprenantId);
        await planification.save();
    
        return planification;
    },
    
    
    


    async getAllParticipations() {
        try {
            return await Participation.find().populate('apprenant');
        } catch (error) {
            throw new Error('Erreur lors de la récupération des participations : ' + error.message);
        }
    },

    async getParticipationById(participationId) {
        try {
            return await Participation.findById(participationId).populate('apprenant').populate(
                {
                    path:'reponses',
                    populate: {
                        path: 'question'
                    }
                });
        } catch (error) {
            throw new Error('Erreur lors de la récupération de la participation ah ah : ' + error.message);
        }
    },

    async getParticipationsByApprenant(apprenantId) {
        try {
            return await Participation.find({ apprenant: apprenantId }).populate('apprenant').populate('planification');
        } catch (error) {
            throw new Error('Erreur lors de la récupération des participations par apprenant : ' + error.message);
        }
    },

    async updateParticipant(participantId, participantData) {
        try {
            console.log(participantData, participantId)
            const updatedParticipant = await Participation.findByIdAndUpdate(
                participantId,
                { $set: participantData },
                { new: true, runValidators: true }
            );
            if (!updatedParticipant) {
                throw new Error("Participant non trouvé");
            }
            return updatedParticipant;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour du participant : " + error.message);
        }
    },

    async deleteParticipantById(participantId) {
        try {
            const deletedParticipant = await Participation.findByIdAndDelete(participantId);
            if (!deletedParticipant) {
                throw new Error("Participant non trouvé");
            }
            return deletedParticipant;
        } catch (error) {
            throw new Error("Erreur lors de la suppression du participant : " + error.message);
        }
    },

    async getParticipantsByPlanification(planificationId) {
        try {
            return await Participation.find({ planification: planificationId })
                .populate('apprenant', 'nom')
                .exec();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des participants : ' + error.message);
        }
    }
};


module.exports = ParticipationService;

