const PaysService = require('../services/paysService');

const PaysController = {
    async createPays(req, res) {
        try {
            const paysData = req.body;
            const pays = await PaysService.createPays(paysData);
            return res.status(200).json({
                success: true,
                message: 'Le pays a été créé avec succès',
                data: pays
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    },

    // ✅ MODIFIÉ : Inclure le total d'écoles dans la réponse
    async getAllPays(req, res) {
        try {
            const pays = await PaysService.getAllPays();
            
            // Calculer quelques statistiques générales
            const totalPays = pays.length;
            const totalEcoles = pays.reduce((sum, p) => sum + p.totalEcoles, 0);
            const paysAvecEcoles = pays.filter(p => p.totalEcoles > 0).length;
            
            return res.status(200).json({
                success: true,
                message: 'Liste de tous les pays avec le total d\'écoles',
                data: pays,
                statistiques: {
                    totalPays: totalPays,
                    totalEcoles: totalEcoles,
                    paysAvecEcoles: paysAvecEcoles,
                    paysSansEcoles: totalPays - paysAvecEcoles,
                    moyenneEcolesParPays: totalPays > 0 ? Math.round(totalEcoles / totalPays * 100) / 100 : 0
                }
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    },

    // ✅ MODIFIÉ : Inclure détails des écoles pour un pays spécifique
    async getPaysById(req, res) {
        try {
            const paysId = req.params.id;
            const pays = await PaysService.getPaysById(paysId);
            
            if (!pays) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Pays non trouvé' 
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Le pays a été récupéré avec succès',
                data: pays
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    },

    async getPaysByLibelle(req, res) {
        try {
            const { libelle } = req.params;
            const pays = await PaysService.getPaysByLibelle(libelle);
            if (!pays) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Pays non trouvé avec ce libellé' 
                });
            }
            return res.status(200).json({
                success: true,
                data: pays
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    },

    // ✅ NOUVEAU : Route pour les statistiques détaillées des pays
    async getPaysStatistiques(req, res) {
        try {
            const statistiques = await PaysService.getPaysStatistiques();
            return res.status(200).json({
                success: true,
                message: 'Statistiques des pays récupérées avec succès',
                data: statistiques
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    },

    // ============================================================================
    // ✅ AMÉLIORÉ : Méthode updatePays avec meilleure gestion d'erreurs
    // ============================================================================
    async updatePays(req, res) {
        try {
            const paysId = req.params.id;
            const paysData = req.body;

            // Validation de l'ID
            if (!paysId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du pays requis dans l\'URL'
                });
            }

            // Log pour déboguer
            console.log('🔄 Mise à jour du pays avec ID:', paysId);
            console.log('📝 Données reçues:', paysData);

            // Validation des données (optionnel)
            if (paysData.libelle && paysData.libelle.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Le libellé du pays ne peut pas être vide'
                });
            }

            const updatedPays = await PaysService.updatePays(paysId, paysData);
            
            console.log('✅ Pays mis à jour avec succès:', updatedPays);
            
            res.status(200).json({
                success: true,
                message: 'Pays mis à jour avec succès',
                data: updatedPays
            });
        } catch (err) {
            console.error('❌ Erreur lors de la mise à jour du pays:', err);
            
            // Gestion d'erreurs plus spécifique
            if (err.message.includes('non trouvé') || err.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: 'Pays non trouvé',
                    error: err.message
                });
            }
            
            if (err.message.includes('validation')) {
                return res.status(400).json({
                    success: false,
                    message: 'Données invalides',
                    error: err.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du pays',
                error: err.message
            });
        }
    },

    // ============================================================================
    // ✅ NOUVEAU : Méthode updatePaysFromBody pour ID dans le body
    // ============================================================================
    async updatePaysFromBody(req, res) {
        try {
            const { id, ...paysData } = req.body; // Extraire l'ID et le reste des données
            
            // Validation de l'ID
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du pays requis dans le body de la requête'
                });
            }

            // Log pour déboguer
            console.log('🔄 Mise à jour du pays avec ID (from body):', id);
            console.log('📝 Données reçues:', paysData);

            // Validation des données
            if (paysData.libelle && paysData.libelle.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Le libellé du pays ne peut pas être vide'
                });
            }

            const updatedPays = await PaysService.updatePays(id, paysData);
            
            console.log('✅ Pays mis à jour avec succès:', updatedPays);
            
            res.status(200).json({
                success: true,
                message: 'Pays mis à jour avec succès',
                data: updatedPays
            });
        } catch (err) {
            console.error('❌ Erreur lors de la mise à jour du pays:', err);
            
            // Gestion d'erreurs plus spécifique
            if (err.message.includes('non trouvé') || err.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: 'Pays non trouvé',
                    error: err.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du pays',
                error: err.message
            });
        }
    },

    // ============================================================================
    // ✅ AMÉLIORÉ : Méthode deletePaysById avec meilleure gestion d'erreurs
    // ============================================================================
    async deletePaysById(req, res) {
        try {
            const paysId = req.params.id;

            // Validation de l'ID
            if (!paysId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID du pays requis'
                });
            }

            console.log('🗑️ Suppression du pays avec ID:', paysId);

            await PaysService.deletePaysById(paysId);
            
            console.log('✅ Pays supprimé avec succès');
            
            res.status(200).json({
                success: true,
                message: 'Pays supprimé avec succès',
            });
        } catch (err) {
            console.error('❌ Erreur lors de la suppression du pays:', err);
            
            // Gestion d'erreurs spécifique
            if (err.message.includes('non trouvé') || err.message.includes('not found')) {
                return res.status(404).json({
                    success: false,
                    message: 'Pays non trouvé',
                    error: err.message
                });
            }
            
            if (err.message.includes('école(s) y sont associées')) {
                return res.status(409).json({
                    success: false,
                    message: 'Impossible de supprimer ce pays car des écoles y sont associées',
                    error: err.message
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du pays',
                error: err.message
            });
        }
    },

    // ============================================================================
    // ✅ NOUVEAU : Méthodes utilitaires supplémentaires
    // ============================================================================

    /**
     * Vérifier si un pays existe par son libellé
     * GET /api/pays/check-libelle/:libelle
     */
    async checkPaysLibelleExists(req, res) {
        try {
            const { libelle } = req.params;
            const pays = await PaysService.getPaysByLibelle(libelle);
            
            return res.status(200).json({
                success: true,
                exists: !!pays,
                data: pays || null
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    },

    /**
     * Récupérer les pays avec leurs écoles
     * GET /api/pays/avec-ecoles
     */
    async getPaysAvecEcoles(req, res) {
        try {
            const pays = await PaysService.getAllPays();
            const paysAvecEcoles = pays.filter(p => p.totalEcoles > 0);
            
            return res.status(200).json({
                success: true,
                message: 'Liste des pays ayant des écoles',
                data: paysAvecEcoles,
                total: paysAvecEcoles.length
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    }
};

module.exports = PaysController;