const AdminService = require('../services/adminService');
const generateMatricule = require('../utils/generateMatriculeAdmin');
const bcrypt = require('bcryptjs');



// ✅ FONCTION HELPER POUR TROUVER L'ENSEIGNANT LE PLUS ACTIF
async function getMostActiveTeacher(enseignants) {
    try {
        let mostActive = null;
        let maxJeux = 0;

        for (const enseignant of enseignants) {
            const jeux = await AdminService.getJeuxParEnseignant(enseignant._id);
            if (jeux.length > maxJeux) {
                maxJeux = jeux.length;
                mostActive = {
                    nom: enseignant.nom,
                    prenom: enseignant.prenom,
                    jeuxCrees: jeux.length
                };
            }
        }

        return mostActive;
    } catch (error) {
        console.error('Erreur getMostActiveTeacher:', error);
        return null;
    }
}


const AdminController = {
  
    /**
     * ✅ CRÉATION D'ADMIN AVEC GESTION DES RÔLES CORRIGÉE - VERSION AMÉLIORÉE
     */
    async createAdmin(req, res) {
        try {
            // ✅ VÉRIFICATION : S'assurer que req.user existe
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié. Token manquant ou invalide.'
                });
            }

            const adminData = req.body;
            const currentUser = req.user;

            console.log('=== CRÉATION D\'UTILISATEUR ===');
            console.log('Utilisateur connecté:', {
                id: currentUser.id,
                role: currentUser.role,
                email: currentUser.email,
                ecole: currentUser.ecole
            });
            console.log('Données reçues:', {
                role: adminData.role,
                email: adminData.email,
                ecole: adminData.ecole
            });

            // ✅ RÈGLE 1 : Les enseignants ne peuvent pas créer d'admin
            if (currentUser.role === 'enseignant') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Les enseignants ne peuvent pas créer d\'administrateurs.'
                });
            }

            // ✅ RÈGLE 2 : Validation du rôle à créer selon l'utilisateur connecté
            const roleACreer = adminData.role;
            
            if (currentUser.role === 'admin') {
                // Les admins ne peuvent créer que des enseignants
                if (roleACreer !== 'enseignant') {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Les admins ne peuvent créer que des enseignants.',
                        roleAutorise: 'enseignant',
                        roleRecu: roleACreer
                    });
                }
                
                // ✅ RÈGLE 3 : L'école est automatiquement celle de l'admin connecté
                if (!currentUser.ecole) {
                    return res.status(400).json({
                        success: false,
                        message: 'Erreur : L\'admin connecté n\'a pas d\'école assignée.'
                    });
                }
                
                adminData.ecole = currentUser.ecole;
                console.log('École automatiquement assignée (admin):', currentUser.ecole);
                
            } else if (currentUser.role === 'super_admin') {
                // ✅ Les super_admins peuvent créer admin, enseignant, ET super_admin
                const rolesAutorises = ['admin', 'enseignant', 'super_admin'];
                
                if (!rolesAutorises.includes(roleACreer)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Les rôles autorisés sont : admin, enseignant, super_admin.',
                        rolesAutorises: rolesAutorises,
                        roleRecu: roleACreer
                    });
                }
                
                // ✅ LOGIQUE CORRIGÉE : École selon le rôle cible
                if (roleACreer === 'super_admin') {
                    // ✅ Les super_admin n'ont PAS d'école (utilisateurs système)
                    if (adminData.ecole) {
                        console.log('École spécifiée pour super_admin ignorée (utilisateur système)');
                        delete adminData.ecole; // Supprimer l'école
                    }
                } else if (roleACreer === 'admin' || roleACreer === 'enseignant') {
                    // ✅ Les admin et enseignant DOIVENT avoir une école
                    if (!adminData.ecole) {
                        return res.status(400).json({
                            success: false,
                            message: 'L\'école est obligatoire pour les admins et enseignants.',
                            details: 'Vous devez spécifier l\'ID de l\'école pour l\'utilisateur à créer.',
                            roleCible: roleACreer
                        });
                    }

                    // ✅ Vérifier que l'ID de l'école est valide (ObjectId)
                    const mongoose = require('mongoose');
                    if (!mongoose.Types.ObjectId.isValid(adminData.ecole)) {
                        return res.status(400).json({
                            success: false,
                            message: 'L\'ID de l\'école fourni n\'est pas valide',
                            ecoleRecu: adminData.ecole
                        });
                    }

                    // ✅ Vérifier que l'école existe dans la base de données
                    const Ecole = require('../models/Ecole');
                    const ecoleExists = await Ecole.findById(adminData.ecole);
                    if (!ecoleExists) {
                        return res.status(404).json({
                            success: false,
                            message: 'L\'école spécifiée n\'existe pas',
                            ecoleId: adminData.ecole
                        });
                    }
                    
                    console.log('École spécifiée par super_admin:', adminData.ecole);
                    console.log('École trouvée:', ecoleExists.libelle);
                }
                
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Rôle non autorisé pour cette action.',
                    roleUtilisateur: currentUser.role
                });
            }

            // ✅ VALIDATION DES CHAMPS REQUIS
            const requiredFields = ['nom', 'prenom', 'genre', 'statut', 'phone', 'email', 'password', 'adresse', 'role'];
            const missingFields = requiredFields.filter(field => 
                !adminData[field] || (typeof adminData[field] === 'string' && adminData[field].trim() === '')
            );
            
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Certains champs sont manquants ou vides',
                    champsManquants: missingFields,
                    roleUtilisateur: currentUser.role,
                    roleCible: roleACreer
                });
            }

            // ✅ GÉNÉRATION DU MATRICULE
            try {
                adminData.matricule = await generateMatricule(adminData.ecole);
                console.log('Matricule généré:', adminData.matricule);
            } catch (error) {
                console.error('Erreur génération matricule:', error);
                return res.status(400).json({
                    success: false,
                    message: `Erreur lors de la génération du matricule: ${error.message}`
                });
            }

            // ✅ Le pays sera automatiquement récupéré depuis l'école dans le service
            if (!adminData.pays) {
                console.log('Pays automatiquement récupéré depuis l\'école...');
            }

            console.log('Données finales pour création:', {
                role: adminData.role,
                email: adminData.email,
                ecole: adminData.ecole,
                matricule: adminData.matricule
            });

            // ✅ CRÉATION DE L'ADMIN VIA LE SERVICE
            const admin = await AdminService.createAdmin(adminData);
            
            console.log('Utilisateur créé avec succès:', {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                ecole: admin.ecole
            });
            
            return res.status(201).json({
                success: true,
                message: `${roleACreer} créé avec succès`,
                data: {
                    id: admin._id,
                    nom: admin.nom,
                    prenom: admin.prenom,
                    email: admin.email,
                    matricule: admin.matricule,
                    role: admin.role,
                    ecole: admin.ecole,
                    statut: admin.statut,
                    dateCreation: admin.date
                    // Ne pas retourner le mot de passe
                },
                createdBy: {
                    id: currentUser.id,
                    email: currentUser.email,
                    role: currentUser.role
                }
            });

        } catch (err) {
            console.error('Erreur lors de la création de l\'admin:', err);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'admin',
                error: err.message
            });
        }
    },

    async getAllAdmin(req, res) {
        try {
            const currentUser = req.user;
            let admins;

            if (currentUser.role === 'super_admin') {
                // Les super_admins peuvent voir tous les admins
                admins = await AdminService.getAllAdmin();
            } else if (currentUser.role === 'admin') {
                // Les admins ne peuvent voir que les enseignants de leur école
                admins = await AdminService.getAdminsByEcole(currentUser.ecole);
                admins = admins.filter(admin => admin.role === 'enseignant');
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Privilèges insuffisants.'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Admins récupérés avec succès',
                data: admins
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des admins',
                error: err.message
            });
        }
    },

    async getAdminById(req, res) {
        try {
            const adminId = req.params.id;
            const currentUser = req.user;
            
            const admin = await AdminService.getAdminById(adminId);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin non trouvé'
                });
            }

            // Vérifications des permissions
            if (currentUser.role === 'enseignant') {
                // Les enseignants ne peuvent voir que leur propre profil
                if (currentUser.id !== adminId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez consulter que votre propre profil.'
                    });
                }
            } else if (currentUser.role === 'admin') {
                // Les admins peuvent voir leur profil + enseignants de leur école
                if (currentUser.id !== adminId && 
                    (admin.ecole?.toString() !== currentUser.ecole?.toString() || admin.role !== 'enseignant')) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez consulter que votre profil ou celui des enseignants de votre école.'
                    });
                }
            }
            // Les super_admins peuvent voir n'importe qui

            res.status(200).json({
                success: true,
                message: 'Admin récupéré avec succès',
                data: {
                    ...admin.toObject(),
                    password: undefined // Ne pas retourner le mot de passe
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'admin',
                error: err.message
            });
        }
    },

    async getAdminByMatricule(req, res) {
        try {
            const { matricule } = req.body;
            const currentUser = req.user;
            
            if (!matricule) {
                return res.status(400).json({
                    success: false,
                    message: 'Matricule requis'
                });
            }

            const admin = await AdminService.getAdminByMatricule(matricule);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin non trouvé avec ce matricule'
                });
            }

            // Vérifications des permissions selon le rôle
            if (currentUser.role === 'admin') {
                // Les admins ne peuvent rechercher que dans leur école
                if (admin.ecole?.toString() !== currentUser.ecole?.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Cet admin n\'appartient pas à votre école.'
                    });
                }
            }
            // Les super_admins peuvent rechercher partout

            res.status(200).json({
                success: true,
                message: 'Admin trouvé',
                data: {
                    ...admin.toObject(),
                    password: undefined // Ne pas retourner le mot de passe
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la recherche de l\'admin',
                error: err.message
            });
        }
    },

    async updateAdmin(req, res) {
        try {
            const adminId = req.params.id;
            const adminData = req.body;
            const currentUser = req.user;

            // Vérifications des permissions selon le rôle
            if (currentUser.role === 'enseignant') {
                // Les enseignants ne peuvent modifier que leur propre profil
                if (currentUser.id !== adminId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez modifier que votre propre profil.'
                    });
                }
                
                // Empêcher la modification du rôle et de l'école
                if (adminData.role || adminData.ecole) {
                    return res.status(403).json({
                        success: false,
                        message: 'Vous ne pouvez pas modifier votre rôle ou votre école.'
                    });
                }
            } else if (currentUser.role === 'admin') {
                // Les admins peuvent modifier leur profil + enseignants de leur école
                const targetAdmin = await AdminService.getAdminById(adminId);
                if (!targetAdmin) {
                    return res.status(404).json({
                        success: false,
                        message: 'Admin non trouvé'
                    });
                }
                
                if (currentUser.id !== adminId && 
                    (targetAdmin.ecole?.toString() !== currentUser.ecole?.toString() || targetAdmin.role !== 'enseignant')) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez modifier que votre profil ou celui des enseignants de votre école.'
                    });
                }
            }

            // Empêcher la modification du matricule pour tous
            if (adminData.matricule) {
                return res.status(403).json({
                    success: false,
                    message: 'Le matricule ne peut pas être modifié.'
                });
            }

            const updatedAdmin = await AdminService.updateAdmin(adminId, adminData);
            res.status(200).json({
                success: true,
                message: 'Admin mis à jour avec succès',
                data: {
                    ...updatedAdmin.toObject(),
                    password: undefined // Ne pas retourner le mot de passe
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de l\'admin',
                error: err.message
            });
        }
    },

    async deleteAdminById(req, res) {
        try {
            const adminId = req.params.id;
            const currentUser = req.user;

            // ✅ GESTION DES RÔLES POUR LA SUPPRESSION
            if (currentUser.role === 'enseignant') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Les enseignants ne peuvent pas supprimer d\'administrateurs.'
                });
            }

            // Empêcher l'auto-suppression
            if (currentUser.id === adminId) {
                return res.status(400).json({
                    success: false,
                    message: 'Vous ne pouvez pas supprimer votre propre compte.'
                });
            }

            if (currentUser.role === 'admin') {
                // Les admins peuvent supprimer uniquement les enseignants de leur école
                const targetAdmin = await AdminService.getAdminById(adminId);
                if (!targetAdmin) {
                    return res.status(404).json({
                        success: false,
                        message: 'Admin non trouvé'
                    });
                }
                
                if (targetAdmin.ecole?.toString() !== currentUser.ecole?.toString() || 
                    targetAdmin.role !== 'enseignant') {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez supprimer que les enseignants de votre école.'
                    });
                }
            }
            // Les super_admins peuvent supprimer n'importe qui (sauf eux-mêmes, vérifié plus haut)

            await AdminService.deleteAdminById(adminId);
            res.status(200).json({
                success: true,
                message: 'Admin supprimé avec succès'
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression de l\'admin',
                error: err.message
            });
        }
    },

 /**
 * Dashboard pour l'utilisateur connecté (enseignant/admin)
 */
async getDashboardEnseignant(req, res) {
    try {
        const currentUser = req.user;
        
        console.log('🔍 DEBUG - Utilisateur connecté:', {
            id: currentUser.id,
            role: currentUser.role,
            email: currentUser.email,
            statut: currentUser.statut
        });

        // Vérification basique
        if (!currentUser.id) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non identifié'
            });
        }

        // Pour cette route, on accepte enseignants et admins
        if (!['enseignant', 'admin', 'super_admin'].includes(currentUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Rôle non autorisé.'
            });
        }

        try {
            let jeux = [];
            let planifications = [];
            let enseignantsGeres = [];

            // ✅ LOGIQUE DIFFÉRENTE SELON LE RÔLE
            if (currentUser.role === 'enseignant') {
                // ENSEIGNANT : Ses propres jeux et planifications
                jeux = await AdminService.getJeuxParEnseignant(currentUser.id);
                planifications = await AdminService.getPlanificationsParEnseignant(currentUser.id);
                
                console.log('👨‍🏫 ENSEIGNANT - Jeux personnels:', jeux.length);
                console.log('👨‍🏫 ENSEIGNANT - Planifications personnelles:', planifications.length);

            } else if (currentUser.role === 'admin') {
                // ADMIN : Jeux et planifications de TOUS les enseignants de son école
                
                // 1. Récupérer tous les enseignants de l'école
                enseignantsGeres = await AdminService.getAdminsByEcole(currentUser.ecole)
                    .then(admins => admins.filter(admin => admin.role === 'enseignant'));
                
                console.log('🏫 ADMIN - Enseignants dans l\'école:', enseignantsGeres.length);

                // 2. Récupérer les jeux de tous ces enseignants
                const jeuxPromises = enseignantsGeres.map(enseignant => 
                    AdminService.getJeuxParEnseignant(enseignant._id)
                );
                const jeuxParEnseignant = await Promise.all(jeuxPromises);
                jeux = jeuxParEnseignant.flat(); // Aplatir le tableau

                // 3. Récupérer les planifications de tous ces enseignants
                const planifPromises = enseignantsGeres.map(enseignant => 
                    AdminService.getPlanificationsParEnseignant(enseignant._id)
                );
                const planifParEnseignant = await Promise.all(planifPromises);
                planifications = planifParEnseignant.flat(); // Aplatir le tableau

                console.log('🏫 ADMIN - Total jeux école:', jeux.length);
                console.log('🏫 ADMIN - Total planifications école:', planifications.length);

            } else if (currentUser.role === 'super_admin') {
                // SUPER_ADMIN : Accès global (à implémenter selon vos besoins)
                jeux = []; // Pour l'instant, données vides
                planifications = [];
                console.log('⚡ SUPER_ADMIN - Accès global (à implémenter)');
            }
            
            // Compter les apprenants de l'école
            let apprenantsEcole = 0;
            let apprenantsInvites = 0;
            
            if (currentUser.ecole) {
                const Apprenant = require('../models/Apprenant');
                apprenantsEcole = await Apprenant.countDocuments({ 
                    ecole: currentUser.ecole,
                    type: 'ecole' 
                });
                
                apprenantsInvites = await Apprenant.countDocuments({ 
                    ecole: currentUser.ecole,
                    type: 'invite'
                });
            }

            // Calculer les statistiques détaillées
            const jeuxActifs = jeux.filter(jeu => {
                return jeu.planification && jeu.planification.length > 0 && 
                       jeu.planification.some(p => p.statut === 'en cours');
            }).length;

            const planificationsEnCours = planifications.filter(p => p.statut === 'en cours').length;
            const planificationsTerminees = planifications.filter(p => p.statut === 'terminé').length;

            // Calculer le total des participations
            const participationsTotales = planifications.reduce((total, p) => {
                return total + (p.participants ? p.participants.length : 0);
            }, 0);

            // Dernière activité
            const derniereActivite = jeux.length > 0 
                ? jeux.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
                : null;

            // ✅ STATISTIQUES SPÉCIFIQUES PAR RÔLE
            let statistiquesSpecifiques = {};
            
            if (currentUser.role === 'admin') {
                statistiquesSpecifiques = {
                    enseignantsGeres: enseignantsGeres.length,
                    enseignantsActifs: enseignantsGeres.filter(e => e.statut === 'actif').length,
                    moyenneJeuxParEnseignant: enseignantsGeres.length > 0 
                        ? Math.round(jeux.length / enseignantsGeres.length) 
                        : 0,
                    enseignantLePlusActif: enseignantsGeres.length > 0 
                        ? await getMostActiveTeacher(enseignantsGeres) 
                        : null
                };
            }

            // Réponse réussie
            res.status(200).json({
                success: true,
                message: 'Dashboard récupéré avec succès',
                data: {
                    // Statistiques principales
                    jeuxCrees: jeux.length,
                    planificationsTotal: planifications.length,
                    apprenantsEcole: apprenantsEcole,
                    apprenantsInvites: apprenantsInvites,
                    
                    // Statistiques détaillées
                    statistiquesDetaillees: {
                        jeuxActifs: jeuxActifs,
                        planificationsEnCours: planificationsEnCours,
                        planificationsTerminees: planificationsTerminees,
                        participationsTotales: participationsTotales,
                        ...statistiquesSpecifiques
                    },

                    // Informations utilisateur
                    utilisateur: {
                        id: currentUser.id,
                        nom: currentUser.nom,
                        prenom: currentUser.prenom,
                        email: currentUser.email,
                        role: currentUser.role,
                        matricule: currentUser.matricule
                    },

                    // Métadonnées
                    derniereActivite: derniereActivite,
                    dateGeneration: new Date().toISOString(),
                    scope: currentUser.role === 'enseignant' 
                        ? 'Personnel' 
                        : currentUser.role === 'admin'
                            ? 'École'
                            : 'Système',
                    
                    // Informations de contexte
                    contexte: currentUser.role === 'enseignant' 
                        ? 'Vos jeux et planifications personnels'
                        : currentUser.role === 'admin'
                            ? `Jeux et planifications de ${enseignantsGeres.length} enseignant(s) de votre école`
                            : 'Vue système globale'
                }
            });

        } catch (serviceError) {
            console.error('❌ Erreur services:', serviceError);
            
            // En cas d'erreur de service, retourner des données vides plutôt qu'une erreur
            res.status(200).json({
                success: true,
                message: 'Dashboard récupéré avec données partielles',
                data: {
                    jeuxCrees: 0,
                    planificationsTotal: 0,
                    apprenantsEcole: 0,
                    apprenantsInvites: 0,
                    statistiquesDetaillees: {
                        jeuxActifs: 0,
                        planificationsEnCours: 0,
                        planificationsTerminees: 0,
                        participationsTotales: 0
                    },
                    utilisateur: {
                        id: currentUser.id,
                        nom: currentUser.nom,
                        prenom: currentUser.prenom,
                        email: currentUser.email,
                        role: currentUser.role
                    },
                    derniereActivite: null,
                    dateGeneration: new Date().toISOString(),
                    scope: 'Données partielles',
                    erreur: 'Certaines données n\'ont pas pu être récupérées'
                }
            });
        }

    } catch (error) {
        console.error('❌ Erreur dashboard complète:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du dashboard',
            error: error.message,
            debug: {
                user: req.user ? {
                    id: req.user.id,
                    role: req.user.role,
                    email: req.user.email
                } : 'Aucun utilisateur'
            }
        });
    }
},

    // Nouvelle méthode pour récupérer le profil de l'admin connecté
    async getMyProfile(req, res) {
        try {
            const currentUser = req.user;
            const admin = await AdminService.getAdminById(currentUser.id);
            
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Profil non trouvé'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Profil récupéré avec succès',
                data: {
                    ...admin.toObject(),
                    password: undefined // Ne pas retourner le mot de passe
                }
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    // Nouvelle méthode pour mettre à jour son propre profil
    async updateMyProfile(req, res) {
        try {
            const adminData = req.body;
            const currentUser = req.user;

            // Empêcher la modification du rôle, matricule et école via cette route
            if (adminData.role) delete adminData.role;
            if (adminData.matricule) delete adminData.matricule;
            if (adminData.ecole) delete adminData.ecole;

            const updatedAdmin = await AdminService.updateAdmin(currentUser.id, adminData);
            res.status(200).json({
                success: true,
                message: 'Profil mis à jour avec succès',
                data: {
                    ...updatedAdmin.toObject(),
                    password: undefined // Ne pas retourner le mot de passe
                }
            });
        } catch (err) {
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du profil',
                error: err.message
            });
        }
    },



    // Méthode à ajouter dans controllers/adminController.js
async changePassword(req, res) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        // Validation
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Les mots de passe ne correspondent pas'
            });
        }

        // Logique de changement de mot de passe
        const result = await AdminService.changePassword(userId, currentPassword, newPassword);
        
        res.status(200).json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
},
    /**
     * ✅ CORRIGÉ : Récupération des enseignants avec vérification d'auth
     */
    async getMesEnseignants(req, res) {
        try {
            // ✅ VÉRIFICATION : S'assurer que req.user existe
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié.'
                });
            }

            const currentUser = req.user;
            let enseignants;

            if (currentUser.role === 'admin') {
                // Les admins peuvent voir uniquement les enseignants de leur école
                enseignants = await AdminService.getAdminsByEcole(currentUser.ecole);
                enseignants = enseignants.filter(admin => admin.role === 'enseignant');
            } else if (currentUser.role === 'super_admin') {
                // Les super_admins peuvent voir tous les enseignants
                enseignants = await AdminService.getAllAdmin();
                enseignants = enseignants.filter(admin => admin.role === 'enseignant');
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Seuls les admins et super_admins peuvent consulter cette liste.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Enseignants récupérés avec succès',
                data: enseignants,
                total: enseignants.length
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des enseignants',
                error: error.message
            });
        }
    },

    /**
     * Récupérer tous les jeux créés par un enseignant donné
     */
    async getJeuxParEnseignant(req, res) {
        try {
            const { enseignantId } = req.params;
            const currentUser = req.user;

            // Vérifications des permissions
            if (currentUser.role === 'enseignant') {
                // Les enseignants ne peuvent voir que leurs propres jeux
                if (currentUser.id !== enseignantId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez consulter que vos propres jeux.'
                    });
                }
            } else if (currentUser.role === 'admin') {
                // Les admins peuvent voir les jeux des enseignants de leur école
                const enseignant = await AdminService.getAdminById(enseignantId);
                if (!enseignant || enseignant.ecole?.toString() !== currentUser.ecole?.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Cet enseignant n\'appartient pas à votre école.'
                    });
                }
            }
            // Les super_admins peuvent voir tous les jeux

            const jeux = await AdminService.getJeuxParEnseignant(enseignantId);
            
            return res.status(200).json({
                success: true,
                message: 'Jeux de l\'enseignant récupérés avec succès',
                data: jeux,
                total: jeux.length
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des jeux de l\'enseignant',
                error: error.message
            });
        }
    },

    /**
     * Récupérer toutes les planifications des jeux d'un enseignant donné
     */
    async getPlanificationsParEnseignant(req, res) {
        try {
            const { enseignantId } = req.params;
            const currentUser = req.user;

            // Vérifications des permissions
            if (currentUser.role === 'enseignant') {
                // Les enseignants ne peuvent voir que leurs propres planifications
                if (currentUser.id !== enseignantId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez consulter que vos propres planifications.'
                    });
                }
            } else if (currentUser.role === 'admin') {
                // Les admins peuvent voir les planifications des enseignants de leur école
                const enseignant = await AdminService.getAdminById(enseignantId);
                if (!enseignant || enseignant.ecole?.toString() !== currentUser.ecole?.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Cet enseignant n\'appartient pas à votre école.'
                    });
                }
            }
            // Les super_admins peuvent voir toutes les planifications

            const planifications = await AdminService.getPlanificationsParEnseignant(enseignantId);
            
            return res.status(200).json({
                success: true,
                message: 'Planifications de l\'enseignant récupérées avec succès',
                data: planifications,
                total: planifications.length
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des planifications de l\'enseignant',
                error: error.message
            });
        }
    },

    /**
     * Récupérer les statistiques des enseignants d'une école
     */
    async getStatsEnseignantsByEcole(req, res) {
        try {
            const { ecoleId } = req.params;
            const currentUser = req.user;

            // Vérifications des permissions
            if (currentUser.role === 'admin') {
                // Les admins ne peuvent voir que les stats de leur école
                if (currentUser.ecole?.toString() !== ecoleId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez consulter que les statistiques de votre école.'
                    });
                }
            }
            // Les super_admins peuvent voir les stats de n'importe quelle école

            const stats = await AdminService.getStatsEnseignantsByEcole(ecoleId);
            
            return res.status(200).json({
                success: true,
                message: 'Statistiques des enseignants récupérées avec succès',
                data: stats
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des statistiques des enseignants',
                error: error.message
            });
        }
    },

    /**
     * Mettre à jour le statut d'un administrateur (actif/désactivé)
     */
    async updateAdminStatus(req, res) {
        try {
            const { targetAdminId } = req.params;
            const { statut } = req.body;
            const currentUser = req.user;

            // Validation du statut
            if (!['actif', 'inactif', 'suspendu'].includes(statut)) {
                return res.status(400).json({
                    success: false,
                    message: 'Statut invalide. Valeurs acceptées: actif, inactif, suspendu'
                });
            }

            // Empêcher l'auto-modification de statut
            if (currentUser.id === targetAdminId) {
                return res.status(400).json({
                    success: false,
                    message: 'Vous ne pouvez pas modifier votre propre statut'
                });
            }

            // Vérifications des permissions selon le rôle
            if (currentUser.role === 'enseignant') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Les enseignants ne peuvent pas modifier le statut des administrateurs.'
                });
            }

            // Récupérer l'admin cible pour vérification
            const targetAdmin = await AdminService.getAdminById(targetAdminId);
            if (!targetAdmin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin non trouvé'
                });
            }

            if (currentUser.role === 'admin') {
                // Les admins ne peuvent modifier que les enseignants de leur école
                if (targetAdmin.ecole?.toString() !== currentUser.ecole?.toString() || 
                    targetAdmin.role !== 'enseignant') {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez modifier que le statut des enseignants de votre école.'
                    });
                }
            }
            // Les super_admins peuvent modifier n'importe qui (déjà vérifié l'auto-modification plus haut)

            // Mettre à jour le statut
            const updatedAdmin = await AdminService.updateAdmin(targetAdminId, { statut });

            return res.status(200).json({
                success: true,
                message: `Statut de l'administrateur mis à jour avec succès`,
                data: {
                    id: updatedAdmin._id,
                    nom: updatedAdmin.nom,
                    prenom: updatedAdmin.prenom,
                    email: updatedAdmin.email,
                    role: updatedAdmin.role,
                    ancienStatut: targetAdmin.statut,
                    nouveauStatut: updatedAdmin.statut,
                    modifiePar: currentUser.email,
                    dateModification: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du statut',
                error: error.message
            });
        }
    },

// ===============================================
// NOUVELLES FONCTIONS À AJOUTER
// ===============================================

/**
 * Changer le mot de passe de l'admin connecté
 */
async changePassword(req, res) {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const userId = req.user.id;

        // Validation des mots de passe
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Les nouveaux mots de passe ne correspondent pas'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Récupérer l'utilisateur actuel
        const admin = await AdminService.getAdminById(userId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Utilisateur non trouvé'
            });
        }

        // Vérifier l'ancien mot de passe
        const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
        if (!isValidPassword) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Mettre à jour le mot de passe
        await AdminService.updateAdmin(userId, {
            password: hashedPassword,
            passwordChangedAt: new Date()
        });

        res.status(200).json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors du changement de mot de passe',
            error: error.message
        });
    }
},

/**
 * Récupérer le dashboard consolidé d'un enseignant
 */
async getDashboardEnseignant(req, res) {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        // Vérifications de permissions
        if (currentUser.role === 'enseignant' && currentUser.id !== id) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé. Vous ne pouvez voir que vos propres statistiques.'
            });
        }

        // Récupérer les informations de l'enseignant
        const enseignant = await AdminService.getAdminById(id);
        if (!enseignant) {
            return res.status(404).json({
                success: false,
                message: 'Enseignant non trouvé'
            });
        }

        // Si c'est un admin qui consulte, vérifier que l'enseignant appartient à son école
        if (currentUser.role === 'admin') {
            if (enseignant.ecole?.toString() !== currentUser.ecole?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Cet enseignant n\'appartient pas à votre école.'
                });
            }
        }

        // Récupérer les statistiques via les services
        const jeux = await AdminService.getJeuxParEnseignant(id);
        const planifications = await AdminService.getPlanificationsParEnseignant(id);
        
        // Compter les apprenants de l'école
        const Apprenant = require('../models/Apprenant');
        const apprenantsEcole = await Apprenant.countDocuments({ 
            ecole: enseignant.ecole,
            type: 'ecole' 
        });
        
        // Compter les apprenants invités créés par cet enseignant
        const apprenantsInvites = await Apprenant.countDocuments({ 
            ecole: enseignant.ecole,
            type: 'invite'
            // TODO: Ajouter un champ createdBy si nécessaire
        });

        // Calculer les statistiques détaillées
        const jeuxActifs = jeux.filter(jeu => {
            return jeu.planification && jeu.planification.some(p => p.statut === 'en cours');
        }).length;

        const planificationsEnCours = planifications.filter(p => p.statut === 'en cours').length;
        const planificationsTerminees = planifications.filter(p => p.statut === 'terminé').length;

        // Calculer le total des participations
        const participationsTotales = planifications.reduce((total, p) => {
            return total + (p.participants ? p.participants.length : 0);
        }, 0);

        // Trouver la dernière activité
        const derniereActivite = jeux.length > 0 
            ? jeux.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
            : null;

        res.status(200).json({
            success: true,
            message: 'Dashboard récupéré avec succès',
            data: {
                // Statistiques principales
                jeuxCrees: jeux.length,
                planificationsTotal: planifications.length,
                apprenantsEcole: apprenantsEcole,
                apprenantsInvites: apprenantsInvites,
                
                // Statistiques détaillées
                statistiquesDetaillees: {
                    jeuxActifs: jeuxActifs,
                    planificationsEnCours: planificationsEnCours,
                    planificationsTerminees: planificationsTerminees,
                    participationsTotales: participationsTotales
                },

                // Informations contextuelles
                derniereActivite: derniereActivite,
                enseignant: {
                    id: enseignant._id,
                    nom: enseignant.nom,
                    prenom: enseignant.prenom,
                    email: enseignant.email,
                    ecole: enseignant.ecole
                },

                // Métadonnées
                dateGeneration: new Date().toISOString(),
                scope: currentUser.role === 'enseignant' ? 'Personnel' : 'Supervision'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du dashboard',
            error: error.message
        });
    }
}


};

module.exports = AdminController;