const authService = require("../services/authService");
const gameService = require("../services/gameService");

const gameController = {
  async getPlanificationByPin(req, res) {
    try {
      const pin = req.body;
      const planification = await gameService.getPlanificationByPin(pin);
      if (!planification) {
        return res.status(404).json({ message: "Planification non trouvée" });
      }
      return res.status(200).json(planification);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async loginParticipant(req, res) {
    const { matricule } = req.body;
    if (!matricule) {
      return res.status(400).json({ message: "Matricule requis." });
    }
    return this.handleLogin(res, authService.loginApprenant, matricule);
  },

  async createParticipation(req, res) {
    try {
      const participationData = req.body;
      const participation = await gameService.createParticipation(
        participationData
      );
      return res.status(201).json(participation);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async createReponseApp(req, res) {
    try {
      const pointApp = await gameService.createReponseApp(req.body);
      res.status(201).json({
        success: true,
        message: "Reponse apprenant créé avec succès",
        data: pointApp,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la création de la reponse",
        error: err.message,
      });
    }
  },

  async getParticipationById(req, res) {
    try {
      const participationId = req.params.id;
      const participation = await gameService.getParticipationById(
        participationId
      );
      if (!participation) {
        return res.status(404).json({ message: "Participation non trouvée" });
      }
      return res.status(200).json(participation);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async updateParticipant(req, res) {
    try {
      const participantId = req.params.id;
      const participantData = req.body;
      const updatedParticipant = await gameService.updateParticipant(
        participantId,
        participantData
      );
      res.status(200).json({
        success: true,
        message: "Participant mis à jour avec succès",
        data: updatedParticipant,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Erreur lors de la mise à jour du participant",
        error: err.message,
      });
    }
  },

  // Fonction utilitaire générique
  handleLogin: async (res, loginFn, ...params) => {
    try {
      const result = await loginFn(...params);

      if (!result.token) {
        return res.status(400).json({ message: result.message });
      }

      return res.json(result);
    } catch (error) {
      console.error("Erreur dans handleLogin:", error);
      return res.status(500).json({ message: "Erreur du serveur" });
    }
  },
};

module.exports = gameController;
