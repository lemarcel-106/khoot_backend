const Jeu = require('../models/Jeu');
const tokenUtils = require('../utils/token');
const userService = require('./userService')
const Participant = require('../models/Participant');
const logger = require('../logger');

const jeuService = {

    /**
     * Récupère tous les jeux avec détails de base seulement (titre, image, date, créateur)
     * Utilisé pour afficher une liste rapide des jeux
     */
   /**
     * Récupère tous les jeux avec détails de base seulement (titre, image, date, créateur)
     * MODIFIÉ: Les enseignants ne voient que leurs propres jeux
     */

    getAllJeuxSimple: async (adminData = null) => {
        try {
            let query = Jeu.find();
            logger.info('Récupération simple des jeux pour:', adminData);

            // ✅ CORRECTION: Gestion des permissions selon le rôle
            if (adminData) {
                if (adminData.role === 'enseignant') {
                    // ✅ RESTRICTION: Les enseignants ne voient que leurs propres jeux
                    query = query.where('createdBy').equals(adminData.id);
                    logger.info('Enseignant: filtrage par créateur ID:', adminData.id);
                } else if (adminData.role === 'admin') {
                    // Les admins voient les jeux de leur école
                    if (adminData.ecole) {
                        query = query.where('ecole').equals(adminData.ecole.toString());
                        logger.info('Admin: filtrage par école:', adminData.ecole);
                    } else {
                        throw new Error("L'administrateur ne possède pas d'école liée.");
                    }
                }
                // Les super_admin voient tous les jeux (pas de restriction)
            }
            
            // Populate complet du createdBy
            return await query
                .select('titre image date createdBy ecole')
                .populate({
                    path: 'createdBy',
                    select: 'nom prenom email role matricule phone genre statut adresse',
                    populate: {
                        path: 'pays',
                        select: 'libelle'
                    }
                })
                .populate('ecole', 'libelle ville telephone')
                .sort({ date: -1 }) // Tri par date décroissante
                .exec();
                
        } catch (error) {
            logger.error('Erreur lors de la récupération simple des jeux:', error);
            throw new Error('Erreur lors de la récupération des jeux : ' + error.message);
        }
    },
/**
 * Récupère tous les jeux avec tous les détails (questions, planifications, participants, etc.)
 * MODIFIÉ: Les enseignants ne voient que leurs propres jeux
 */


    getAllJeuxDetailles: async (adminData = null) => {
        try {
            let query = Jeu.find();
            logger.info('Récupération détaillée des jeux pour:', adminData);

            // ✅ CORRECTION: Gestion des permissions selon le rôle
            if (adminData) {
                if (adminData.role === 'enseignant') {
                    // ✅ RESTRICTION: Les enseignants ne voient que leurs propres jeux
                    query = query.where('createdBy').equals(adminData.id);
                    logger.info('Enseignant: filtrage par créateur ID:', adminData.id);
                } else if (adminData.role === 'admin') {
                    // Les admins voient les jeux de leur école
                    if (adminData.ecole) {
                        query = query.where('ecole').equals(adminData.ecole.toString());
                        logger.info('Admin: filtrage par école:', adminData.ecole);
                    } else {
                        throw new Error("L'administrateur ne possède pas d'école liée.");
                    }
                }
                // Les super_admin voient tous les jeux (pas de restriction)
            }

            // Populate complet avec toutes les relations
            return await query
                .populate({
                    path: 'createdBy',
                    select: 'nom prenom email role matricule phone genre statut adresse date',
                    populate: [
                        {
                            path: 'pays',
                            select: 'libelle'
                        },
                        {
                            path: 'ecole',
                            select: 'libelle ville telephone'
                        }
                    ]
                })
                .populate('ecole', 'libelle ville telephone')
                .populate({
                    path: 'questions',
                    select: 'question type niveau difficulte points',
                    populate: {
                        path: 'reponses',
                        select: 'reponse correct'
                    }
                })
                .populate({
                    path: 'planification',
                    select: 'pin statut type date_debut date_fin heure_debut heure_fin limite_participant',
                    populate: {
                        path: 'participants',
                        select: 'nom prenom email statut score'
                    }
                })
                .sort({ date: -1 })
                .exec();
                
        } catch (error) {
            logger.error('Erreur lors de la récupération détaillée des jeux:', error);
            throw new Error('Erreur lors de la récupération des jeux détaillés : ' + error.message);
        }
    },


    /**
     * Récupère tous les jeux avec tous les détails (questions, planifications, participants, etc.)
     * Utilisé pour l'administration et la gestion complète
     */
    getAllJeuxDetailles: async (adminData = null) => {
        try {
            let query = Jeu.find();
            logger.info('Récupération détaillée des jeux pour:', adminData);

            // Si un admin est fourni et qu'il n'est pas super_admin, on filtre par école
            if (adminData && adminData.role !== 'super_admin') {
                if (adminData.ecole) {
                    query = query.where('ecole').equals(adminData.ecole.toString());
                    logger.info('Filtrage par école:', adminData.ecole);
                } else {
                    throw new Error("L'administrateur ne possède pas d'école liée.");
                }
            }
            
            return await query
                .populate({
                    path: 'createdBy',
                    select: 'nom prenom email role matricule phone genre statut adresse date',
                    populate: [
                        {
                            path: 'pays',
                            select: 'libelle'
                        },
                        {
                            path: 'ecole',
                            select: 'libelle ville'
                        }
                    ]
                })
                .populate('questions')
                .populate('ecole', 'libelle ville telephone')
                .populate({
                    path: 'planification',
                    populate: {
                        path: 'participants',
                        populate: [
                            {
                                path: 'apprenant',
                            },
                            {
                                path: 'reponses',
                                populate: {
                                    path: 'question',
                                }
                            }
                        ]
                    }
                })
                .sort({ date: -1 }) // Tri par date décroissante
                .exec();
                
        } catch (error) {
            logger.error('Erreur lors de la récupération détaillée des jeux:', error);
            throw new Error('Erreur lors de la récupération des jeux avec détails : ' + error.message);
        }
    },

    /**
     * Ancien méthode conservée pour compatibilité
     * @deprecated Utiliser getAllJeuxDetailles à la place
     */
    getAllJeu: async (adminData = null) => {
        logger.warn('Méthode getAllJeu dépréciée, utiliser getAllJeuxDetailles');
        return await jeuService.getAllJeuxDetailles(adminData);
    },

    getAllJeuSansDetails: async () => {
        try {
            return await Jeu.find()
                .select('titre image date createdBy ecole')
                .populate({
                    path: 'createdBy',
                    select: 'nom prenom email role matricule'
                })
                .populate('ecole', 'libelle ville')
                .sort({ date: -1 });
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la récupération des jeux : ' + error.message);
            }
        }
    },

    createJeu: async (jeuData) => {
        try {
            logger.info('Creation de mon jeu');
            
            // Validation des données obligatoires
            if (!jeuData.titre) {
                throw new Error('Le titre du jeu est obligatoire');
            }
            
            if (!jeuData.createdBy) {
                throw new Error('L\'ID du créateur est obligatoire');
            }
            
            if (!jeuData.ecole) {
                throw new Error('L\'école est obligatoire');
            }
            
            // ✅ AJOUT : Vérifier que le créateur existe dans la base
            const Admin = require('../models/Admin');
            const createur = await Admin.findById(jeuData.createdBy);
            if (!createur) {
                throw new Error('Créateur non trouvé dans la base de données');
            }
            logger.info('Créateur trouvé:', createur.email);
            
            // Création du jeu avec données validées
            const jeuToCreate = {
                titre: jeuData.titre,
                createdBy: jeuData.createdBy,
                ecole: jeuData.ecole
            };
            
            // Ajout conditionnel de l'image
            if (jeuData.image) {
                jeuToCreate.image = jeuData.image;
                logger.info('Image ajoutée au jeu:', jeuData.image);
            } else {
                logger.info('Jeu créé sans image');
            }
            
            const newJeu = new Jeu(jeuToCreate);
            const savedJeu = await newJeu.save();
            logger.info('Jeu sauvegardé avec ID:', savedJeu._id);
            
            // ✅ CORRECTION : Populate avec gestion d'erreur et retry
            let jeuWithCreator;
            try {
                jeuWithCreator = await Jeu.findById(savedJeu._id)
                    .populate({
                        path: 'createdBy',
                        select: 'nom prenom email role matricule phone genre statut adresse',
                        populate: {
                            path: 'pays',
                            select: 'libelle'
                        }
                    })
                    .populate('ecole', 'libelle ville')
                    .exec();
                    
                // ✅ VÉRIFICATION : Si le populate échoue, créer l'objet manuellement
                if (!jeuWithCreator.createdBy) {
                    logger.warn('Populate createdBy a échoué, création manuelle...');
                    jeuWithCreator = {
                        ...savedJeu.toObject(),
                        createdBy: {
                            _id: createur._id,
                            nom: createur.nom,
                            prenom: createur.prenom,
                            email: createur.email,
                            role: createur.role,
                            matricule: createur.matricule,
                            phone: createur.phone,
                            genre: createur.genre,
                            statut: createur.statut,
                            adresse: createur.adresse
                        },
                        ecole: jeuWithCreator.ecole // Garder l'école populée
                    };
                }
                
            } catch (populateError) {
                logger.error('Erreur lors du populate:', populateError);
                
                // ✅ FALLBACK : Créer la réponse avec les données du créateur récupérées manuellement
                jeuWithCreator = {
                    ...savedJeu.toObject(),
                    createdBy: {
                        _id: createur._id,
                        nom: createur.nom,
                        prenom: createur.prenom,
                        email: createur.email,
                        role: createur.role,
                        matricule: createur.matricule,
                        phone: createur.phone,
                        genre: createur.genre,
                        statut: createur.statut,
                        adresse: createur.adresse
                    }
                };
                
                // Récupérer l'école séparément
                const Ecole = require('../models/Ecole');
                const ecole = await Ecole.findById(jeuData.ecole).select('libelle ville');
                jeuWithCreator.ecole = ecole;
            }
            
            return { 
                savedJeu: jeuWithCreator, 
                message: 'Jeu créé avec succès', 
                statut: 200 
            };
        } catch (error) {
            logger.error('Erreur lors de la création du jeu:', error);
            throw new Error('Erreur lors de la création du jeu : ' + error.message);
        }
    },
    addParticipant: async (jeuId, participantId) => {
        const jeu = await Jeu.findById(jeuId);

        if (!jeu) {
            throw new Error('Jeu non trouvé');
        }
        const participant = await Participant.findById(participantId);
        if (!participant) {
            throw new Error('Participant non trouvé');
        }
        if (jeu.participants.includes(participant._id)) {
            throw new Error('Le participant est déjà ajouté au jeu');
        }
        jeu.participants.push(participant._id);
        await jeu.save();
        return jeu;  // Retourner le jeu mis à jour
    },
    
    getJeuById: async (id) => {
        try {
            const jeu = await Jeu.findById(id)
                .populate({
                    path: 'createdBy',
                    select: 'nom prenom email role matricule phone genre statut adresse date',
                    populate: [
                        {
                            path: 'pays',
                            select: 'libelle'
                        },
                        {
                            path: 'ecole',
                            select: 'libelle ville telephone'
                        }
                    ]
                })
                .populate({
                    path: 'questions',
                    populate: [
                        {
                            path: 'reponses',
                        },
                        {
                            path: 'typeQuestion',
                        },
                        {
                            path: 'point',
                        }
                    ]
                })
                .populate({
                    path: 'planification',
                    populate: {
                        path: 'participants',
                        populate: {
                            path: 'apprenant',
                        }
                    }
                })
                .populate('ecole', 'libelle ville telephone')
                .exec();
    
            if (!jeu) {
                throw new Error(`Aucun jeu trouvé avec l'ID ${id}`);
            }
    
            return jeu;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du jeu avec l'ID ${id}: ${error.message}`);
        }
    },

    /**
     * Récupère un jeu par son PIN via une planification
     * Cette méthode est publique et ne nécessite pas d'authentification
     */
    getJeuByPin: async (pin) => {
        try {
            // Rechercher la planification par PIN
            const Planification = require('../models/Planification');
            
            const planification = await Planification.findOne({ pin: pin })
                .populate({
                    path: 'jeu',
                    populate: [
                        {
                            path: 'questions',
                            populate: [
                                {
                                    path: 'reponses',
                                },
                                {
                                    path: 'typeQuestion',
                                },
                                {
                                    path: 'point',
                                }
                            ]
                        },
                        {
                            path: 'createdBy',
                            select: 'nom prenom email role matricule phone',
                            populate: {
                                path: 'pays',
                                select: 'libelle'
                            }
                        },
                        {
                            path: 'ecole',
                            select: 'libelle ville'
                        }
                    ]
                })
                .populate({
                    path: 'participants',
                    populate: {
                        path: 'apprenant',
                        select: 'nom prenom avatar matricule'
                    }
                })
                .exec();

            if (!planification) {
                throw new Error(`Aucune planification trouvée avec le PIN ${pin}`);
            }

            if (!planification.jeu) {
                throw new Error(`Aucun jeu associé à cette planification`);
            }

            // Retourner les informations du jeu avec la planification
            return {
                jeu: planification.jeu,
                planification: {
                    _id: planification._id,
                    pin: planification.pin,
                    statut: planification.statut,
                    type: planification.type,
                    date_debut: planification.date_debut,
                    date_fin: planification.date_fin,
                    heure_debut: planification.heure_debut,
                    heure_fin: planification.heure_fin,
                    limite_participant: planification.limite_participant,
                    participants: planification.participants
                }
            };
            } catch (error) {
                throw new Error(`Erreur lors de la récupération du jeu avec le PIN ${pin}: ${error.message}`);
            }
        },

    /**
     * Récupère tous les jeux créés par un enseignant spécifique
     * @param {string} enseignantId - ID de l'enseignant
     * @param {Object} currentUser - Utilisateur qui fait la demande (pour les permissions)
     * @returns {Array} Liste des jeux créés par l'enseignant
     */
   getJeuxByEnseignant: async (enseignantId, currentUser = null) => {
    try {
        let query = Jeu.find({ createdBy: enseignantId });

        // ✅ CORRECTION: Filtrage selon les permissions
        if (currentUser && currentUser.role !== 'super_admin') {
            if (currentUser.ecole) {
                query = query.where('ecole').equals(currentUser.ecole);
            }
        }

        const jeux = await query
            .populate({
                path: 'createdBy',
                select: 'nom prenom email role matricule phone genre statut adresse date',
                populate: [
                    {
                        path: 'pays',
                        select: 'libelle'
                    },
                    {
                        path: 'ecole',
                        select: 'libelle ville telephone'
                    }
                ]
            })
            .populate('ecole', 'libelle ville telephone')
            .populate({
                path: 'questions',
                select: 'question type niveau difficulte points',
                populate: {
                    path: 'reponses',
                    select: 'reponse correct'
                }
            })
            .populate({
                path: 'planification',
                select: 'pin statut type date_debut date_fin heure_debut heure_fin limite_participant',
                populate: {
                    path: 'participants',
                    select: 'nom prenom email statut score'
                }
            })
            .sort({ date: -1 })
            .exec();

        return jeux;
    } catch (error) {
        logger.error('Erreur lors de la récupération des jeux par enseignant:', error);
        throw new Error('Erreur lors de la récupération des jeux de l\'enseignant : ' + error.message);
    }
    },

    updateJeu: async (jeuId, jeuData) => {
        try {
            // Validation de l'ID
            if (!jeuId) {
                throw new Error("L'ID du jeu est requis");
            }
            
            // Préparation des données à mettre à jour
            const updateData = {};
            
            // Mise à jour conditionnelle des champs
            if (jeuData.titre) {
                updateData.titre = jeuData.titre;
            }
            
            if (jeuData.image) {
                updateData.image = jeuData.image;
                logger.info('Nouvelle image ajoutée lors de la mise à jour:', jeuData.image);
            }
            
            // Si d'autres champs sont fournis, les ajouter
            Object.keys(jeuData).forEach(key => {
                if (key !== 'titre' && key !== 'image' && jeuData[key] !== undefined) {
                    updateData[key] = jeuData[key];
                }
            });
            
            const updatedJeu = await Jeu.findByIdAndUpdate(
                jeuId,
                { $set: updateData },
                { new: true, runValidators: true }
            )
            .populate({
                path: 'createdBy',
                select: 'nom prenom email role matricule phone genre statut adresse',
                populate: {
                    path: 'pays',
                    select: 'libelle'
                }
            })
            .populate('ecole', 'libelle ville');
            
            if (!updatedJeu) {
                throw new Error("Jeu non trouvé");
            }
            
            return updatedJeu;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour du jeu : " + error.message);
        }
    },

    deleteJeuById: async (jeuId) => {
        try {
            const deletedJeu = await Jeu.findByIdAndDelete(jeuId);
            if (!deletedJeu) {
                throw new Error("Jeu non trouvé");
            }
            return deletedJeu;
        } catch (error) {
            throw new Error("Erreur lors de la suppression du jeu : " + error.message);
        }
    },

    // Méthode utilitaire pour s'assurer que createdBy est toujours un objet complet
    ensureCreatedByPopulated: async (jeu) => {
        try {
            // Si createdBy n'est qu'un ID string ou n'a pas toutes les infos
            if (typeof jeu.createdBy === 'string' || !jeu.createdBy.email) {
                const AdminService = require('./adminService');
                const createur = await AdminService.getAdminById(jeu.createdBy._id || jeu.createdBy);
                
                if (createur) {
                    jeu.createdBy = {
                        _id: createur._id,
                        nom: createur.nom,
                        prenom: createur.prenom,
                        email: createur.email,
                        role: createur.role,
                        matricule: createur.matricule,
                        phone: createur.phone,
                        genre: createur.genre,
                        statut: createur.statut,
                        adresse: createur.adresse,
                        date: createur.date,
                        pays: createur.pays,
                        ecole: createur.ecole
                    };
                }
            }
            return jeu;
        } catch (error) {
            logger.error('Erreur lors du populate de createdBy:', error);
            return jeu; // Retourner le jeu tel quel en cas d'erreur
        }
    }
};

module.exports = jeuService;