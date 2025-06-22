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
            // console.log(adminData) //new ObjectId('670e66283996da36c7cfe378')
            // Si un admin est fourni et qu'il n'est pas super_admin, on filtre par école
            if (adminData && adminData.role !== 'super_admin') {
                if (adminData.ecole) {
                    query = query.where('ecole').equals(adminData.ecole.toString());
                    console.log("moi avec toi et autres",query)
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
                                //   select: 'name email age',
                            },
                            {
                                path: 'reponses',
                                populate: {
                                    path: 'question',
                                    // select: 'text'  // Par exemple, on récupère le texte de la question
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
            const newJeu = new Jeu(jeuData)
            const savedJeu = await newJeu.save()
            return { savedJeu, message: 'Jeu créé avec succès', statut: 200 };
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Erreur lors de la création du jeu" });
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
                        // select: 'texte estCorrect'
                    },
                    {
                        path: 'typeQuestion',
                        // select: 'nom'
                    },
                    {
                        path: 'point',
                        // select: 'valeur'
                    }
                ]
            })
            .populate({
                path: 'planification',
                populate: {
                    path: 'participants',
                    populate: {
                        path: 'apprenant',
                        // select: 'nom avatar score'
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
            const updatedJeu = await Jeu.findByIdAndUpdate(
                jeuId,
                { $set: jeuData },
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

    // createJeu: async (req, res) => {
    //     try {
    //         const token = req.headers.authorization.split(' ')[1];
    //         const userId = tokenUtils.decodedToken(token)
    //         console.log("userId")
    //         const user = userService.getUserById(userId);
    //         if (!user) {
    //             return res.status(404).json({ message: "Utilisateur non trouvé" });
    //         }
    //         const newJeu = new Jeu({
    //             titre: req.body.titre,
    //             image: req.body.image,
    //             createdBy: userId
    //         });
    //         const savedJeu = await newJeu.save();
    //         return { savedJeu, message: 'Jeu créé avec succès', statut: 200 };
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ message: "Erreur lors de la création du jeu" });
    //     }
    // },
};

module.exports = jeuService;
