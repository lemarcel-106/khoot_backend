const jeuService = require('../services/jeuService');
const logger = require('../logger');

/**
 * Récupère la liste simple des jeux (titre, image, date, créateur)
 * Route: GET /api/jeux
 */
exports.getAllJeux = async (req, res) => {
    try {
        // Récupérer les données de l'admin connecté depuis le middleware d'authentification
        const adminData = {
            id: req.user.id,
            role: req.user.role,
            nom: req.user.nom,
            ecole: req.user.ecole,
        };

        const jeux = await jeuService.getAllJeuxSimple(adminData);

        res.status(200).json({
            success: true,
            message: 'Liste des jeux récupérée avec succès',
            data: jeux,
            total: jeux.length
        });
    } catch (err) {
        logger.error('Erreur lors de la récupération des jeux:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

/**
 * Récupère la liste détaillée des jeux avec toutes les relations
 * Route: GET /api/jeux/detailles
 */
exports.getAllJeuxDetailles = async (req, res) => {
    try {
        // Récupérer les données de l'admin connecté depuis le middleware d'authentification
        const adminData = {
            id: req.user.id,
            role: req.user.role,
            nom: req.user.nom,
            ecole: req.user.ecole,
        };

        const jeux = await jeuService.getAllJeuxDetailles(adminData);

        res.status(200).json({
            success: true,
            message: 'Liste détaillée des jeux récupérée avec succès',
            data: jeux,
            total: jeux.length
        });
    } catch (err) {
        logger.error('Erreur lors de la récupération détaillée des jeux:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

/**
 * Récupère un jeu spécifique par son ID avec tous les détails
 * Route: GET /api/jeux/:id
 */
exports.getJeuById = async (req, res) => {
    const { id } = req.params;

    try {
        // Validation de l'ID
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        const jeu = await jeuService.getJeuById(id);
        
        res.status(200).json({
            success: true,
            message: 'Jeu récupéré avec succès',
            data: jeu
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération du jeu ${id}:`, error);
        res.status(404).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * Crée un nouveau jeu
 * Route: POST /api/jeux
 */
exports.createJeu = async (req, res) => {
    try {
        const { titre } = req.body;
        logger.info('Creation de jeu par utilisateur:', req.user.id);

        const createdBy = req.user.id;

        const jeuData = {
            titre,
            createdBy,
            ecole: req.user.ecole
        };

        // Ajout conditionnel de l'image si elle est fournie
        if (req.file) {
            jeuData.image = req.file.path;
            logger.info('Image ajoutée au jeu:', req.file.path);
        } else {
            logger.info('Jeu créé sans image');
        }

        // Crée le jeu via le service jeuService
        const { message, statut, savedJeu } = await jeuService.createJeu(jeuData);

        // Réponse incluant le statut, message, et les informations du jeu
        res.status(201).json({
            success: true,
            statut: statut,
            message: message,
            data: savedJeu
        });
    } catch (err) {
        logger.error('Erreur lors de la création du jeu:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du jeu',
            error: err.message
        });
    }
};

/**
 * Récupère un jeu par son PIN
 * Route: POST /api/jeux/pin
 */
exports.getJeuDetailsByPin = async (req, res) => {
    const { pin } = req.body;
    
    try {
        if (!pin) {
            return res.status(400).json({
                success: false,
                message: 'PIN requis'
            });
        }

        const jeu = await jeuService.getJeuByPin(pin);
        res.status(200).json({
            success: true,
            statut: 200,
            message: "Jeu obtenu avec succès",
            data: jeu
        });
    } catch (error) {
        logger.error(`Erreur lors de la récupération du jeu par PIN ${pin}:`, error);
        res.status(404).json({ 
            success: false,
            message: error.message 
        });
    }
};

/**
 * Met à jour un jeu existant
 * Route: PUT /api/jeux/update/:id
 */
exports.updateJeu = async (req, res) => {
    try {
        const jeuId = req.params.id;
        const jeuData = req.body;
        
        // Si une nouvelle image est fournie, l'ajouter aux données
        if (req.file) {
            jeuData.image = req.file.path;
            logger.info('Nouvelle image ajoutée lors de la mise à jour:', req.file.path);
        }
        
        const updatedJeu = await jeuService.updateJeu(jeuId, jeuData);
        res.status(200).json({
            success: true,
            message: 'Jeu mis à jour avec succès',
            data: updatedJeu
        });
    } catch (err) {
        logger.error(`Erreur lors de la mise à jour du jeu ${req.params.id}:`, err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du jeu',
            error: err.message
        });
    }
};

/**
 * Supprime un jeu
 * Route: DELETE /api/jeux/delete/:id
 */
exports.deleteJeuById = async (req, res) => {
    try {
        const jeuId = req.params.id;
        
        if (!jeuId) {
            return res.status(400).json({
                success: false,
                message: 'ID du jeu requis'
            });
        }

        await jeuService.deleteJeuById(jeuId);
        res.status(200).json({
            success: true,
            message: 'Jeu supprimé avec succès'
        });
    } catch (err) {
        logger.error(`Erreur lors de la suppression du jeu ${req.params.id}:`, err);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du jeu',
            error: err.message
        });
    }
};