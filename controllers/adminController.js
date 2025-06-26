const AdminService = require('../services/adminService');
const generateMatricule = require('../utils/generateMatriculeAdmin');

const AdminController = {
  
     /**
     * ✅ CRÉATION D'ADMIN AVEC GESTION DES RÔLES CORRIGÉE
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

            console.log('Utilisateur connecté:', currentUser); // Debug
            console.log('Données reçues:', adminData); // Debug

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
                        message: 'Accès refusé. Les admins ne peuvent créer que des enseignants.'
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
                // Les super_admins peuvent créer admin, enseignant (pas d'autres super_admin)
                if (!['admin', 'enseignant'].includes(roleACreer)) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Les rôles autorisés sont : admin, enseignant.'
                    });
                }
                
                // ✅ RÈGLE 4 : Les super_admins DOIVENT spécifier l'école
                if (!adminData.ecole) {
                    return res.status(400).json({
                        success: false,
                        message: 'L\'école est obligatoire pour les super administrateurs.'
                    });
                }
                
                console.log('École spécifiée par super_admin:', adminData.ecole);
                
            } else {
                return res.status(403).json({
                    success: false,
                    message: 'Rôle non autorisé pour cette action.'
                });
            }

            // ✅ GÉNÉRATION DU MATRICULE
            try {
                adminData.matricule = await generateMatricule(adminData.ecole);
                console.log('Matricule généré:', adminData.matricule);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: `Erreur lors de la génération du matricule: ${error.message}`
                });
            }

            // ✅ Le pays sera automatiquement récupéré depuis l'école dans le service
            if (!adminData.pays) {
                console.log('Pays automatiquement récupéré depuis l\'école...');
            }

            // ✅ CRÉATION DE L'ADMIN
            const admin = await AdminService.createAdmin(adminData);
            
            return res.status(201).json({
                success: true,
                message: `${roleACreer} créé avec succès`,
                data: {
                    ...admin.toObject(),
                    // Ne pas retourner le mot de passe
                    password: undefined
                }
            });
            
        } catch (error) {
            console.error('Erreur lors de la création de l\'admin:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getAdminById(req, res) {
        try {
            const adminId = req.params.id;
            const currentUser = req.user;

            // Un admin peut voir ses propres infos, un super_admin peut voir tous les admins
            if (currentUser.role !== 'super_admin' && currentUser.id !== adminId) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez consulter que vos propres informations.'
                });
            }

            const admin = await AdminService.getAdminById(adminId);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin non trouvé'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Admin récupéré avec succès',
                data: admin
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getAllAdmin(req, res) {
        try {
            const currentUser = req.user;

            // ✅ GESTION DES RÔLES POUR LA CONSULTATION
            let admins;
            
            if (currentUser.role === 'super_admin') {
                // Les super_admins peuvent voir tous les admins
                admins = await AdminService.getAllAdmin();
            } else if (currentUser.role === 'admin') {
                // Les admins peuvent voir les enseignants de leur école
                if (!currentUser.ecole) {
                    return res.status(400).json({
                        success: false,
                        message: "Aucune école associée à votre compte"
                    });
                }
                
                const adminData = {
                    id: currentUser.id,
                    role: currentUser.role,
                    ecole: currentUser.ecole
                };
                
                admins = await AdminService.getEnseignantsByEcole(currentUser.ecole, adminData);
            } else {
                // Les enseignants ne peuvent pas voir la liste des admins
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Vous ne pouvez pas consulter la liste des administrateurs.'
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Liste des admins récupérée avec succès',
                data: admins,
                total: admins.length
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async getAdminByMatricule(req, res) {
        try {
            const matricule = req.body.matricule;
            const currentUser = req.user;

            // ✅ GESTION DES RÔLES POUR LA RECHERCHE PAR MATRICULE
            if (currentUser.role === 'enseignant') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Les enseignants ne peuvent pas rechercher d\'autres admins.'
                });
            }

            const admin = await AdminService.getAdminByMatricule(matricule);
            if (!admin) {
                return res.status(404).json({
                    success: false,
                    message: 'Admin non trouvé'
                });
            }

            // Vérifier les permissions pour un admin normal
            if (currentUser.role === 'admin') {
                if (admin.ecole?.toString() !== currentUser.ecole?.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Cet admin n\'appartient pas à votre école.'
                    });
                }
            }

            return res.status(200).json({
                success: true,
                message: 'Admin récupéré avec succès',
                data: admin
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    async updateAdmin(req, res) {
        try {
            const adminId = req.params.id;
            const adminData = req.body;
            const currentUser = req.user;

            // ✅ GESTION DES RÔLES POUR LA MODIFICATION
            if (currentUser.role === 'enseignant') {
                // Les enseignants ne peuvent modifier que leur propre profil
                if (currentUser.id !== adminId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez modifier que votre propre profil.'
                    });
                }
                // Empêcher la modification du rôle et de l'école pour les enseignants
                if (adminData.role) delete adminData.role;
                if (adminData.ecole) delete adminData.ecole;
                
            } else if (currentUser.role === 'admin') {
                // Les admins peuvent modifier leur profil et celui des enseignants de leur école
                if (currentUser.id !== adminId) {
                    // Vérifier que l'admin à modifier appartient à la même école
                    const targetAdmin = await AdminService.getAdminById(adminId);
                    if (!targetAdmin || targetAdmin.ecole?.toString() !== currentUser.ecole?.toString()) {
                        return res.status(403).json({
                            success: false,
                            message: 'Accès refusé. Vous ne pouvez modifier que les enseignants de votre école.'
                        });
                    }
                    // Un admin ne peut pas modifier le rôle d'un autre admin
                    if (adminData.role && targetAdmin.role !== 'enseignant') {
                        return res.status(403).json({
                            success: false,
                            message: 'Accès refusé. Vous ne pouvez pas modifier le rôle de cet utilisateur.'
                        });
                    }
                }
                // Empêcher la modification de l'école et du rôle vers super_admin
                if (adminData.ecole) delete adminData.ecole;
                if (adminData.role === 'super_admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez pas promouvoir quelqu\'un au rang de super administrateur.'
                    });
                }
                
            } else if (currentUser.role === 'super_admin') {
                // Les super_admins peuvent tout modifier sauf se rétrograder eux-mêmes
                if (currentUser.id === adminId && adminData.role && adminData.role !== 'super_admin') {
                    return res.status(403).json({
                        success: false,
                        message: 'Vous ne pouvez pas modifier votre propre rôle de super administrateur.'
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

    /**
     * ✅ CORRIGÉ : Récupération des enseignants avec vérification d'auth
     */
    async getMesEnseignants(req, res) {
        try {
            // ✅ VÉRIFICATION : S'assurer que req.user existe
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié. Token manquant ou invalide.'
                });
            }

            const currentUser = req.user;

            // ✅ GESTION DES RÔLES POUR LA CONSULTATION DES ENSEIGNANTS
            if (currentUser.role === 'enseignant') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Les enseignants ne peuvent pas consulter la liste des autres enseignants.'
                });
            }

            // Vérifier que l'admin a une école associée
            if (!currentUser.ecole) {
                return res.status(400).json({
                    success: false,
                    message: "Aucune école associée à votre compte"
                });
            }

            const adminData = {
                id: currentUser.id,
                role: currentUser.role,
                ecole: currentUser.ecole
            };

            // Utiliser la nouvelle méthode avec statistiques
            const enseignants = await AdminService.getEnseignantsAvecStats(currentUser.ecole, adminData);

            return res.status(200).json({
                success: true,
                message: 'Liste de vos enseignants avec statistiques récupérée avec succès',
                data: enseignants,
                total: enseignants.length,
                ecole: currentUser.ecole
            });

        } catch (error) {
            console.error('Erreur lors de la récupération de mes enseignants:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * ✅ CORRIGÉ : Jeux par enseignant avec vérification d'auth
     */
    async getJeuxParEnseignant(req, res) {
        try {
            // ✅ VÉRIFICATION : S'assurer que req.user existe
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié. Token manquant ou invalide.'
                });
            }

            const { enseignantId } = req.params;
            const currentUser = req.user;

            // ✅ GESTION DES RÔLES POUR LA CONSULTATION DES JEUX
            if (currentUser.role === 'enseignant') {
                // Les enseignants ne peuvent voir que leurs propres jeux
                if (currentUser.id !== enseignantId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez consulter que vos propres jeux.'
                    });
                }
            }

            // Validation de l'ID de l'enseignant
            if (!enseignantId) {
                return res.status(400).json({
                    success: false,
                    message: "L'ID de l'enseignant est requis"
                });
            }

            const adminData = {
                id: currentUser.id,
                role: currentUser.role,
                ecole: currentUser.ecole
            };

            const jeux = await AdminService.getJeuxParEnseignant(enseignantId, adminData);

            return res.status(200).json({
                success: true,
                message: 'Liste des jeux de l\'enseignant récupérée avec succès',
                data: jeux,
                total: jeux.length,
                enseignantId: enseignantId
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des jeux de l\'enseignant:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

     /**
     * ✅ CORRIGÉ : Planifications par enseignant avec vérification d'auth
     */
     async getPlanificationsParEnseignant(req, res) {
        try {
            // ✅ VÉRIFICATION : S'assurer que req.user existe
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Utilisateur non authentifié. Token manquant ou invalide.'
                });
            }

            const { enseignantId } = req.params;
            const currentUser = req.user;

            // ✅ GESTION DES RÔLES POUR LA CONSULTATION DES PLANIFICATIONS
            if (currentUser.role === 'enseignant') {
                // Les enseignants ne peuvent voir que leurs propres planifications
                if (currentUser.id !== enseignantId) {
                    return res.status(403).json({
                        success: false,
                        message: 'Accès refusé. Vous ne pouvez consulter que vos propres planifications.'
                    });
                }
            }

            // Validation de l'ID de l'enseignant
            if (!enseignantId) {
                return res.status(400).json({
                    success: false,
                    message: "L'ID de l'enseignant est requis"
                });
            }

            const adminData = {
                id: currentUser.id,
                role: currentUser.role,
                ecole: currentUser.ecole
            };

            const planifications = await AdminService.getPlanificationsParEnseignant(enseignantId, adminData);

            return res.status(200).json({
                success: true,
                message: 'Liste des planifications de l\'enseignant récupérée avec succès',
                data: planifications,
                total: planifications.length,
                enseignantId: enseignantId
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des planifications de l\'enseignant:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    /**
     * Récupère les statistiques des enseignants d'une école
     * Route: GET /api/ecoles/:ecoleId/enseignants/stats
     */
    async getStatsEnseignantsByEcole(req, res) {
        try {
            const { ecoleId } = req.params;
            const currentUser = req.user;

            // ✅ GESTION DES RÔLES POUR LES STATISTIQUES
            if (currentUser.role === 'enseignant') {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé. Les enseignants ne peuvent pas consulter les statistiques.'
                });
            }

            // Validation de l'ID de l'école
            if (!ecoleId) {
                return res.status(400).json({
                    success: false,
                    message: "L'ID de l'école est requis"
                });
            }

            // Vérification des permissions
            if (currentUser.role !== 'super_admin') {
                if (!currentUser.ecole || currentUser.ecole.toString() !== ecoleId) {
                    return res.status(403).json({
                        success: false,
                        message: "Accès refusé à cette école"
                    });
                }
            }

            const stats = await AdminService.getStatsEnseignantsByEcole(ecoleId);

            return res.status(200).json({
                success: true,
                message: 'Statistiques des enseignants récupérées avec succès',
                data: stats
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
,
async updateAdminStatus(req, res) {
    try {
        const targetAdminId = req.params.id;
        const { statut } = req.body;
        const currentUser = req.user;

        // Validation du statut
        if (!statut || !['actif', 'inactif', 'suspendu'].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide. Valeurs autorisées : actif, inactif, suspendu'
            });
        }

        // Empêcher l'auto-modification de statut
        if (currentUser.id === targetAdminId) {
            return res.status(400).json({
                success: false,
                message: 'Vous ne pouvez pas modifier votre propre statut'
            });
        }

        // Vérification des permissions selon le rôle
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
};




module.exports = AdminController;