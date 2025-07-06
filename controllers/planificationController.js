const PlanificationService = require('../services/planificationService');

const PlanificationController = {


/**
 * Récupérer les statistiques détaillées d'une planification
 */
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

/**
 * Exporter les résultats d'une planification en CSV
 */
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


    async createPlanification(req, res) {
        try {
            const planificationData = req.body;
            const planification = await PlanificationService.createPlanification(planificationData);
            return res.status(201).json({
                success: true,
                message: 'Planification créé avec succès',
                data: planification
            });
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },


    // Méthode à ajouter dans controllers/planificationController.js
    async getStatistiquesDetaillees(req, res) {
        try {
            const { id } = req.params;
            const currentUser = req.user;

            const stats = await PlanificationService.getStatistiquesCompletes(id, currentUser);
            
            res.status(200).json({
                success: true,
                data: {
                    planification: {
                        id: stats.planification.id,
                        pin: stats.planification.pin,
                        statut: stats.planification.statut,
                        jeu: stats.planification.jeu
                    },
                    participants: {
                        total: stats.participants.total,
                        taux_participation: stats.participants.tauxParticipation,
                        score_moyen: stats.participants.scoreMoyen,
                        temps_moyen: stats.participants.tempsMoyen
                    },
                    questions: stats.questions.map(q => ({
                        libelle: q.libelle,
                        bonnes_reponses: q.bonnesReponses,
                        taux_reussite: q.tauxReussite,
                        temps_moyen_reponse: q.tempsMoyenReponse
                    })),
                    classement: stats.classement
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },
 // Dans controllers/planificationController.js
// Remplacer la méthode getPlanificationsByJeu existante

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
                planificationsActives: cleanedPlanifications.filter(p => p.statut === 'en cours').length,
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
    
    async getPlanificationByPin(req, res) {
        try {
            const pin = req.body;
            const planification = await PlanificationService.getPlanificationByPin(pin);
            if (!planification) {
                return res.status(404).json({ message: 'Planification non trouvée' });
            }
            return res.status(200).json(planification);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async addExistingParticipantToPlan(req, res) {
        try {
            const { planificationId, participantId } = req.body;
            const updatedJeu = await PlanificationService.addParticipant(planificationId, participantId);
            res.status(200).json({ message: 'Participant ajouté a la planification avec succès', jeu: updatedJeu });
        } catch (error) {
            // Gestion des erreurs avec un message adapté
            res.status(400).json({ message: error.message });
        }
    },

    async updatePlanification(req, res) {
        try {
            const planificationId = req.params.id;
            const planificationData = req.body;
            const updatedPlanification = await PlanificationService.updatePlanification(planificationId, planificationData);
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
    
     async getPlanificationById(req, res) {
        const { id } = req.params;

        try {
            const pin = req.body;
            const planification = await PlanificationService.getPlanificationById(id);
            if (!planification) {
                return res.status(404).json({ message: 'Planification non trouvée' });
            }
            return res.status(200).json(planification);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    },

    async deletePlanificationById(req, res) {
        try {
            const planificationId = req.params.id;
            await PlanificationService.deletePlanificationById(planificationId);
            res.status(200).json({
                success: true,
                message: 'Planification supprimée avec succès',
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de la planification',
                error: err.message
            });
        }
    }
};

module.exports = PlanificationController;
