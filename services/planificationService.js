const Planification = require('../models/Planification');
const Participation = require('../models/Participant')
const Jeu = require('../models/Jeu');
const { generatePin } = require('../utils/generateUniqueMatricule')

const planificationService = {

    createPlanification: async (planificationData) => {
        try {
            // Génération du pin pour la planification
            const pin = await generatePin();
            const datas = { pin, ...planificationData };

            // Création de la planification
            const newPlanification = new Planification(datas);
            const savedPlanification = await newPlanification.save();

            // Ajout de la planification au jeu
            await planificationService.addPlanificationToJeu(savedPlanification._id, datas.jeu);

            return savedPlanification;
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de la planification : ' + error.message);
            }
        }
    },

    addPlanificationToJeu: async (planificationId, jeuId) => {
        // Récupérer le jeu par ID
        const jeu = await Jeu.findById(jeuId);
        if (!jeu) {
            throw new Error('Jeu non trouvé');
        }

        // Vérifie si la planification est déjà dans le jeu
        if (jeu.planification.includes(planificationId)) {
            throw new Error('La planification est déjà ajoutée au jeu');
        }

        // Ajouter l'ID de la planification au tableau `planifications` du jeu
        jeu.planification.push(planificationId);
        await jeu.save();

        return jeu;
    },

// Dans services/planificationService.js
// Remplacer la méthode getPlanificationsByJeu existante

    async getPlanificationsByJeu(jeuId) {
        try {
            return await Planification.find({ jeu: jeuId })
                .populate({
                    path: 'jeu', // ✅ DÉCOMMENTER cette ligne !
                    populate: [
                        {
                            path: 'questions',
                            populate: [
                                { path: 'reponses' },
                                { path: 'typeQuestion' }, // ✅ AJOUTER typeQuestion
                                { path: 'point' }
                            ]
                        },
                        { path: 'createdBy', select: 'nom prenom email' },
                        { path: 'ecole', select: 'libelle ville' }
                    ]
                })
                .populate({
                    path: 'participants',
                    populate: [
                        {
                            path: 'apprenant', // ✅ Améliorer le populate apprenant
                            select: 'nom prenom avatar matricule email'
                        },
                        {
                            path: 'reponses',
                            populate: {
                                path: 'question',
                                populate: [
                                    { path: 'reponses' },
                                    { path: 'typeQuestion' }, // ✅ AJOUTER ici aussi
                                    { path: 'point' }
                                ]
                            }
                        }
                    ]
                })
                .exec();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des planifications : ' + error.message);
        }
    },

    // ✅ NOUVELLE MÉTHODE : Validation et nettoyage des données
    async validateAndCleanPlanifications(planifications) {
        const cleanedPlanifications = [];
        
        for (const planification of planifications) {
            // Vérifier si le jeu existe
            if (!planification.jeu) {
                console.warn(`⚠️ Planification ${planification._id} : Jeu manquant (référence cassée)`);
                continue; // Ignorer cette planification
            }
            
            // Nettoyer les participants avec apprenants manquants
            const validParticipants = [];
            for (const participant of planification.participants || []) {
                if (!participant.apprenant) {
                    console.warn(`⚠️ Participant ${participant._id} : Apprenant manquant (référence cassée)`);
                    // On peut soit ignorer le participant, soit le garder avec apprenant = null
                    // Ici, on va le garder mais indiquer le problème
                    participant.apprenant = {
                        _id: null,
                        nom: "APPRENANT_SUPPRIME",
                        prenom: "REFERENCE_CASSEE",
                        avatar: null,
                        matricule: "N/A"
                    };
                }
                validParticipants.push(participant);
            }
            
            planification.participants = validParticipants;
            cleanedPlanifications.push(planification);
        }
        
        return cleanedPlanifications;
    },

    async getPlanificationById(id) {
        try {
            return await Planification.findById(id) // Utilisation de l'objet pour chercher par 'pin'
                .populate({
                    path: 'jeu',
                    populate: [
                        {
                            path: 'questions',
                            populate: [
                                {
                                    path: 'reponses', // Populate des réponses de chaque question
                                },

                                {
                                    path: 'typeQuestion', // Populate des réponses de chaque question
                                },

                                {
                                    path: 'point', // Populate du champ point pour chaque question
                                }
                            ]
                        }
                    ]
                })
                .populate({
                    path: 'participants',
                    populate: [
                        {
                            path: 'apprenant', // Populate de l'apprenant associé au participant
                        },
                        {
                            path: 'reponses', // Populate des réponses dans chaque participant
                            populate: {
                                path: 'question',
                                populate: [
                                    {
                                        path: 'reponses' // Populate des réponses associées aux questions
                                    },

                                    {
                                        path: 'typeQuestion', // Populate des réponses de chaque question
                                    },
                                    {
                                        path: 'point'
                                    }

                                ]
                            }
                        }
                    ]
                })
                .exec();

        } catch (error) {
            throw new Error('Erreur lors de la récupération de la planification : ' + error.message);
        }
    },
    
    async getPlanificationByPin(pin) {
        try {
            return await Planification.findOne(pin) // Utilisation de l'objet pour chercher par 'pin'
    .populate({
        path: 'jeu',
        populate: [
            {
                path: 'questions',
                populate: [
                    
                    {
                    path: 'reponses', // Populate des réponses de chaque question
                },
                
                {
                    path: 'typeQuestion', // Populate des réponses de chaque question
                },
                
                {
                        path: 'point', // Populate du champ point pour chaque question
                    }
                
                ]
            }
        ]
    })
    .populate({
        path: 'participants',
        populate: [
            {
                path: 'apprenant', // Populate de l'apprenant associé au participant
            },
            {
                path: 'reponses', // Populate des réponses dans chaque participant
                populate: {
                    path: 'question',
                    populate: [
                        {
                            path: 'reponses' // Populate des réponses associées aux questions
                        },
                        
                {
                    path: 'typeQuestion', // Populate des réponses de chaque question
                },
                        {
                            path: 'point'
                        }
                        
                    ]
                }
            }
        ]
    })
    .exec();

        } catch (error) {
            throw new Error('Erreur lors de la récupération de la planification : ' + error.message);
        }
    },

    async addParticipant(planificationId, participantId) {
        const planification = await Planification.findById(planificationId);
        if (!planification) {
            throw new Error('Planification non trouvé');
        }
        const participation = await Participation.findById(participantId);

        if (!participation) {
            throw new Error('Participant non trouvé');
        }

        if (planification.participants.includes(participation._id)) {
            throw new Error('Le participant est déjà ajouté au jeu');
        }

        planification.participants.push(participation._id);
        await planification.save();
        return planification;
    },

    updatePlanification: async (planificationId, planificationData) => {
        try {
            const updatedPlanification = await Planification.findByIdAndUpdate(
                planificationId,
                { $set: planificationData },
                { new: true, runValidators: true }
            );
            if (!updatedPlanification) {
                throw new Error("Planification non trouvée");
            }
            return updatedPlanification;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de la planification : " + error.message);
        }
    },

    deletePlanificationById: async (planificationId) => {
        try {
            const deletedPlanification = await Planification.findByIdAndDelete(planificationId);
            if (!deletedPlanification) {
                throw new Error("Planification non trouvée");
            }
            return deletedPlanification;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de la planification : " + error.message);
        }
    }

};

module.exports = planificationService;
