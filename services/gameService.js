const Planification = require("../models/Planification");
const Participation = require("../models/Participant");
const Participant = require("../models/Participant");
const ReponseApp = require("../models/ReponseApp");

function parseAndFixDate(dateStr, heureStr) {
  const dateFormats = [
    { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, order: ["Y", "M", "D"] }, // ex: 2025/06/23
    { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, order: ["Y", "D", "M"] }, // ex: 2025/23/06 (à corriger)
    { regex: /^(\d{2})\/(\d{2})\/(\d{4})$/, order: ["D", "M", "Y"] }, // ex: 23/06/2025
    { regex: /^(\d{2})-(\d{2})-(\d{4})$/, order: ["D", "M", "Y"] }, // ex: 23-06-2025
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, order: ["Y", "M", "D"] }, // ex: 2025-06-23
  ];

  function isValidDate(y, m, d) {
    y = Number(y);
    m = Number(m);
    d = Number(d);
    if (y < 1900 || y > 3000) return false;
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    return true;
  }

  for (const fmt of dateFormats) {
    const match = dateStr.match(fmt.regex);
    if (!match) continue;

    // Extraire selon l’ordre
    let y, m, d;
    const parts = match.slice(1);
    for (let i = 0; i < 3; i++) {
      if (fmt.order[i] === "Y") y = parts[i];
      else if (fmt.order[i] === "M") m = parts[i];
      else if (fmt.order[i] === "D") d = parts[i];
    }

    // Correction auto : si mois invalide mais jour valide, on inverse mois et jour
    if (!isValidDate(y, m, d)) {
      if (Number(m) > 12 && Number(d) <= 12) {
        // swap m et d
        [m, d] = [d, m];
        if (!isValidDate(y, m, d)) continue; // si toujours invalide, passer au suivant
      } else {
        continue; // invalide, essayer autre format
      }
    }

    // Construire heure
    const [h, min] = heureStr.replace("h", ":").split(":");
    const hh = h.padStart(2, "0");
    const mm = (min || "00").padStart(2, "0");

    const isoStr = `${y}-${m.padStart(2, "0")}-${d.padStart(
      2,
      "0"
    )}T${hh}:${mm}:00`;
    const date = new Date(isoStr);
    if (!isNaN(date.getTime())) return date;
  }

  return null; // pas pu parser
}

function convertFromYMDtoDMY(dateStr) {
  // Suppose toujours dateStr au format "YYYY/MM/DD"
  const [year, day, month] = dateStr.split('/');
  console.log("convertFromYMDtoDMY", dateStr, year, month, day);
  const result = `${day}/${month}/${year}`; //`${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`
  return result;
}

const gameService = {
  async getPlanificationByPin(pin) {
    try {
      // Vérification que 'pin' est un objet avec la propriété 'pin'
      const planification = await Planification.findOne(pin) // Utilisation de l'objet pour chercher par 'pin'
        .exec();

      return planification;
    } catch (error) {
      throw new Error(
        "Erreur lors de la récupération de la planification : " + error.message
      );
    }
  },

  async getPlanificationById(id) {
    try {
      // Vérification que 'pin' est un objet avec la propriété 'pin'
      const planification = await Planification.findById(id) // Utilisation de l'objet pour chercher par 'pin'
        .populate({
          path: "jeu",
          populate: [
            {
              path: "questions",
              populate: [
                {
                  path: "reponses", // Populate des réponses de chaque question
                },

                {
                  path: "typeQuestion", // Populate des réponses de chaque question
                },

                {
                  path: "point", // Populate du champ point pour chaque question
                },
              ],
            },
          ],
        })
        .populate({
          path: "participants",
          populate: [
            {
              path: "apprenant", // Populate de l'apprenant associé au participant
            },
            {
              path: "reponses", // Populate des réponses dans chaque participant
              populate: {
                path: "question",
                populate: [
                  {
                    path: "reponses", // Populate des réponses associées aux questions
                  },

                  {
                    path: "typeQuestion", // Populate des réponses de chaque question
                  },
                  {
                    path: "point",
                  },
                ],
              },
            },
          ],
        })
        .exec();
      return planification;
    } catch (error) {
      throw new Error(
        "Erreur lors de la récupération de la planification : " + error.message
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
      await gameService.addApprenantToPlanification(
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

  async addApprenantToPlanification(apprenantId, planificationId) {
    // Récupérer la planification par ID
    const planification = await Planification.findById(planificationId);
    if (!planification) {
      throw new Error("Planification non trouvée");
    }

    // Vérifie si l'apprenant est déjà dans la planification
    if (planification.participants.includes(apprenantId)) {
      throw new Error("L'apprenant est déjà ajouté à la planification");
    }

    // Vérifie si la limite de participants est atteinte
    if (planification.participants.length >= planification.limite_participant) {
      throw new Error(
        "La limite de participants pour cette planification est atteinte"
      );
    }

    // Vérifie le type de la planification
    if (planification.type === "attribuer") {
      const now = new Date();

      const dateDebut = parseAndFixDate(
        convertFromYMDtoDMY(planification.date_debut),
        planification.heure_debut
      );

      const dateFin = parseAndFixDate(
        convertFromYMDtoDMY(planification.date_fin),
        planification.heure_fin
      );

      console.log(`Date actuelle : ${now}`);
      console.log(`Date de début : ${dateDebut}`);
      console.log(`Date de fin : ${dateFin}`);

      // Vérifier si les dates sont valides
      if (isNaN(dateDebut.getTime())) {
        throw new Error("La date de début est invalide.");
      }
      if (isNaN(dateFin.getTime())) {
        throw new Error("La date de fin est invalide.");
      }

      // Vérifier si la date actuelle est avant la date de début ou après la date de fin
      if (now < dateDebut) {
        throw new Error(
          "La planification n'a pas encore débuté. Veuillez revenir plus tard."
        );
      } else if (now > dateFin) {
        throw new Error("La date de la planification est dépassée.");
      }
    }

    // Ajouter l'ID de l'apprenant au tableau `participants` de la planification
    planification.participants.push(apprenantId);
    await planification.save();

    return planification;
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
