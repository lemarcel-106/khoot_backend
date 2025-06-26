const apprenantService = require('../services/apprenantService');      // ✅ Nom cohérent
const participantService = require('../services/participantService');  // ✅ Import séparé
const jeuService = require('../services/jeuService');

exports.getApprenants = async (req, res) => {
    try {
        // MODIFICATION : Récupérer les données de l'admin connecté avec son école
        const adminData = {
            id: req.user.id,
            role: req.user.role,
            ecole: req.user.ecole
        };
        
        // ✅ CORRIGÉ : Utiliser apprenantService
        const participants = await apprenantService.getAllParticipantService(adminData);
        res.status(200).json({
            success: true,
            message: 'Liste des participants récupérée avec succès',
            data: participants
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.createApprenant = async (req, res) => {
    try {
        const ecoleFromToken = req.user.ecole;
        
        if (!ecoleFromToken) {
            return res.status(400).json({
                success: false,
                message: 'Aucune école assignée à cet administrateur.'
            });
        }

        const apprenantData = { ...req.body };
        delete apprenantData.ecole;
        apprenantData.ecole = ecoleFromToken;

        const reqModified = {
            body: apprenantData,
            file: req.file
        };

        // ✅ CORRIGÉ : Utiliser apprenantService
        const apprenant = await apprenantService.createParticipant(reqModified);
        await apprenantService.addApprenantToEcole(ecoleFromToken, apprenant._id);
        
        res.status(201).json({
            success: true,
            message: 'Apprenant créé avec succès',
            data: apprenant
        });
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({
                success: false,
                message: `Le ${field} existe déjà, veuillez en utiliser un autre.`
            });
        }
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de l\'apprenant',
            error: err.message
        });
    }
};

exports.updateApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        const apprenantData = req.body;

        // ✅ Utiliser apprenantService pour les opérations d'apprenant
        const apprenant = await apprenantService.getApprenantById(apprenantId);
        if (!apprenant) {
            return res.status(404).json({
                success: false,
                message: 'Apprenant non trouvé'
            });
        }

        // Vérifications de permissions...
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        if (req.user.role !== 'super_admin' && apprenantData.ecole) {
            delete apprenantData.ecole;
        }

        // ✅ Utiliser apprenantService pour la mise à jour
        const updatedApprenant = await apprenantService.updateApprenant(apprenantId, apprenantData);
        
        res.status(200).json({
            success: true,
            message: 'Apprenant mis à jour avec succès',
            data: updatedApprenant
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de l\'apprenant',
            error: err.message
        });
    }
};
exports.deleteApprenantById = async (req, res) => {
    try {
        const apprenantId = req.params.id;

        // ✅ CORRIGÉ : Utiliser apprenantService
        const apprenant = await apprenantService.getApprenantById(apprenantId);
        if (!apprenant) {
            return res.status(404).json({
                success: false,
                message: 'Apprenant non trouvé'
            });
        }

        // Vérification des permissions
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        // ✅ CORRIGÉ : Utiliser apprenantService
        await apprenantService.deleteApprenantById(apprenantId);
        res.status(200).json({
            success: true,
            message: 'Apprenant supprimé avec succès',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de l\'apprenant',
            error: err.message
        });
    }
};

exports.getApprenantById = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        
        // ✅ CORRIGÉ : Utiliser apprenantService
        const apprenant = await apprenantService.getApprenantById(apprenantId);
        
        if (!apprenant) {
            return res.status(404).json({ 
                success: false,
                message: 'Apprenant non trouvé' 
            });
        }

        // Vérification des permissions
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Apprenant récupéré avec succès',
            data: apprenant
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

exports.getApprenantByMatricule = async (req, res) => {
    try {
        const matricule = req.body;
        
        // ✅ CORRIGÉ : Utiliser apprenantService
        const apprenant = await apprenantService.getParticipantByMatricule(matricule);
        
        if (!apprenant) {
            return res.status(404).json({ 
                success: false,
                message: 'Apprenant non trouvé' 
            });
        }

        // Vérification des permissions
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Apprenant récupéré avec succès',
            data: apprenant
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false,
            message: error.message 
        });
    }
};

exports.addExistingApprenantToJeu = async (req, res) => {
    try {
        const { jeuId, participantId } = req.body;

        const jeu = await jeuService.getJeuById(jeuId);
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== jeu.ecole.toString()) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Accès refusé à ce jeu' 
                });
            }
        }

        const updatedJeu = await jeuService.addParticipant(jeuId, participantId);
        res.status(200).json({ 
            success: true,
            message: 'Participant ajouté au jeu avec succès', 
            jeu: updatedJeu 
        });
    } catch (error) {
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
};

exports.getSessionsApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        
        if (!apprenantId) {
            return res.status(400).json({
                success: false,
                message: 'ID de l\'apprenant requis'
            });
        }

        // ✅ CORRIGÉ : Utiliser apprenantService pour getApprenantById
        const apprenant = await apprenantService.getApprenantById(apprenantId);
        if (!apprenant) {
            return res.status(404).json({
                success: false,
                message: 'Apprenant non trouvé'
            });
        }

        // Vérifier les permissions d'accès
        if (req.user.role !== 'super_admin') {
            if (!req.user.ecole || req.user.ecole.toString() !== apprenant.ecole._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé à cet apprenant'
                });
            }
        }

        // ✅ CORRIGÉ : Utiliser participantService pour getParticipationsByApprenant
        const sessions = await participantService.getParticipationsByApprenant(apprenantId);

        // Enrichir les données avec des informations de jeu et planification
        const sessionsEnrichies = sessions.map(session => {
            const planification = session.planification;
            const jeu = planification?.jeu;
            
            return {
                sessionId: session._id,
                score: session.score,
                dateParticipation: session.date,
                nombreReponses: session.reponses?.length || 0,
                
                // Informations sur le jeu
                jeu: jeu ? {
                    id: jeu._id,
                    titre: jeu.titre,
                    image: jeu.image,
                    nombreQuestions: jeu.questions?.length || 0,
                    createur: {
                        nom: jeu.createdBy?.nom,
                        prenom: jeu.createdBy?.prenom,
                        email: jeu.createdBy?.email
                    }
                } : null,
                
                // Informations sur la planification/session
                planification: planification ? {
                    id: planification._id,
                    pin: planification.pin,
                    statut: planification.statut,
                    type: planification.type,
                    dateDebut: planification.date_debut,
                    dateFin: planification.date_fin,
                    heureDebut: planification.heure_debut,
                    heureFin: planification.heure_fin,
                    nombreParticipants: planification.participants?.length || 0
                } : null,
                
                // Résumé des performances
                performance: {
                    scoreObtenu: session.score,
                    nombreReponsesCorrectes: session.reponses?.filter(r => r.etat === 1).length || 0,
                    nombreReponsesIncorrectes: session.reponses?.filter(r => r.etat === 0).length || 0,
                    tempsTotal: session.reponses?.reduce((total, r) => total + (r.temps_reponse || 0), 0) || 0
                }
            };
        });

        // Calculer des statistiques globales
        const statsGlobales = {
            totalSessions: sessionsEnrichies.length,
            scoreTotal: sessionsEnrichies.reduce((total, s) => total + s.score, 0),
            scoreMoyen: sessionsEnrichies.length > 0 ? 
                Math.round(sessionsEnrichies.reduce((total, s) => total + s.score, 0) / sessionsEnrichies.length * 100) / 100 : 0,
            sessionsTerminees: sessionsEnrichies.filter(s => s.planification?.statut === 'terminé').length,
            sessionsEnCours: sessionsEnrichies.filter(s => s.planification?.statut === 'en cours').length,
            jeuxJoues: [...new Set(sessionsEnrichies.map(s => s.jeu?.id))].length
        };

        res.status(200).json({
            success: true,
            message: 'Sessions de l\'apprenant récupérées avec succès',
            data: {
                apprenant: {
                    id: apprenant._id,
                    nom: apprenant.nom,
                    prenom: apprenant.prenom,
                    matricule: apprenant.matricule,
                    avatar: apprenant.avatar,
                    ecole: {
                        id: apprenant.ecole._id,
                        nom: apprenant.ecole.libelle,
                        ville: apprenant.ecole.ville
                    }
                },
                sessions: sessionsEnrichies.sort((a, b) => new Date(b.dateParticipation) - new Date(a.dateParticipation)),
                statistiques: statsGlobales
            },
            total: sessionsEnrichies.length,
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Erreur lors de la récupération des sessions:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};

exports.getStatistiquesApprenant = async (req, res) => {
    try {
        const apprenantId = req.params.id;
        
        // ✅ CORRIGÉ : Utiliser participantService pour getParticipationsByApprenant
        const sessions = await participantService.getParticipationsByApprenant(apprenantId);

        if (sessions.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Aucune session trouvée pour cet apprenant',
                data: {
                    statistiques: {
                        totalSessions: 0,
                        scoreTotal: 0,
                        scoreMoyen: 0,
                        totalReponses: 0,
                        reponsesCorrectes: 0,
                        pourcentageReussite: 0,
                        tempsTotal: 0,
                        tempsMoyen: 0
                    }
                }
            });
        }

        // Calculer des statistiques détaillées
        let totalReponses = 0;
        let reponsesCorrectes = 0;
        let tempsTotal = 0;
        let scoreTotal = 0;

        sessions.forEach(session => {
            scoreTotal += session.score;
            
            if (session.reponses) {
                session.reponses.forEach(reponse => {
                    totalReponses++;
                    if (reponse.etat === 1) reponsesCorrectes++;
                    tempsTotal += reponse.temps_reponse || 0;
                });
            }
        });

        // Statistiques par matière/jeu
        const statsParJeu = {};
        sessions.forEach(session => {
            const jeuTitre = session.planification?.jeu?.titre || 'Jeu inconnu';
            if (!statsParJeu[jeuTitre]) {
                statsParJeu[jeuTitre] = {
                    sessions: 0,
                    scoreTotal: 0,
                    reponsesCorrectes: 0,
                    totalReponses: 0
                };
            }
            
            statsParJeu[jeuTitre].sessions++;
            statsParJeu[jeuTitre].scoreTotal += session.score;
            
            if (session.reponses) {
                session.reponses.forEach(reponse => {
                    statsParJeu[jeuTitre].totalReponses++;
                    if (reponse.etat === 1) statsParJeu[jeuTitre].reponsesCorrectes++;
                });
            }
        });

        // Formater les stats par jeu
        const statsParJeuFormatees = Object.entries(statsParJeu).map(([jeu, stats]) => ({
            jeu: jeu,
            sessions: stats.sessions,
            scoreMoyen: stats.sessions > 0 ? Math.round(stats.scoreTotal / stats.sessions * 100) / 100 : 0,
            pourcentageReussite: stats.totalReponses > 0 ? 
                Math.round((stats.reponsesCorrectes / stats.totalReponses) * 100) : 0
        }));

        const statistiques = {
            // Statistiques générales
            totalSessions: sessions.length,
            scoreTotal: scoreTotal,
            scoreMoyen: sessions.length > 0 ? Math.round(scoreTotal / sessions.length * 100) / 100 : 0,
            
            // Statistiques de réponses
            totalReponses: totalReponses,
            reponsesCorrectes: reponsesCorrectes,
            reponsesIncorrectes: totalReponses - reponsesCorrectes,
            pourcentageReussite: totalReponses > 0 ? Math.round((reponsesCorrectes / totalReponses) * 100) : 0,
            
            // Statistiques de temps
            tempsTotal: Math.round(tempsTotal * 100) / 100,
            tempsMoyen: totalReponses > 0 ? Math.round((tempsTotal / totalReponses) * 100) / 100 : 0,
            
            // Répartition par jeu
            performanceParJeu: statsParJeuFormatees,
            
            // Évolution (sessions récentes vs anciennes)
            evolution: {
                dernieresSessions: sessions.slice(0, 5).map(s => ({
                    date: s.date,
                    score: s.score,
                    jeu: s.planification?.jeu?.titre
                }))
            }
        };

        res.status(200).json({
            success: true,
            message: 'Statistiques de l\'apprenant récupérées avec succès',
            data: {
                apprenantId: apprenantId,
                statistiques: statistiques
            },
            timestamp: new Date().toISOString()
        });

    } catch (err) {
        console.error('Erreur lors du calcul des statistiques:', err);
        res.status(500).json({
            success: false,
            message: 'Erreur du serveur',
            error: err.message
        });
    }
};
