const abonnementService = require('../services/abonnementService');

const abonnementController = {
  async create(req, res) {
    try {
      const abonnement = await abonnementService.create(req.body);
      res.status(201).json({ success: true, data: abonnement });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const abonnements = await abonnementService.getAll();
      res.status(200).json({ success: true, data: abonnements });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async getById(req, res) {
    try {
      const abonnement = await abonnementService.getById(req.params.id);
      if (!abonnement)
        return res.status(404).json({ success: false, message: 'Abonnement non trouvé' });

      res.json({ success: true, data: abonnement });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async update(req, res) {
    try {
      const abonnement = await abonnementService.update(req.params.id, req.body);
      res.json({ success: true, data: abonnement });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async remove(req, res) {
    try {
      await abonnementService.remove(req.params.id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  async renouvelerAbonnement(req, res) {
    try {
      const ecoleId = req.params.id;
      const { abonnementId, dureeEnJours } = req.body;

      const result = await EcoleService.renouvelerAbonnement(ecoleId, abonnementId, dureeEnJours);
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

};

module.exports = abonnementController;
