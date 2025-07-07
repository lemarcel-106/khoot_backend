const PlanificationService = require('../services/planificationService');
const logger = require('../logger');

const PlanificationController = {

    // ✅ MÉTHODE MISE À JOUR : Création d'une planification avec validation
    async createPlanification(req, res) {
        try {
            const {
                date_debut,
                date_fin,
                heure_debut,
                heure_fin,
                limite_participant,
                type,
                jeu
            } = req.body;

            // ✅ Validation des données avant d'appeler le service
            if (!date_debut || !date_fin || !heure_debut || !heure_fin || !limite_participant || !type || !jeu) {
                return res.status(400).json({
                    success: false,
                    message: 'Tous les champs sont requis',
                    champsRequis: ['date_debut', 'date_fin', 'heure_debut', 'heure_fin', 'limite_participant', 'type', 'jeu']
                });
            }

            // ✅ Validation du type
            if (!['Examen', 'Live'].includes(type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Le type doit être "Examen" ou "Live"'
                });
            }

            // ✅ Validation du format des dates (YYYY/MM/DD)
            const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
            if (!dateRegex.test(date_debut) || !dateRegex.test(date_fin)) {
                return res.status(400).json({
                    success: false,
                    message: 'Le format des dates doit être YYYY/MM/DD'
                });
            }

            // ✅ Validation du format des heures (HHhMM)
            const heureRegex = /^\d{2}h\d{2}$/;
            if (!heureRegex.test(heure_debut) || !heureRegex.test(heure_fin)) {
                return res.status(400).json({
                    success: false,
                    message: 'Le format des heures doit être HHhMM (ex: 08h00)'
                });
            }

            // ✅ Validation de l'ordre des dates
            const dateDebutObj = new Date(date_debut.replace(/\//g, '-'));
            const dateFinObj = new Date(date_fin.replace(/\//g, '-'));
            
            if (dateFinObj < dateDebutObj) {
                return res.status(400).json({
                    success: false,
                    message: 'La date de fin ne peut pas être antérieure à la date de début'
                });
            }

            // ✅ Validation de la limite de participants
            if (limite_participant < 1 || limite_participant > 1000) {
                return res.status(400).json({
                    success: false,
                    message: 'La limite de participants doit être entre 1 et 1000'
                });
            }

            // ✅ Appel du service avec les données validées
            const planification = await PlanificationService.createPlanification(req.body);
            
            logger.info(`Nouvelle planification créée: ${planification._id} - PIN: ${planification.pin}`);

            return res.status(201).json({
                success: true,
                message: 'Planification créée avec succès',
                data: {
                    planification,
                    pin: planification.pin
                }
            });
        } catch (error) {
            logger.error('Erreur lors de la création de la planification:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Erreur lors de la création de la planification',
                error: error.message 
            });
        }
    },

    // ✅ NOUVELLE MÉTHODE : Terminer une planification
    async terminerPlanification(req, res) {
        try {
            const { id } = req.params;

            // ✅ Vérifier que l'ID est fourni
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de planification requis'
                });
            }

            // ✅ Appel du service pour terminer la planification
            const planification = await PlanificationService.terminerPlanification(id);

            logger.info(`Planification terminée: ${id} - PIN: ${planification.pin}`);

            res.status(200).json({
                success: true,
                message: 'Planification terminée avec succès',
                data: {
                    planification: planification,
                    nouveauStatut: 'terminé'
                }
            });

        } catch (error) {
            logger.error('Erreur lors de la finalisation de la planification:', error);
            
            // ✅ Gestion spécifique des erreurs du service
            if (error.message === 'Planification non trouvée') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.message === 'Cette planification est déjà terminée') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Erreur lors de la finalisation de la planification',
                error: error.message
            });
        }
    },

    // ✅ MÉTHODE EXISTANTE AMÉLIORÉE : Ajouter un participant avec gestion automatique du statut
    async addExistingParticipantToPlan(req, res) {
        try {
            const { planificationId, participantId } = req.body;

            // ✅ Validation des données
            if (!planificationId || !participantId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de planification et ID de participant requis'
                });
            }

            // ✅ Appel du service avec gestion automatique du statut
            const result = await PlanificationService.addParticipantAvecStatut(planificationId, participantId);
            
            logger.info(`Participant ${participantId} ajouté à la planification ${planificationId}${
                result.changementStatut ? ` - Statut changé: ${result.ancienStatut} → ${result.nouveauStatut}` : ''
            }`);

            res.status(200).json({ 
                success: true,
                message: 'Participant ajouté à la planification avec succès', 
                data: {
                    planification: result.planification,
                    changementStatut: result.changementStatut,
                    ancienStatut: result.ancienStatut,
                    nouveauStatut: result.nouveauStatut,
                    nombreParticipants: result.nombreParticipants,
                    limiteParticipants: result.limiteParticipants
                }
            });
        } catch (error) {
            logger.error('Erreur lors de l\'ajout du participant:', error);
            
            // ✅ Gestion spécifique des erreurs
            if (error.message.includes('non trouvée') || error.message.includes('non trouvé')) {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            
            if (error.message.includes('limite') || error.message.includes('terminée')) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({ 
                success: false,
                message: 'Erreur lors de l\'ajout du participant',
                error: error.message 
            });
        }
    },

    // ✅ MÉTHODE EXISTANTE GARDÉE
    async getPlanificationByPin(req, res) {
        try {
            const pin = req.body;
            const planification = await PlanificationService.getPlanificationByPin(pin);
            if (!planification) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Planification non trouvée' 
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Planification trouvée',
                data: planification
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    },

    // ✅ MÉTHODE EXISTANTE GARDÉE ET AMÉLIORÉE
    async getPlanificationById(req, res) {
        const { id } = req.params;

        try {
            const planification = await PlanificationService.getPlanificationById(id);
            if (!planification) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Planification non trouvée' 
                });
            }
            return res.status(200).json({
                success: true,
                message: 'Planification trouvée',
                data: planification
            });
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: error.message 
            });
        }
    },

    // ✅ MÉTHODE EXISTANTE GARDÉE
    async getPlanificationsByJeu(req, res) {
        try {
            const jeuId = req.params.id;
            
            // ✅ VALIDATION : Vérifier que l'ID du jeu est fourni
            if (!jeuId) {
                return res.status(400).json({
                    success: false,
                    message: "L'ID du jeu est requis"
                });
            }
            
            // ✅ VALIDATION : Vérifier que le jeu existe
            const Jeu = require('../models/Jeu');
            const jeuExists = await Jeu.findById(jeuId);
            if (!jeuExists) {
                return res.status(404).json({
                    success: false,
                    message: "Jeu non trouvé"
                });
            }
            
            // Récupérer les planifications
            const planifications = await PlanificationService.getPlanificationsByJeu(jeuId);
            
            // ✅ CORRECTION : Valider et nettoyer les données
            const cleanedPlanifications = await PlanificationService.validateAndCleanPlanifications(planifications);
            
            // ✅ AMÉLIORATION : Ajouter des statistiques
            const stats = {
                totalPlanifications: cleanedPlanifications.length,
                planificationsActives: cleanedPlanifications.filter(p => p.statut === 'en-cours').length,
                planificationsEnAttente: cleanedPlanifications.filter(p => p.statut === 'en-attente').length,
                planificationsTerminees: cleanedPlanifications.filter(p => p.statut === 'terminé').length,
                totalParticipants: cleanedPlanifications.reduce((total, p) => total + (p.participants?.length || 0), 0)
            };
            
            return res.status(200).json({
                success: true,
                message: `${cleanedPlanifications.length} planification(s) récupérée(s) avec succès`,
                data: cleanedPlanifications,
                statistiques: stats,
                jeu: {
                    id: jeuExists._id,
                    titre: jeuExists.titre
                },
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Erreur getPlanificationsByJeu:', error);
            return res.status(500).json({ 
                success: false,
                message: 'Erreur du serveur',
                error: error.message 
            });
        }
    },

    // ✅ MÉTHODE EXISTANTE GARDÉE
    async updatePlanification(req, res) {
        try {
            const planificationId = req.params.id;
            const planificationData = req.body;

            // ✅ Validation du type si modifié
            if (planificationData.type && !['Examen', 'Live'].includes(planificationData.type)) {
                return res.status(400).json({
                    success: false,
                    message: 'Le type doit être "Examen" ou "Live"'
                });
            }

            // ✅ Validation du statut si modifié
            if (planificationData.statut && !['en-attente', 'en-cours', 'terminé'].includes(planificationData.statut)) {
                return res.status(400).json({
                    success: false,
                    message: 'Le statut doit être "en-attente", "en-cours" ou "terminé"'
                });
            }

            const updatedPlanification = await PlanificationService.updatePlanification(planificationId, planificationData);
            
            logger.info(`Planification mise à jour: ${planificationId}`);

            res.status(200).json({
                success: true,
                message: 'Planification mise à jour avec succès',
                data: updatedPlanification
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de la planification',
                error: err.message
            });
        }
    },

    // ✅ MÉTHODE EXISTANTE GARDÉE
    async deletePlanificationById(req, res) {
        try {
            const planificationId = req.params.id;
            const result = await PlanificationService.deletePlanificationById(planificationId);
            
            logger.info(`Planification supprimée: ${planificationId}`);

            res.status(200).json({
                success: true,
                message: 'Planification supprimée avec succès',
                data: result
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la planification',
                error: err.message
            });
        }
    },

    // ✅ MÉTHODES EXISTANTES POUR LES STATISTIQUES (GARDÉES)
    async getStatistiquesDetaillees(req, res) {
        try {
            const { id } = req.params;
            const currentUser = req.user;

            // Récupérer la planification avec tous les détails
            const Planification = require('../models/Planification');
            const planification = await Planification.findById(id)
                .populate({
                    path: 'jeu',
                    populate: [
                        {
                            path: 'questions',
                            populate: {
                                path: 'reponses'
                            }
                        },
                        {
                            path: 'createdBy',
                            select: 'nom prenom email'
                        }
                    ]
                })
                .populate({
                    path: 'participants',
                    populate: [
                        {
                            path: 'apprenant',
                            select: 'nom prenom pseudonyme matricule'
                        },
                        {
                            path: 'reponses',
                            populate: {
                                path: 'question'
                            }
                        }
                    ]
                });

            if (!planification) {
                return res.status(404).json({
                    success: false,
                    message: 'Planification non trouvée'
                });
            }

            // Vérifications des permissions
            if (currentUser.role === 'enseignant') {
                if (planification.jeu?.createdBy?._id?.toString() !== currentUser.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Cette planification ne vous appartient pas.'
                    });
                }
            } else if (currentUser.role === 'admin') {
                if (planification.jeu?.createdBy?.ecole?.toString() !== currentUser.ecole?.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Cette planification n\'appartient pas à votre école.'
                    });
                }
            }

            // Calculer les statistiques des participants
            const participants = planification.participants || [];
            const totalParticipants = participants.length;
            
            let scoreMoyen = 0;
            let tempsMoyen = 0;
            
            if (totalParticipants > 0) {
                const totalScore = participants.reduce((sum, p) => sum + (p.score || 0), 0);
                scoreMoyen = Math.round(totalScore / totalParticipants);

                // Calculer le temps moyen des réponses
                const reponses = participants.flatMap(p => p.reponses || []);
                if (reponses.length > 0) {
                    const totalTemps = reponses.reduce((sum, r) => sum + (r.temps_reponse || 0), 0);
                    tempsMoyen = Math.round(totalTemps / reponses.length);
                }
            }

            // Calculer les statistiques par question
            const questions = planification.jeu?.questions || [];
            const statistiquesQuestions = questions.map(question => {
                const reponsesQuestion = participants.flatMap(p => 
                    (p.reponses || []).filter(r => r.question?.toString() === question._id.toString())
                );

                const bonnesReponses = reponsesQuestion.filter(r => r.etat === 1).length;
                const totalReponses = reponsesQuestion.length;
                const tauxReussite = totalReponses > 0 ? Math.round((bonnesReponses / totalReponses) * 100) : 0;
                
                const tempsMoyenQuestion = totalReponses > 0 
                    ? Math.round(reponsesQuestion.reduce((sum, r) => sum + (r.temps_reponse || 0), 0) / totalReponses)
                    : 0;

                return {
                    questionId: question._id,
                    libelle: question.libelle,
                    totalReponses: totalReponses,
                    bonnesReponses: bonnesReponses,
                    mauvaisesReponses: totalReponses - bonnesReponses,
                    tauxReussite: tauxReussite,
                    tempsMoyenReponse: tempsMoyenQuestion
                };
            });

            // Créer le classement des participants
            const classement = participants
                .map(participant => ({
                    rang: 0, // sera calculé après le tri
                    apprenant: {
                        id: participant.apprenant?._id,
                        nom: participant.apprenant?.nom,
                        prenom: participant.apprenant?.prenom,
                        pseudonyme: participant.apprenant?.pseudonyme,
                        matricule: participant.apprenant?.matricule
                    },
                    score: participant.score || 0,
                    nombreReponses: participant.reponses?.length || 0,
                    bonnesReponses: participant.reponses?.filter(r => r.etat === 1).length || 0,
                    tempsMoyen: participant.reponses?.length > 0 
                        ? Math.round(participant.reponses.reduce((sum, r) => sum + (r.temps_reponse || 0), 0) / participant.reponses.length)
                        : 0
                }))
                .sort((a, b) => b.score - a.score) // Trier par score décroissant
                .map((participant, index) => ({
                    ...participant,
                    rang: index + 1
                }));

            // Calculer le taux de participation par rapport à la limite
            const tauxParticipation = planification.limite_participant > 0 
                ? Math.round((totalParticipants / planification.limite_participant) * 100)
                : 100;

            res.status(200).json({
                success: true,
                message: 'Statistiques détaillées récupérées avec succès',
                data: {
                    planification: {
                        id: planification._id,
                        pin: planification.pin,
                        statut: planification.statut,
                        type: planification.type,
                        date_debut: planification.date_debut,
                        date_fin: planification.date_fin,
                        heure_debut: planification.heure_debut,
                        heure_fin: planification.heure_fin,
                        limite_participant: planification.limite_participant,
                        jeu: {
                            id: planification.jeu?._id,
                            titre: planification.jeu?.titre,
                            createur: planification.jeu?.createdBy
                        }
                    },
                    
                    participants: {
                        total: totalParticipants,
                        limite: planification.limite_participant,
                        taux_participation: tauxParticipation,
                        score_moyen: scoreMoyen,
                        temps_moyen: tempsMoyen
                    },

                    questions: statistiquesQuestions,
                    
                    classement: classement.slice(0, 10), // Top 10
                    
                    resume: {
                        jeu_termine: planification.statut === 'terminé',
                        nombre_questions: questions.length,
                        taux_reussite_global: statistiquesQuestions.length > 0 
                            ? Math.round(statistiquesQuestions.reduce((sum, q) => sum + q.tauxReussite, 0) / statistiquesQuestions.length)
                            : 0,
                        duree_moyenne_jeu: tempsMoyen * questions.length
                    },

                    metadata: {
                        date_generation: new Date().toISOString(),
                        genere_par: {
                            id: currentUser.id,
                            email: currentUser.email,
                            role: currentUser.role
                        }
                    }
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques',
                error: error.message
            });
        }
    },

    // ✅ MÉTHODE EXISTANTE POUR L'EXPORT CSV (GARDÉE)
    async exportResultatsCSV(req, res) {
        try {
            const { id } = req.params;
            const currentUser = req.user;

            // Récupérer la planification avec tous les détails
            const Planification = require('../models/Planification');
            const planification = await Planification.findById(id)
                .populate({
                    path: 'jeu',
                    populate: [
                        {
                            path: 'questions',
                            populate: {
                                path: 'reponses'
                            }
                        },
                        {
                            path: 'createdBy',
                            select: 'nom prenom email'
                        }
                    ]
                })
                .populate({
                    path: 'participants',
                    populate: [
                        {
                            path: 'apprenant',
                            select: 'nom prenom pseudonyme matricule'
                        },
                        {
                            path: 'reponses',
                            populate: {
                                path: 'question'
                            }
                        }
                    ]
                });

            if (!planification) {
                return res.status(404).json({
                    success: false,
                    message: 'Planification non trouvée'
                });
            }

            // Vérifications des permissions (même logique que getStatistiquesDetaillees)
            if (currentUser.role === 'enseignant') {
                if (planification.jeu?.createdBy?._id?.toString() !== currentUser.id) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Cette planification ne vous appartient pas.'
                    });
                }
            } else if (currentUser.role === 'admin') {
                if (planification.jeu?.createdBy?.ecole?.toString() !== currentUser.ecole?.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Cette planification n\'appartient pas à votre école.'
                    });
                }
            }

            // Préparer les données CSV
            const participants = planification.participants || [];
            const questions = planification.jeu?.questions || [];
            
            // En-têtes CSV
            let csvContent = 'Rang,Nom,Prénom,Pseudonyme,Matricule,Score Total,Bonnes Réponses,Temps Total (s)';
            
            // Ajouter une colonne pour chaque question
            questions.forEach((question, index) => {
                csvContent += `,Q${index + 1} Réponse,Q${index + 1} Correct,Q${index + 1} Temps`;
            });
            csvContent += '\n';

            // Créer le classement
            const classement = participants
                .map(participant => {
                    const bonnesReponses = participant.reponses?.filter(r => r.etat === 1).length || 0;
                    const tempsTotal = participant.reponses?.reduce((sum, r) => sum + (r.temps_reponse || 0), 0) || 0;
                    
                    return {
                        participant,
                        score: participant.score || 0,
                        bonnesReponses,
                        tempsTotal
                    };
                })
                .sort((a, b) => b.score - a.score);

            // Ajouter les données de chaque participant
            classement.forEach((item, index) => {
                const p = item.participant;
                const apprenant = p.apprenant || {};
                
                let ligne = `${index + 1},"${apprenant.nom || ''}","${apprenant.prenom || ''}","${apprenant.pseudonyme || ''}","${apprenant.matricule || ''}",${item.score},${item.bonnesReponses},${item.tempsTotal}`;
                
                // Ajouter les réponses pour chaque question
                questions.forEach(question => {
                    const reponse = p.reponses?.find(r => r.question?.toString() === question._id.toString());
                    if (reponse) {
                        ligne += `,"${reponse.reponse_apprenant || ''}",${reponse.etat === 1 ? 'Oui' : 'Non'},${reponse.temps_reponse || 0}`;
                    } else {
                        ligne += ',"","Non",0';
                    }
                });
                
                csvContent += ligne + '\n';
            });

            // Définir les en-têtes de réponse pour le téléchargement
            const filename = `resultats_${planification.jeu?.titre?.replace(/[^a-zA-Z0-9]/g, '_')}_${planification.pin}.csv`;
            
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Cache-Control', 'no-cache');
            
            // Ajouter le BOM UTF-8 pour Excel
            res.write('\ufeff');
            res.write(csvContent);
            res.end();

        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'export CSV',
                error: error.message
            });
        }
    },


    async getAllPlanifications(req, res) {
    try {
        const currentUser = req.user;
        
        // Appel du service
        const result = await PlanificationService.getAllPlanifications(currentUser);
        
        res.status(200).json({
            success: true,
            message: `${result.planifications.length} planification(s) récupérée(s) avec succès`,
            data: result.planifications,
            statistiques: result.statistiques,
            permissions: result.permissions,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Erreur lors de la récupération des planifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des planifications',
            error: error.message
        });
    }
}

};

module.exports = PlanificationController;