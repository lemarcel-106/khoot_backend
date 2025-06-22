const Jeu = require('../models/Jeu');
const tokenUtils = require('../utils/token');
const userService = require('./userService')
const Participant = require('../models/Participant');
const logger = require('../logger');

const jeuService = {

    getAllJeuSansDetails: async () => {
        try {
            return await Jeu.find();
        } catch (error) {
            if (error.code === 11000) {
                // Récupère le nom du champ qui a causé l'erreur de duplication
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création du jeu : ' + error.message);
            }
        }
    },

    getAllJeu: async (adminData = null) => {
        try {
            let query = Jeu.find();
            logger.info(adminData);

            // Si un admin est fourni et qu'il n'est pas super_admin, on filtre par école
            if (adminData && adminData.role !== 'super_admin') {
                if (adminData.ecole) {
                    query = query.where('ecole').equals(adminData.ecole.toString());
                    console.log("moi avec toi et autres", query)
                    logger.info(query);
                } else {
                    throw new Error("L'administrateur ne possède pas d'école liée.");
                }

                console.log('Requête filtrée par école :', query.getFilter());
            }
            
            return await query
                .populate('createdBy')
                .populate('questions')
                .populate('ecole')
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
                });
        } catch (error) {
            throw new Error('Erreur lors de la récupération des jeux avec détails');
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
            
            return { 
                savedJeu, 
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
                .populate('createdBy', 'name email')
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
                .exec();
    
            if (!jeu) {
                throw new Error(`Aucun jeu trouvé avec l'ID ${id}`);
            }
    
            return jeu;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du jeu avec l'ID ${id}: ${error.message}`);
        }
    },

    getJeuByPin: async (pin) => {
        try {
            const jeu = await Jeu.findOne({ pin: pin })
                .populate('createdBy', 'name email')
                .populate('participants', 'nom avatar score')
                .populate('questions')
                .exec();

            if (!jeu) {
                throw new Error(`Aucun jeu trouvé avec le pin ${pin}`);
            }

            return jeu;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération du jeu avec le pin ${pin}: ${error.message}`);
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
            );
            
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
    }
};

module.exports = jeuService;