const Planification = require("../models/Planification");
const Participation = require("../models/Participant");
const Participant = require("../models/Participant");

const gameService = {
  async getPlanificationsByJeu(jeuId) {
    try {
      return await Planification.find({ jeu: jeuId })
        // .populate('jeu')
        .populate({
          path: "participants", // Populate des participants
          populate: {
            path: "apprenant", // Populate de l'apprenant pour chaque participant
          },
        })
        .exec();
    } catch (error) {
      throw new Error(
        "Erreur lors de la récupération des planifications : " + error.message
      );
    }
  },

  async createParticipation(participationData) {
    try {
      const { apprenant, planification } = participationData;

      // Création de la participation
      const newParticipation = new Participation(participationData);
      //ajout dun avatar par défaut si l'apprenant n'en a pas
      if (!newParticipation.apprenant.avatar) {
        newParticipation.apprenant.avatar =
          "https://static.vecteezy.com/system/resources/previews/023/246/275/non_2x/university-avatar-icon-illustration-vector.jpg";
      }
      const savedParticipation = await newParticipation.save();

      // Ajout de l'apprenant à la planification
      await ParticipationService.addApprenantToPlanification(
        savedParticipation._id,
        planification
      );

      return savedParticipation;
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        throw new Error(`Le champ '${field}' existe déjà.`);
      } else {
        throw new Error(
          "Erreur lors de la création du participant : " + error.message
        );
      }
    }
  },

  async createReponseApp(userData) {
    try {
      // 1. Créer une nouvelle réponse dans ReponseApp
      const newReponseApp = new ReponseApp(userData);
      const savedReponseApp = await newReponseApp.save();

      // 2. Récupérer le participant concerné par la réponse
      const participant = await Participant.findById(userData.participant);
      if (!participant) {
        throw new Error("Participant non trouvé");
      }

      // 3. Ajouter l'ID de la réponse dans le tableau `reponses` du participant
      participant.reponses.push(savedReponseApp._id);

      // 4. Sauvegarder le participant mis à jour
      await participant.save();

      // Retourner la réponse créée
      return savedReponseApp;
    } catch (error) {
      throw new Error(
        "Erreur lors de la création de la réponse : " + error.message
      );
    }
  },

  async getParticipationById(participationId) {
    try {
      return await Participation.findById(participationId)
        .populate("apprenant")
        .populate({
          path: "reponses",
          populate: {
            path: "question",
          },
        });
    } catch (error) {
      throw new Error(
        "Erreur lors de la récupération de la participation ah ah : " +
          error.message
      );
    }
  },

  async updateParticipant(participantId, participantData) {
    try {
      console.log(participantData, participantId);
      const updatedParticipant = await Participation.findByIdAndUpdate(
        participantId,
        { $set: participantData },
        { new: true, runValidators: true }
      );
      if (!updatedParticipant) {
        throw new Error("Participant non trouvé");
      }
      return updatedParticipant;
    } catch (error) {
      throw new Error(
        "Erreur lors de la mise à jour du participant : " + error.message
      );
    }
  },
};

module.exports = gameService;
