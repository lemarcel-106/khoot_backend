const Planification = require('../models/Planification');
const Participation = require('../models/Participant')
const Jeu = require('../models/Jeu');
const { generatePin } = require('../utils/generateUniqueMatricule')

const planificationService = {

    // ✅ MÉTHODE MISE À JOUR : Création avec statut par défaut et validation
    createPlanification: async (planificationData) => {
        try {
            // ✅ Vérifier que le jeu existe avant de créer
            const jeuExistant = await Jeu.findById(planificationData.jeu);
            if (!jeuExistant) {
                throw new Error('Le jeu spécifié n\'existe pas');
            }

            // Génération du pin pour la planification
            const pin = await generatePin();
            
            // ✅ Ajouter le statut par défaut selon vos spécifications
            const datas = { 
                pin, 
                statut: 'en-attente', // ✅ Statut par défaut
                ...planificationData 
            };

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

    // ✅ MÉTHODE EXISTANTE GARDÉE
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

    // ✅ MÉTHODE EXISTANTE GARDÉE
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

    // ✅ MÉTHODE MISE À JOUR : Validation et nettoyage avec statistiques
    async validateAndCleanPlanifications(planifications) {
        try {
            if (!planifications || !Array.isArray(planifications)) {
                return [];
            }

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

                // ✅ AJOUTER des informations calculées
                const nombreParticipants = planification.participants.length;
                const placesRestantes = (planification.limite_participant || 0) - nombreParticipants;

                const planificationAvecStats = {
                    ...planification.toObject ? planification.toObject() : planification,
                    nombreParticipants,
                    placesRestantes: Math.max(0, placesRestantes),
                    tauxRemplissage: planification.limite_participant > 0 
                        ? Math.round((nombreParticipants / planification.limite_participant) * 100)
                        : 0,
                    peutAccepterParticipants: planification.statut !== 'terminé' && placesRestantes > 0
                };

                cleanedPlanifications.push(planificationAvecStats);
            }
            
            return cleanedPlanifications;
        } catch (error) {
            console.error('Erreur lors de la validation des planifications:', error);
            return planifications || [];
        }
    },

    // ✅ MÉTHODE EXISTANTE GARDÉE
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
    
    // ✅ MÉTHODE EXISTANTE GARDÉE
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

    // ✅ NOUVELLE MÉTHODE : Terminer une planification
    terminerPlanification: async (id) => {
        try {
            // Vérifier que la planification existe
            const planification = await Planification.findById(id);
            if (!planification) {
                throw new Error('Planification non trouvée');
            }

            // Vérifier que la planification n'est pas déjà terminée
            if (planification.statut === 'terminé') {
                throw new Error('Cette planification est déjà terminée');
            }

            // Mettre à jour le statut
            planification.statut = 'terminé';
            await planification.save();

            return planification;
        } catch (error) {
            throw error;
        }
    },

    // ✅ NOUVELLE MÉTHODE : Ajouter un participant avec gestion automatique du statut
    addParticipantAvecStatut: async (planificationId, participantId) => {
        try {
            // Récupérer la planification
            const planification = await Planification.findById(planificationId);
            if (!planification) {
                throw new Error('Planification non trouvée');
            }

            // Vérifier que la planification n'est pas terminée
            if (planification.statut === 'terminé') {
                throw new Error('Impossible d\'ajouter un participant à une planification terminée');
            }

            // Vérifier la limite de participants
            if (planification.participants.length >= planification.limite_participant) {
                throw new Error('Limite de participants atteinte pour cette planification');
            }

            // Vérifier que le participant existe
            const participant = await Participation.findById(participantId);
            if (!participant) {
                throw new Error('Participant non trouvé');
            }

            // Vérifier que le participant n'est pas déjà ajouté
            if (planification.participants.includes(participant._id)) {
                throw new Error('Le participant est déjà ajouté à cette planification');
            }

            // Capturer l'ancien statut
            const ancienStatut = planification.statut;

            // Ajouter le participant
            planification.participants.push(participant._id);

            // ✅ LOGIQUE AUTOMATIQUE : Passer à "en-cours" si c'est le premier participant
            if (planification.participants.length === 1 && planification.statut === 'en-attente') {
                planification.statut = 'en-cours';
            }

            await planification.save();

            return {
                planification: planification,
                changementStatut: ancienStatut !== planification.statut,
                ancienStatut: ancienStatut,
                nouveauStatut: planification.statut,
                nombreParticipants: planification.participants.length,
                limiteParticipants: planification.limite_participant
            };
        } catch (error) {
            throw error;
        }
    },

    // ✅ MÉTHODE MISE À JOUR : Utilise la nouvelle logique de statut
    async addParticipant(planificationId, participantId) {
        try {
            // Utiliser la nouvelle méthode avec gestion du statut
            return await planificationService.addParticipantAvecStatut(planificationId, participantId);
        } catch (error) {
            throw error;
        }
    },

    // ✅ NOUVELLE MÉTHODE : Obtenir une planification par PIN avec validation améliorée
    getPlanificationByPinSecure: async (pin) => {
        try {
            if (!pin || typeof pin !== 'string') {
                throw new Error('PIN invalide');
            }

            const planification = await Planification.findOne({ pin: pin.trim() })
                .populate({
                    path: 'jeu',
                    populate: [
                        {
                            path: 'questions',
                            populate: [
                                { path: 'reponses' },
                                { path: 'typeQuestion' },
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
                            path: 'apprenant',
                            select: 'nom prenom avatar matricule email'
                        },
                        {
                            path: 'reponses',
                            populate: {
                                path: 'question',
                                populate: [
                                    { path: 'reponses' },
                                    { path: 'typeQuestion' },
                                    { path: 'point' }
                                ]
                            }
                        }
                    ]
                })
                .exec();

            if (!planification) {
                return null;
            }

            // Ajouter des informations calculées
            const nombreParticipants = planification.participants.length;
            const placesRestantes = planification.limite_participant - nombreParticipants;

            return {
                ...planification.toObject(),
                nombreParticipants,
                placesRestantes: Math.max(0, placesRestantes),
                peutRejoindre: planification.statut !== 'terminé' && placesRestantes > 0,
                tauxRemplissage: planification.limite_participant > 0 
                    ? Math.round((nombreParticipants / planification.limite_participant) * 100)
                    : 0
            };
        } catch (error) {
            throw error;
        }
    },

    // ✅ NOUVELLE MÉTHODE : Obtenir les statistiques rapides d'une planification
    getStatistiquesRapides: async (planificationId) => {
        try {
            const planification = await Planification.findById(planificationId)
                .populate('participants', 'score')
                .populate('jeu', 'titre');

            if (!planification) {
                throw new Error('Planification non trouvée');
            }

            const participants = planification.participants || [];
            const nombreParticipants = participants.length;
            
            let scoreMoyen = 0;
            if (nombreParticipants > 0) {
                const totalScore = participants.reduce((sum, p) => sum + (p.score || 0), 0);
                scoreMoyen = Math.round(totalScore / nombreParticipants);
            }

            const tauxParticipation = planification.limite_participant > 0 
                ? Math.round((nombreParticipants / planification.limite_participant) * 100)
                : 100;

            return {
                planificationId: planification._id,
                pin: planification.pin,
                jeuTitre: planification.jeu?.titre,
                statut: planification.statut,
                nombreParticipants,
                limiteParticipants: planification.limite_participant,
                tauxParticipation,
                scoreMoyen,
                estTermine: planification.statut === 'terminé',
                peutAccepterParticipants: planification.statut !== 'terminé' && nombreParticipants < planification.limite_participant
            };
        } catch (error) {
            throw error;
        }
    },

    // ✅ MÉTHODE EXISTANTE GARDÉE
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

    // ✅ MÉTHODE EXISTANTE GARDÉE
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
    },

    // ✅ NOUVELLE MÉTHODE : Récupérer toutes les planifications selon les permissions
    getAllPlanifications: async (currentUser) => {
        try {
            let query = {};
            let populateOptions = {
                path: 'jeu',
                populate: [
                    { path: 'createdBy', select: 'nom prenom email role' },
                    { path: 'ecole', select: 'libelle ville' }
                ]
            };

            // ✅ GESTION DES PERMISSIONS SELON LE RÔLE
            if (currentUser.role === 'enseignant') {
                // Enseignant : seulement ses propres planifications
                const jeusDeLEnseignant = await Jeu.find({ createdBy: currentUser.id }).select('_id');
                const jeuIds = jeusDeLEnseignant.map(jeu => jeu._id);
                query.jeu = { $in: jeuIds };
                
            } else if (currentUser.role === 'admin') {
                // Admin : planifications de son école
                const jeusDeLEcole = await Jeu.find({ ecole: currentUser.ecole }).select('_id');
                const jeuIds = jeusDeLEcole.map(jeu => jeu._id);
                query.jeu = { $in: jeuIds };
                
            } else if (currentUser.role === 'super_admin') {
                // Super admin : toutes les planifications
                // Pas de filtre supplémentaire
            } else {
                throw new Error('Rôle utilisateur non autorisé');
            }

            // Récupérer les planifications
            const planifications = await Planification.find(query)
                .populate(populateOptions)
                .populate({
                    path: 'participants',
                    populate: {
                        path: 'apprenant',
                        select: 'nom prenom matricule avatar'
                    }
                })
                .sort({ date: -1 }) // Plus récentes en premier
                .exec();

            // Nettoyer et enrichir les données
            const planificationsNettoyees = await planificationService.validateAndCleanPlanifications(planifications);

            // Calculer les statistiques globales
            const statistiques = {
                total: planificationsNettoyees.length,
                enAttente: planificationsNettoyees.filter(p => p.statut === 'en-attente').length,
                enCours: planificationsNettoyees.filter(p => p.statut === 'en-cours').length,
                terminees: planificationsNettoyees.filter(p => p.statut === 'terminé').length,
                typeExamen: planificationsNettoyees.filter(p => p.type === 'Examen').length,
                typeLive: planificationsNettoyees.filter(p => p.type === 'Live').length,
                totalParticipants: planificationsNettoyees.reduce((total, p) => total + (p.nombreParticipants || 0), 0),
                jeuxUniques: [...new Set(planificationsNettoyees.map(p => p.jeu?._id))].length
            };

            return {
                planifications: planificationsNettoyees,
                statistiques,
                permissions: {
                    role: currentUser.role,
                    peutCreer: ['enseignant', 'admin', 'super_admin'].includes(currentUser.role),
                    peutModifierToutes: currentUser.role === 'super_admin',
                    peutVoirToutes: currentUser.role === 'super_admin'
                }
            };

        } catch (error) {
            throw new Error('Erreur lors de la récupération des planifications : ' + error.message);
        }
    }

};

module.exports = planificationService;