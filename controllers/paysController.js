const PaysService = require('../services/paysService');

const PaysController = {
    async createPays(req, res) {
        try {
            const paysData = req.body;
            const pays = await PaysService.createPays(paysData);
            return res.status(200).json({
                success: true,
                message: 'Le pays a ete cree avec success',
                data: pays
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getAllPays(req, res) {
        try {
            const pays = await PaysService.getAllPays();
            return res.status(200).json({
                success: true,
                message: 'La liste de tous les pays',
                data: pays
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getPaysById(req, res) {
        try {
            const paysId = req.params.id;
            const pays = await PaysService.getPaysById(paysId);
            if (!pays) {
                return res.status(404).json({ message: 'Pays non trouvé' });
            }
            return res.status(200).json({
                success: true,
                message: 'Le pays a ete recupere avec success',
                data: pays
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async getPaysByLibelle(req, res) {
        try {
            const { libelle } = req.params;
            const pays = await PaysService.getPaysByLibelle(libelle);
            if (!pays) {
                return res.status(404).json({ message: 'Pays non trouvé avec ce libellé' });
            }
            return res.status(200).json(pays);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async updatePays(req, res) {
        try {
            const paysId = req.params.id;
            const paysData = req.body;
            const updatedPays = await PaysService.updatePays(paysId, paysData);
            res.status(200).json({
                success: true,
                message: 'Pays mis à jour avec succès',
                data: updatedPays
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du pays',
                error: err.message
            });
        }
    },

    async deletePaysById(req, res) {
        try {
            const paysId = req.params.id;
            await PaysService.deletePaysById(paysId);
            res.status(200).json({
                success: true,
                message: 'Pays supprimé avec succès',
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du pays',
                error: err.message
            });
        }
    }

};

module.exports = PaysController;
