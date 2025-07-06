const Apprenant = require('../models/Apprenant');
const Ecole = require('../models/Ecole');
const avatarService = require('./avatarService');
const { generateUniqueMatricule } = require('../utils/generateUniqueMatricule');

// ✅ CORRECTION: Import conditionnel pour éviter l'erreur si le fichier n'existe pas
let tokenUtils;
try {
    tokenUtils = require('../utils/token'); // ← Nom correct du fichier
} catch (error) {
    console.warn('⚠️ tokenUtils non trouvé, méthode loginParticipant désactivée');
    tokenUtils = null;
}

const apprenantService = {
    // ===============================================
    // MÉTHODES PRINCIPALES (VERSION UNIFIÉE)
    // ===============================================

    /**
     * Récupérer tous les apprenants avec filtrage par rôle admin
     * REMPLACE: getAllParticipantService + getAll
     */
    async getAll(adminData = null, filter = {}) {
        try {
            let query = Apprenant.find({ actif: true, ...filter });

            // Si un admin est fourni et qu'il n'est pas super_admin, on filtre par son école
            if (adminData && adminData.role !== 'super_admin') {
                if (adminData.ecole) {
                    query = query.where('ecole').equals(adminData.ecole);
                } else {
                    throw new Error("L'administrateur ne possède pas d'école liée.");
                }
            }
            
            return await query
                .populate('ecole', 'libelle ville telephone')
                .populate('avatar')
                .sort({ nom: 1, prenom: 1 })
                .exec();
        } catch (error) {
            throw new Error('Erreur lors de la récupération des apprenants');
        }
    },

    /**
     * Récupérer un apprenant par ID
     * REMPLACE: getApprenantById + getById
     */
    async getById(id) {
        try {
            const apprenant = await Apprenant.findById(id)
                .populate('ecole', 'libelle ville telephone')
                .populate('avatar')
                .exec();
            
            if (!apprenant) {
                throw new Error('Apprenant non trouvé');
            }
            
            return apprenant;
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'apprenant : ' + error.message);
        }
    },

    /**
     * Créer un apprenant (version unifiée)
     * REMPLACE: createParticipant + createApprenantEcole + createApprenantInvite
     */
    async create(data, typeApprenant = 'ecole') {
        try {
            // Déterminer le type automatiquement si non spécifié
            const type = data.typeApprenant || typeApprenant;
            
            // Générer un matricule selon le type
            const matricule = type === 'invite' 
                ? await this.generateMatricule() 
                : await this.generateMatricule(data.ecole);

            // Gérer l'avatar automatiquement pour les invités
            let avatarId = data.avatar;
            if (!avatarId && type === 'invite') {
                try {
                    const randomAvatar = await avatarService.getRandomAvatar();
                    avatarId = randomAvatar._id;
                } catch (avatarError) {
                    console.warn('⚠️ Impossible de récupérer un avatar aléatoire:', avatarError.message);
                    // Continuer sans avatar si le service avatar n'est pas disponible
                }
            }

            const apprenantData = {
                nom: data.nom || (type === 'invite' ? 'Invité' : data.nom),
                prenom: data.prenom || (type === 'invite' ? 'Anonyme' : data.prenom),
                phone: data.phone || "aucun",
                email: data.email || "aucune",
                matricule,
                avatar: avatarId,
                ecole: type === 'invite' ? (data.ecole || null) : data.ecole,
                typeApprenant: type,
                pseudonyme: type === 'invite' ? data.pseudonyme : undefined
            };

            const newApprenant = new Apprenant(apprenantData);
            const savedApprenant = await newApprenant.save();
            
            return await this.getById(savedApprenant._id);
        } catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyValue)[0];
                throw new Error(`Le champ '${field}' existe déjà.`);
            } else {
                throw new Error('Erreur lors de la création de l\'apprenant : ' + error.message);
            }
        }
    },

    /**
     * Mettre à jour un apprenant
     * REMPLACE: updateApprenant + update
     */
    async update(id, data) {
        try {
            const apprenant = await this.getById(id);
            
            // Champs modifiables pour tous les types
            const allowedFields = ['nom', 'prenom', 'phone', 'email', 'avatar', 'actif'];
            
            // Champs spécifiques aux invités
            if (apprenant.typeApprenant === 'invite') {
                allowedFields.push('pseudonyme');
            }

            // Préparer les données de mise à jour
            const updateData = {};
            allowedFields.forEach(field => {
                if (data[field] !== undefined) {
                    updateData[field] = data[field];
                }
            });

            const updatedApprenant = await Apprenant.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            )
            .populate('avatar')
            .populate('ecole');
            
            if (!updatedApprenant) {
                throw new Error("Apprenant non trouvé");
            }
            
            return updatedApprenant;
        } catch (error) {
            throw new Error("Erreur lors de la mise à jour de l'apprenant : " + error.message);
        }
    },

    /**
     * Supprimer un apprenant
     * REMPLACE: deleteApprenantById + delete
     */
    async delete(id) {
        try {
            const apprenant = await this.getById(id);
            
            // Vérifier s'il y a des participations
            const Participant = require('../models/Participant');
            const participations = await Participant.countDocuments({ apprenant: id });
            
            if (participations > 0) {
                // Désactiver au lieu de supprimer si des participations existent
                const updatedApprenant = await Apprenant.findByIdAndUpdate(
                    id,
                    { actif: false },
                    { new: true }
                );
                return { action: 'désactivé', apprenant: updatedApprenant };
            } else {
                // Supprimer complètement
                const deletedApprenant = await Apprenant.findByIdAndDelete(id);
                return { action: 'supprimé', apprenant: deletedApprenant };
            }
        } catch (error) {
            throw new Error("Erreur lors de la suppression de l'apprenant : " + error.message);
        }
    },

    // ===============================================
    // MÉTHODES UTILITAIRES
    // ===============================================

    /**
     * Générer un matricule unique
     */
    async generateMatricule(ecoleId = null) {
        try {
            let prefix = 'INV'; // Pour les invités
            
            if (ecoleId) {
                const ecole = await Ecole.findById(ecoleId);
                if (ecole) {
                    prefix = ecole.libelle.substring(0, 3).toUpperCase();
                }
            }

            let matricule;
            let exists = true;
            let attempts = 0;
            const maxAttempts = 100;

            while (exists && attempts < maxAttempts) {
                const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                matricule = `${prefix}${randomNum}`;
                
                const existingApprenant = await Apprenant.findOne({ matricule });
                exists = !!existingApprenant;
                attempts++;
            }

            if (exists) {
                throw new Error('Impossible de générer un matricule unique après plusieurs tentatives');
            }

            return matricule;
        } catch (error) {
            throw new Error(`Erreur lors de la génération du matricule: ${error.message}`);
        }
    },

    /**
     * Récupérer un participant par matricule
     */
    async getByMatricule(matricule) {
        try {
            const user = await Apprenant.findOne({ matricule })
                .populate('ecole', 'libelle ville telephone')
                .populate('avatar')
                .exec();
            return user;
        } catch (error) {
            throw new Error('Erreur lors de la récupération de l\'utilisateur par matricule');
        }
    },

    /**
     * Connexion d'un participant
     */
    async loginParticipant(matricule) {
        try {
            if (!tokenUtils) {
                throw new Error('Service de token non disponible');
            }

            const user = await Apprenant.findOne({ matricule });
            if (!user) throw new Error('Utilisateur non trouvé');
            
            const token = tokenUtils.generateToken(user);
            return { user, token };
        } catch (error) {
            throw new Error('Erreur lors de l\'authentification de l\'utilisateur : ' + error.message);
        }
    },

    /**
     * Ajouter un apprenant à une école
     */
    async addToEcole(ecoleId, apprenantId) {
        try {
            const ecole = await Ecole.findById(ecoleId);
            if (!ecole) {
                throw new Error('Ecole non trouvée');
            }
            const apprenant = await Apprenant.findById(apprenantId);
            if (!apprenant) {
                throw new Error('Apprenant non trouvé');
            }
            if (ecole.apprenants.includes(apprenant._id)) {
                throw new Error('L\'apprenant est déjà ajouté à cette école');
            }
            ecole.apprenants.push(apprenant._id);
            await ecole.save();
        } catch (error) {
            throw new Error('Erreur lors de l\'ajout de l\'apprenant à l\'école : ' + error.message);
        }
    },

    // ===============================================
    // MÉTHODES SPÉCIALISÉES
    // ===============================================

    /**
     * Récupérer les apprenants par école
     */
    async getByEcole(ecoleId, adminData = null) {
        return await this.getAll(adminData, { ecole: ecoleId });
    },

    /**
     * Récupérer les apprenants invités
     */
    async getInvites(ecoleId = null, adminData = null) {
        const filter = { typeApprenant: 'invite' };
        if (ecoleId) {
            filter.ecole = ecoleId;
        }
        return await this.getAll(adminData, filter);
    },

    /**
     * Convertir un invité en apprenant d'école
     */
    async convertirInviteEnEcole(id, ecoleId, additionalData = {}) {
        try {
            const apprenant = await this.getById(id);
            
            if (apprenant.typeApprenant !== 'invite') {
                throw new Error('Seuls les apprenants invités peuvent être convertis');
            }

            // Générer un nouveau matricule pour l'école
            const nouveauMatricule = await this.generateMatricule(ecoleId);

            const updatedData = {
                typeApprenant: 'ecole',
                ecole: ecoleId,
                matricule: nouveauMatricule,
                phone: additionalData.phone || apprenant.phone || 'aucun',
                email: additionalData.email || apprenant.email || 'aucune',
                ...additionalData
            };

            // Supprimer le pseudonyme car ce n'est plus un invité
            await Apprenant.findByIdAndUpdate(id, {
                ...updatedData,
                $unset: { pseudonyme: "" }
            });

            return await this.getById(id);
        } catch (error) {
            throw new Error(`Erreur lors de la conversion de l'apprenant invité: ${error.message}`);
        }
    },

    // ===============================================
    // ALIAS POUR COMPATIBILITÉ (À SUPPRIMER PROGRESSIVEMENT)
    // ===============================================

    /** @deprecated Utiliser getAll() */
    async getAllParticipantService(adminData = null) {
        return await this.getAll(adminData);
    },

    /** @deprecated Utiliser getById() */
    async getApprenantById(id) {
        return await this.getById(id);
    },

    /** @deprecated Utiliser create() */
    async createParticipant(req) {
        return await this.create(req.body);
    },

    /** @deprecated Utiliser getByMatricule() */
    async getParticipantByMatricule(matricule) {
        return await this.getByMatricule(matricule);
    },

    /** @deprecated Utiliser update() */
    async updateApprenant(id, data) {
        return await this.update(id, data);
    },

    /** @deprecated Utiliser delete() */
    async deleteApprenantById(id) {
        return await this.delete(id);
    },

    /** @deprecated Utiliser addToEcole() */
    async addApprenantToEcole(ecoleId, apprenantId) {
        return await this.addToEcole(ecoleId, apprenantId);
    }
};

module.exports = apprenantService;