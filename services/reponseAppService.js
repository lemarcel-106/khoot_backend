
// services/reponseAppService.js - VERSION CORRIGÉE
const ReponseApp = require('../models/ReponseApp');
const Participant = require('../models/Participant');

const reponseAppService = {

    // ✅ NOUVELLE MÉTHODE: Valider les données de réponse apprenant
    validateReponseAppData: (data) => {
        const errors = [];
        
        // Validation de l'état (accepte 0, 1, true, false)
        if (data.etat !== undefined) {
            const validValues = [0, 1, true, false, '0', '1', 'true', 'false'];
            if (!validValues.includes(data.etat)) {
                errors.push('L\'état doit être 0, 1, true ou false');
            }
        }
        
        // Validation du temps de réponse
        if (data.temps_reponse !== undefined && data.temps_reponse < 0) {
            errors.push('Le temps de réponse doit être positif');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // ✅ CORRIGÉ: Récupérer toutes les réponses apprenants avec détails complets
    getAllReponseApp: async () => {
        try {
            return await ReponseApp.find()
                .populate({
                    path: 'apprenant',
                    select: 'nom prenom avatar matricule ecole',
                    populate: {
                        path: 'ecole',
                        select: 'libelle ville'
                    }
                })
                .populate({
                    path: 'question',
                    select: 'libelle typeQuestion point jeu temps limite_response',
                    populate: [
                        {
                            path: 'typeQuestion',
                            select: 'libelle description reference'
                        },
                        {
                            path: 'point',
                            select: 'nature valeur description'
                        },
                        {
                            path: 'jeu',
                            select: 'titre createdBy ecole',
                            populate: [
                                {
                                    path: 'createdBy',
                                    select: 'nom prenom email'
                                },
                                {
                                    path: 'ecole',
                                    select: 'libelle ville'
                                }
                            ]
                        }
                    ]
                })
                .populate({
                    path: 'participant',
                    select: 'score date apprenant planification',
                    populate: [
                        {
                            path: 'apprenant',
                            select: 'nom prenom matricule'
                        },
                        {
                            path: 'planification',
                            select: 'pin statut type'
                        }
                    ]
                })
                .sort({ date: -1 })
                .lean();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des réponses apprenants : ' + error.message);
        }
    },

    // ✅ CORRIGÉ: Récupérer les réponses d'un participant avec tous les détails
    getReponsesByParticipant: async (participantId) => {
        try {
            return await ReponseApp.find({ participant: participantId })
                .populate({
                    path: 'question',
                    populate: [
                        { 
                            path: 'typeQuestion',
                            select: 'libelle description reference'
                        },
                        { 
                            path: 'point',
                            select: 'nature valeur description'
                        },
                        { 
                            path: 'reponses',
                            select: 'reponse_texte etat file'
                        }
                    ]
                })
                .populate({
                    path: 'apprenant', 
                    select: 'nom prenom avatar matricule ecole',
                    populate: {
                        path: 'ecole',
                        select: 'libelle ville'
                    }
                })
                .populate({
                    path: 'participant',
                    select: 'score date',
                    populate: {
                        path: 'planification',
                        select: 'pin statut type date_debut date_fin'
                    }
                })
                .sort({ date: -1 })
                .lean();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des réponses du participant : ' + error.message);
        }
    },

    // ✅ CORRIGÉ: Créer une réponse apprenant avec validation
    createReponseApp: async (userData) => {
        try {
            // Validation des données
            const validation = reponseAppService.validateReponseAppData(userData);
            if (!validation.isValid) {
                throw new Error('Données invalides: ' + validation.errors.join(', '));
            }

            // Créer une nouvelle réponse dans ReponseApp
            const newReponseApp = new ReponseApp(userData);
            const savedReponseApp = await newReponseApp.save();

            // Récupérer le participant concerné par la réponse
            const participant = await Participant.findById(userData.participant);
            if (!participant) {
                throw new Error('Participant non trouvé');
            }

            // Ajouter l'ID de la réponse dans le tableau `reponses` du participant
            participant.reponses.push(savedReponseApp._id);
            await participant.save();

            // Retourner la réponse avec tous les détails
            return await ReponseApp.findById(savedReponseApp._id)
                .populate({
                    path: 'apprenant',
                    select: 'nom prenom avatar matricule'
                })
                .populate({
                    path: 'question',
                    select: 'libelle typeQuestion point',
                    populate: [
                        {
                            path: 'typeQuestion',
                            select: 'libelle description reference'
                        },
                        {
                            path: 'point',
                            select: 'nature valeur description'
                        }
                    ]
                })
                .populate({
                    path: 'participant',
                    select: 'score date'
                })
                .lean();

        } catch (error) {
            throw new Error('Erreur lors de la création de la réponse : ' + error.message);
        }
    },

    // ✅ CORRIGÉ: Statistiques avec gestion numérique des états
    getStatistiquesReponseApp: async () => {
        try {
            const totalReponses = await ReponseApp.countDocuments();
            const reponsesCorrectes = await ReponseApp.countDocuments({ etat: 1 });
            const reponsesIncorrectes = await ReponseApp.countDocuments({ etat: 0 });
            
            // Calculer le temps de réponse moyen
            const tempsStats = await ReponseApp.aggregate([
                {
                    $group: {
                        _id: null,
                        tempsReponseMoyen: { $avg: '$temps_reponse' },
                        tempsReponseMin: { $min: '$temps_reponse' },
                        tempsReponseMax: { $max: '$temps_reponse' }
                    }
                }
            ]);
    
            return {
                totalReponses,
                reponsesCorrectes,
                reponsesIncorrectes,
                pourcentageCorrectes: totalReponses > 0 ? 
                    Math.round((reponsesCorrectes / totalReponses) * 100) : 0,
                tempsReponseMoyen: tempsStats[0]?.tempsReponseMoyen || 0,
                tempsReponseMin: tempsStats[0]?.tempsReponseMin || 0,
                tempsReponseMax: tempsStats[0]?.tempsReponseMax || 0
            };
        } catch (error) {
            throw new Error('Erreur lors du calcul des statistiques : ' + error.message);
        }
    },

    // Autres méthodes existantes...
    getAllReponseAppById: async (id) => {
        try {
            return await ReponseApp.findOne({ question: id })
                .populate({
                    path: 'apprenant',
                    select: 'nom prenom avatar matricule'
                })
                .populate({
                    path: 'question',
                    select: 'libelle typeQuestion point',
                    populate: [
                        {
                            path: 'typeQuestion',
                            select: 'libelle description reference'
                        },
                        {
                            path: 'point',
                            select: 'nature valeur description'
                        }
                    ]
                })
                .lean();
        } catch (error) {
            throw new Error('Erreur lors de la récupération de la réponse apprenant : ' + error.message);
        }
    },

    updateReponseApp: async (reponseAppId, reponseAppData) => {
        try {
            // Validation des nouvelles données
            if (Object.keys(reponseAppData).length > 0) {
                const validation = reponseAppService.validateReponseAppData(reponseAppData);
                if (!validation.isValid) {
                    throw new Error('Données invalides: ' + validation.errors.join(', '));
                }
            }

            const updatedReponseApp = await ReponseApp.findByIdAndUpdate(
                reponseAppId,
                { $set: reponseAppData },
                { new: true, runValidators: true }
            )
            .populate({
                path: 'apprenant',
                select: 'nom prenom avatar matricule'
            })
            .populate({
                path: 'question',
                select: 'libelle typeQuestion point',
                populate: [
                    {
                        path: 'typeQuestion',
                        select: 'libelle description reference'
                    },
                    {
                        path: 'point',
                        select: 'nature valeur description'
                    }
                ]
            });
            
            if (!updatedReponseApp) {
                throw new Error("RéponseApp non trouvée");
            }
            return updatedReponseApp;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de la réponseApp : " + error.message);
        }
    },

    deleteReponseAppById: async (reponseAppId) => {
        try {
            const deletedReponseApp = await ReponseApp.findByIdAndDelete(reponseAppId);
            if (!deletedReponseApp) {
                throw new Error("RéponseApp non trouvée");
            }
            return deletedReponseApp;
        } catch (error) {
            throw new Error("Erreur lors de la suppression de la réponseApp : " + error.message);
        }
    },

    insertMany: async (dataArray) => {
        try {
            // Valider chaque réponse avant insertion
            for (const data of dataArray) {
                const validation = reponseAppService.validateReponseAppData(data);
                if (!validation.isValid) {
                    throw new Error(`Réponse apprenant invalide: ${validation.errors.join(', ')}`);
                }
            }
            
            return await ReponseApp.insertMany(dataArray);
        } catch (error) {
            throw new Error("Erreur lors de l'insertion multiple : " + error.message);
        }
    }
};

module.exports = reponseAppService;