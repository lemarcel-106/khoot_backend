const apprenantService = require('../services/apprenantService');
const participantService = require('../services/participantService');
const jeuService = require('../services/jeuService');

// ===============================================
// MÉTHODES EXISTANTES
// ===============================================

exports.getApprenants = async (req, res) => {
    try {
        // MODIFICATION : Récupérer les données de l'admin connecté avec son école
        const adminData = {
            id: req.user.id,
            role: req.user.role,
            ecole: req.user.ecole
        };
        
        // ✅ CORRIGÉ : Utiliser apprenantService
        const participants = await apprenantService.getAllParticipantService(adminData);
        res.status(200).json({
            success: true,
            message: 'Liste des participants récupérée avec succès',
            data: participants
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createApprenant = async (req, res) => {
    try {
        const ecoleFromToken = req.user.ecole;
        
        if (!ecoleFromToken) {
            return res.status(400).json({
                success: false,
                message: 'Aucune école assignée à cet administrateur.'
            });
        }

        const apprenantData = { ...req.body };
        delete apprenantData.ecole;
        apprenantData.ecole = ecoleFromToken;

        const reqModified = {
            body: apprenantData,
            file: req.file
        };

        // ✅ CORRIGÉ : Utiliser apprenantService
        const apprenant = await apprenantService.createParticipant(reqModified);
        await apprenantService.addApprenantToEcole(ecoleFromToken, apprenant._id);
        
        res.status(201).json({
            success: true,
            message: 'Apprenant créé avec succès',
            data: apprenant
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `Le ${field} existe déjà, veuillez en utiliser un autre.`
            });
        }
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'apprenant',
            error: err.message
        });
    }
};

exports.updateApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        const apprenantData = req.body;

        // ✅ Utiliser apprenantService pour les opérations d'apprenant
        const apprenant = await apprenantService.getApprenantById(apprenantId);
        if (!apprenant) {
            return res.status(404).json({
                success: false,
                message: 'Apprenant non trouvé'
            });
        }

        // Vérifications de permissions...
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        if (req.user.role !== 'super_admin' && apprenantData.ecole) {
            delete apprenantData.ecole;
        }

        // ✅ Utiliser apprenantService pour la mise à jour
        const updatedApprenant = await apprenantService.updateApprenant(apprenantId, apprenantData);
        
        res.status(200).json({
            success: true,
            message: 'Apprenant mis à jour avec succès',
            data: updatedApprenant
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'apprenant',
            error: err.message
        });
    }
};

exports.deleteApprenantById = async (req, res) => {
    try {
        const apprenantId = req.params.id;

        // ✅ CORRIGÉ : Utiliser apprenantService
        const apprenant = await apprenantService.getApprenantById(apprenantId);
        if (!apprenant) {
            return res.status(404).json({
                success: false,
                message: 'Apprenant non trouvé'
            });
        }

        // Vérification des permissions
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        // ✅ CORRIGÉ : Utiliser apprenantService
        await apprenantService.deleteApprenantById(apprenantId);
        res.status(200).json({
            success: true,
            message: 'Apprenant supprimé avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'apprenant',
            error: err.message
        });
    }
};

exports.getApprenantById = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        
        // ✅ CORRIGÉ : Utiliser apprenantService
        const apprenant = await apprenantService.getApprenantById(apprenantId);
        
        if (!apprenant) {
            return res.status(404).json({ 
                success: false,
                message: 'Apprenant non trouvé' 
            });
        }

        // Vérification des permissions
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Apprenant récupéré avec succès',
            data: apprenant
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'apprenant',
            error: err.message
        });
    }
};

exports.addExistingApprenantToJeu = async (req, res) => {
    try {
        const { apprenantId, jeuId } = req.body;
        
        // Vérifications et logique pour ajouter un apprenant à un jeu
        // ... (votre logique existante)
        
        res.status(200).json({
            success: true,
            message: 'Apprenant ajouté au jeu avec succès'
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout de l\'apprenant au jeu',
            error: err.message
        });
    }
};

exports.getApprenantByMatricule = async (req, res) => {
    try {
        const { matricule } = req.body;
        
        const apprenant = await apprenantService.getParticipantByMatricule(matricule);
        
        if (!apprenant) {
            return res.status(404).json({
                success: false,
                message: 'Apprenant non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Apprenant récupéré avec succès',
            data: apprenant
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'apprenant',
            error: err.message
        });
    }
};

exports.getSessionsApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        
        // Logique pour récupérer les sessions de l'apprenant
        // ... (votre logique existante)
        
        res.status(200).json({
            success: true,
            message: 'Sessions de l\'apprenant récupérées avec succès',
            data: []
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des sessions',
            error: err.message
        });
    }
};

exports.getStatistiquesApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        
        // Logique pour récupérer les statistiques de l'apprenant
        // ... (votre logique existante)
        
        res.status(200).json({
            success: true,
            message: 'Statistiques de l\'apprenant récupérées avec succès',
            data: {}
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques',
            error: err.message
        });
    }
};

// ===============================================
// NOUVELLES MÉTHODES POUR LES INVITÉS
// ===============================================

/**
 * Créer un apprenant invité
 * POST /api/apprenants/invite
 */
exports.createInvite = async (req, res) => {
    try {
        console.log('➕ Création d\'un apprenant invité...');
        console.log('Données reçues:', req.body);

        // Validation du pseudonyme requis
        if (!req.body.pseudonyme) {
            return res.status(400).json({
                success: false,
                message: 'Le pseudonyme est requis pour créer un apprenant invité'
            });
        }

        // Créer l'apprenant invité via le service
        const apprenant = await apprenantService.create(req.body, 'invite');
        
        res.status(201).json({
            success: true,
            message: 'Apprenant invité créé avec succès',
            data: apprenant
        });
    } catch (error) {
        console.error('❌ Erreur createInvite:', error);
        
        if (error.message.includes('existe déjà')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'apprenant invité',
            error: error.message
        });
    }
};

/**
 * Récupérer tous les apprenants invités
 * GET /api/apprenants/invites
 */
exports.getInvites = async (req, res) => {
    try {
        console.log('📋 Récupération des apprenants invités...');
        
        // Récupérer l'école depuis les paramètres de requête ou le token utilisateur
        const ecoleId = req.query.ecole || req.user?.ecole;
        
        // Données admin pour filtrage si nécessaire
        const adminData = req.user ? {
            id: req.user.id,
            role: req.user.role,
            ecole: req.user.ecole
        } : null;

        const invites = await apprenantService.getInvites(ecoleId, adminData);
        
        res.json({
            success: true,
            data: invites,
            total: invites.length,
            message: 'Apprenants invités récupérés avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur getInvites:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des apprenants invités',
            error: error.message
        });
    }
};

/**
 * Convertir un invité en apprenant d'école
 * POST /api/apprenants/:id/convertir-ecole
 */
exports.convertirEnEcole = async (req, res) => {
    try {
        const { id } = req.params;
        const { ecole, phone, email, ...additionalData } = req.body;

        console.log(`🔄 Conversion de l'apprenant invité ${id} en apprenant d'école...`);

        // Validation des données requises
        if (!ecole) {
            return res.status(400).json({
                success: false,
                message: 'L\'ID de l\'école est requis pour la conversion'
            });
        }

        // Vérifier les permissions : l'utilisateur doit pouvoir accéder à cette école
        if (req.user && req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== ecole.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé : vous ne pouvez convertir que vers votre école'
                });
            }
        }

        // Effectuer la conversion
        const result = await apprenantService.convertirInviteEnEcole(id, ecole, {
            phone: phone || 'aucun',
            email: email || 'aucune',
            ...additionalData
        });

        res.json({
            success: true,
            message: 'Apprenant invité converti en apprenant d\'école avec succès',
            data: result
        });
    } catch (error) {
        console.error('❌ Erreur convertirEnEcole:', error);
        
        if (error.message.includes('Seuls les apprenants invités')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la conversion de l\'apprenant invité',
            error: error.message
        });
    }
};

/**
 * Récupérer les apprenants par type
 * GET /api/apprenants/type/:type
 */
exports.getByType = async (req, res) => {
    try {
        const { type } = req.params;
        console.log(`📋 Récupération des apprenants de type: ${type}...`);

        // Validation du type
        if (!['ecole', 'invite'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Type d\'apprenant invalide. Utilisez "ecole" ou "invite"'
            });
        }

        // Données admin pour filtrage
        const adminData = req.user ? {
            id: req.user.id,
            role: req.user.role,
            ecole: req.user.ecole
        } : null;

        const apprenants = await apprenantService.getAll(adminData, { typeApprenant: type });
        
        res.json({
            success: true,
            data: apprenants,
            total: apprenants.length,
            message: `Apprenants de type "${type}" récupérés avec succès`
        });
    } catch (error) {
        console.error('❌ Erreur getByType:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des apprenants par type',
            error: error.message
        });
    }
};

/**
 * Créer plusieurs apprenants invités en lot
 * POST /api/apprenants/invite/bulk
 */
exports.createInvitesBulk = async (req, res) => {
    try {
        const { apprenants } = req.body;
        console.log(`➕ Création en lot de ${apprenants?.length || 0} apprenants invités...`);

        // Validation des données
        if (!Array.isArray(apprenants) || apprenants.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Un tableau d\'apprenants non vide est requis'
            });
        }

        const results = [];
        const errors = [];

        // Créer chaque apprenant invité
        for (let i = 0; i < apprenants.length; i++) {
            try {
                const apprenantData = apprenants[i];
                
                // Validation du pseudonyme pour chaque apprenant
                if (!apprenantData.pseudonyme) {
                    errors.push({
                        index: i,
                        data: apprenantData,
                        error: 'Pseudonyme requis'
                    });
                    continue;
                }

                const result = await apprenantService.create(apprenantData, 'invite');
                results.push({
                    index: i,
                    data: result
                });
            } catch (error) {
                errors.push({
                    index: i,
                    data: apprenants[i],
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            message: `Création en lot terminée: ${results.length} succès, ${errors.length} erreurs`,
            data: {
                created: results,
                errors: errors,
                summary: {
                    total: apprenants.length,
                    success: results.length,
                    failed: errors.length
                }
            }
        });
    } catch (error) {
        console.error('❌ Erreur createInvitesBulk:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création en lot des apprenants invités',
            error: error.message
        });
    }
};

/**
 * Rechercher des apprenants par pseudonyme ou nom
 * GET /api/apprenants/search/:term
 */
exports.searchApprenants = async (req, res) => {
    try {
        const { term } = req.params;
        const { type } = req.query; // Optionnel: filtrer par type
        
        console.log(`🔍 Recherche d'apprenants avec le terme: "${term}"...`);

        if (!term || term.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Le terme de recherche doit contenir au moins 2 caractères'
            });
        }

        // Données admin pour filtrage
        const adminData = req.user ? {
            id: req.user.id,
            role: req.user.role,
            ecole: req.user.ecole
        } : null;

        // Construire le filtre de recherche
        const searchFilter = {
            $or: [
                { nom: { $regex: term, $options: 'i' } },
                { prenom: { $regex: term, $options: 'i' } },
                { pseudonyme: { $regex: term, $options: 'i' } },
                { matricule: { $regex: term, $options: 'i' } }
            ]
        };

        // Ajouter le filtre de type si spécifié
        if (type && ['ecole', 'invite'].includes(type)) {
            searchFilter.typeApprenant = type;
        }

        const apprenants = await apprenantService.getAll(adminData, searchFilter);
        
        res.json({
            success: true,
            data: apprenants,
            total: apprenants.length,
            searchTerm: term,
            message: `Recherche terminée: ${apprenants.length} résultat(s) trouvé(s)`
        });
    } catch (error) {
        console.error('❌ Erreur searchApprenants:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recherche d\'apprenants',
            error: error.message
        });
    }
};