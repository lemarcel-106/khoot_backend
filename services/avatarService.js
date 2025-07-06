const Avatar = require('../models/Avatar');
const fs = require('fs').promises;
const path = require('path');

const avatarService = {
    /**
     * Créer un nouvel avatar
     */
    async create(data, file) {
        try {
            if (!file) {
                throw new Error('Aucune image fournie');
            }

            // Vérifier le format PNG
            if (!file.originalname.toLowerCase().endsWith('.png')) {
                throw new Error('L\'image doit être au format PNG');
            }

            const avatarData = {
                titre: data.titre,
                description: data.description || '',
                image: file.filename,
                actif: data.actif !== undefined ? data.actif : true
            };

            const avatar = new Avatar(avatarData);
            return await avatar.save();
        } catch (error) {
            throw new Error(`Erreur lors de la création de l'avatar: ${error.message}`);
        }
    },

    /**
     * Récupérer tous les avatars
     */
    async getAll(filter = {}) {
        try {
            const query = { actif: true, ...filter };
            return await Avatar.find(query).sort({ titre: 1 });
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des avatars: ${error.message}`);
        }
    },

    /**
     * Récupérer un avatar par ID
     */
    async getById(id) {
        try {
            const avatar = await Avatar.findById(id);
            if (!avatar) {
                throw new Error('Avatar non trouvé');
            }
            return avatar;
        } catch (error) {
            throw new Error(`Erreur lors de la récupération de l'avatar: ${error.message}`);
        }
    },

    /**
     * Mettre à jour un avatar
     */
    async update(id, data, file) {
        try {
            const avatar = await this.getById(id);
            
            // Mettre à jour les champs texte
            if (data.titre) avatar.titre = data.titre;
            if (data.description !== undefined) avatar.description = data.description;
            if (data.actif !== undefined) avatar.actif = data.actif;

            // Mettre à jour l'image si fournie
            if (file) {
                if (!file.originalname.toLowerCase().endsWith('.png')) {
                    throw new Error('L\'image doit être au format PNG');
                }
                
                // Supprimer l'ancienne image
                await this.deleteImageFile(avatar.image);
                avatar.image = file.filename;
            }

            return await avatar.save();
        } catch (error) {
            throw new Error(`Erreur lors de la mise à jour de l'avatar: ${error.message}`);
        }
    },

    /**
     * Supprimer un avatar
     */
    async delete(id) {
        try {
            const avatar = await this.getById(id);
            
            // Vérifier que l'avatar n'est pas utilisé
            const Apprenant = require('../models/Apprenant');
            const utilisationCount = await Apprenant.countDocuments({ avatar: id });
            
            if (utilisationCount > 0) {
                throw new Error(`Impossible de supprimer l'avatar: ${utilisationCount} apprenant(s) l'utilisent`);
            }

            // Supprimer le fichier image
            await this.deleteImageFile(avatar.image);
            
            // Supprimer de la base de données
            await Avatar.findByIdAndDelete(id);
            
            return avatar;
        } catch (error) {
            throw new Error(`Erreur lors de la suppression de l'avatar: ${error.message}`);
        }
    },

    /**
     * Obtenir un avatar aléatoire
     */
    async getRandomAvatar() {
        try {
            const count = await Avatar.countDocuments({ actif: true });
            if (count === 0) {
                throw new Error('Aucun avatar disponible');
            }
            
            const random = Math.floor(Math.random() * count);
            const avatar = await Avatar.findOne({ actif: true }).skip(random);
            
            return avatar;
        } catch (error) {
            throw new Error(`Erreur lors de la sélection d'un avatar aléatoire: ${error.message}`);
        }
    },

    /**
     * Supprimer un fichier image
     */
    async deleteImageFile(filename) {
        try {
            if (filename && !filename.startsWith('http')) {
                const filePath = path.join(__dirname, '../public/uploads/avatars', filename);
                await fs.unlink(filePath);
            }
        } catch (error) {
            console.warn(`Impossible de supprimer le fichier image ${filename}:`, error.message);
        }
    }
};

module.exports = avatarService;