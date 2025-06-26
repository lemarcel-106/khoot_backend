// services/authService.js - Version Améliorée avec Commentaires en Français
const adminService = require('./adminService');
const passwordUtils = require('../utils/password');
const tokenUtils = require('../utils/token');
const apprenantService = require('./apprenantService');

/**
 * Service d'authentification pour gérer les connexions des utilisateurs
 * Prend en charge différents types d'utilisateurs : admins, super admins et apprenants
 */
const authService = {
    /**
     * Fonction générique de connexion qui peut gérer différents types d'utilisateurs
     * @param {string} email - Adresse email de l'utilisateur
     * @param {string} password - Mot de passe de l'utilisateur
     * @param {string|null} requiredRole - Rôle requis pour l'accès (optionnel)
     * @returns {Object} Objet contenant le token, message, statut et informations utilisateur
     */
    login: async (email, password, requiredRole = null) => {
        try {
            // Validation des données d'entrée - vérifier que email et password ne sont pas vides
            if (!email || !password) {
                return { 
                    token: null, 
                    message: 'Email et mot de passe requis', 
                    statut: 400, // Code d'erreur HTTP Bad Request
                    user: null 
                };
            }

            // Récupération de l'utilisateur par son email depuis la base de données
            const user = await adminService.getAdminByEmail(email);
            
            // Vérifier si l'utilisateur existe dans la base de données
            if (!user) {
                return { 
                    token: null, 
                    message: 'Utilisateur non trouvé', 
                    statut: 404, // Code d'erreur HTTP Not Found
                    user: null 
                };
            }

            // Comparaison sécurisée du mot de passe fourni avec le hash stocké
            const isPasswordValid = await passwordUtils.comparePassword(password, user.password);
            if (!isPasswordValid) {
                return { 
                    token: null, 
                    message: 'Mot de passe incorrect', 
                    statut: 401, // Code d'erreur HTTP Unauthorized
                    user: null 
                };
            }

            // Contrôle d'accès basé sur les rôles (RBAC - Role-Based Access Control)
            // Vérifier si un rôle spécifique est requis et si l'utilisateur l'a
            if (requiredRole && !this.hasRequiredRole(user.role, requiredRole)) {
                return {
                    token: null,
                    message: 'Accès refusé : permissions insuffisantes',
                    statut: 403, // Code d'erreur HTTP Forbidden
                    user: null
                };
            }

            // Génération du token JWT pour maintenir la session utilisateur
            const token = tokenUtils.generateToken(user);

            // Retour des informations de connexion réussie
            return {
                token,
                message: 'Connexion réussie',
                statut: 200, // Code de succès HTTP OK
                email: user.email, // Utilisation de user.email au lieu de redéclarer la variable
                role: user.role
            };
        } catch (error) {
            // Logging des erreurs pour le débogage et la surveillance de sécurité
            console.error('Erreur lors de la connexion:', error);
            
            // Retour d'une erreur générique pour éviter la divulgation d'informations sensibles
            return {
                token: null,
                message: 'Erreur interne du serveur',
                statut: 500, // Code d'erreur HTTP Internal Server Error
                user: null
            };
        }
    },
    
    /**
     * Connexion spécifique pour les administrateurs
     * Utilise la fonction login générique avec le rôle 'admin' requis
     * @param {string} email - Adresse email de l'administrateur
     * @param {string} password - Mot de passe de l'administrateur
     * @returns {Object} Résultat de la tentative de connexion
     */
    loginAdmin: async (email, password) => {
        // Délégation à la fonction login générique avec rôle admin requis
        return authService.login(email, password, 'admin');
    },

    /**
     * Connexion spécifique pour les super administrateurs
     * Utilise la fonction login générique avec le rôle 'super_admin' requis
     * @param {string} email - Adresse email du super administrateur
     * @param {string} password - Mot de passe du super administrateur
     * @returns {Object} Résultat de la tentative de connexion
     */
    loginSuperAdmin: async (email, password) => {
        // Délégation à la fonction login générique avec rôle super_admin requis
        return authService.login(email, password, 'super_admin');
    },

    /**
     * Connexion pour les apprenants/étudiants utilisant leur matricule
     * Les apprenants se connectent avec un matricule au lieu d'un email/mot de passe
     * @param {string} matricule - Numéro de matricule de l'apprenant
     * @returns {Object} Résultat de la tentative de connexion
     */
    loginApprenant: async (matricule) => {
        try {
            // Validation de l'entrée - vérifier qu'un matricule est fourni
            if (!matricule) {
                return { 
                    token: null, 
                    message: 'Matricule requis', 
                    statut: 400, // Code d'erreur HTTP Bad Request
                    apprenant: null 
                };
            }

            // Recherche de l'apprenant par son matricule dans la base de données
            const apprenant = await apprenantService.getParticipantByMatricule(matricule);

            console.log('Apprenant trouvé:', apprenant);
            
            // Vérifier si l'apprenant existe
            if (!apprenant) {
                return { 
                    token: null, 
                    message: 'Apprenant non trouvé', 
                    statut: 404, // Code d'erreur HTTP Not Found
                    apprenant: null 
                };
            }

            // Génération du token pour l'apprenant (pas de vérification de mot de passe)
            const token = tokenUtils.generateToken(apprenant);

            // Retour des informations de connexion réussie pour l'apprenant
            return {
                token,
                message: 'Connexion réussie',
                statut: 200, // Code de succès HTTP OK
                apprenant // Retourne toutes les informations de l'apprenant
            };
        } catch (error) {
            // Logging spécifique pour les erreurs de connexion des apprenants
            console.error('Erreur lors de la connexion apprenant:', error);
            
            // Retour d'une erreur générique
            return {
                token: null,
                message: 'Erreur interne du serveur',
                statut: 500, // Code d'erreur HTTP Internal Server Error
                apprenant: null
            };
        }
    },

    /**
     * Fonction utilitaire pour vérifier la hiérarchie des rôles
     * Implémente un système de permissions basé sur des niveaux hiérarchiques
     * @param {string} userRole - Rôle actuel de l'utilisateur
     * @param {string} requiredRole - Rôle minimum requis
     * @returns {boolean} True si l'utilisateur a les permissions suffisantes
     */
    hasRequiredRole: (userRole, requiredRole) => {
        // Définition de la hiérarchie des rôles avec des niveaux numériques
        // Plus le nombre est élevé, plus le rôle a de permissions
        const roleHierarchy = {
            'user': 0,        // Utilisateur basique
            'admin': 1,       // Administrateur
            'super_admin': 2  // Super administrateur (permissions maximales)
        };

        // Récupération du niveau de l'utilisateur (0 par défaut si rôle inconnu)
        const userLevel = roleHierarchy[userRole] || 0;
        
        // Récupération du niveau requis (0 par défaut si rôle inconnu)
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        // L'utilisateur a les permissions si son niveau est >= au niveau requis
        return userLevel >= requiredLevel;
    },

    /**
     * Fonction de sécurité supplémentaire pour valider un token JWT
     * Utilisée pour vérifier l'authenticité et la validité d'un token
     * @param {string} token - Token JWT à valider
     * @returns {Object} Objet indiquant si le token est valide et les données utilisateur
     */
    validateToken: async (token) => {
        try {
            // Vérification de la présence du token
            if (!token) {
                return { 
                    valid: false, 
                    message: 'Token manquant' 
                };
            }

            // Vérification et décodage du token JWT
            const decoded = tokenUtils.verifyToken(token);
            
            // Si le décodage échoue, le token est invalide
            if (!decoded) {
                return { 
                    valid: false, 
                    message: 'Token invalide' 
                };
            }

            // Token valide, retour des données décodées
            return { 
                valid: true, 
                user: decoded 
            };
        } catch (error) {
            // Logging des erreurs de validation de token
            console.error('Erreur validation token:', error);
            
            // Retour d'une erreur de validation
            return { 
                valid: false, 
                message: 'Erreur validation token' 
            };
        }
    },

    /**
     * Fonction utilitaire pour nettoyer les données utilisateur sensibles
     * Retire les informations sensibles avant de les envoyer au client
     * @param {Object} user - Objet utilisateur complet
     * @returns {Object} Objet utilisateur sans données sensibles
     */
    sanitizeUserData: (user) => {
        // Création d'une copie de l'utilisateur sans le mot de passe
        const { password, ...sanitizedUser } = user;
        
        // Retour des données nettoyées (sans le mot de passe)
        return sanitizedUser;
    }
};

// Export du service pour utilisation dans d'autres modules
module.exports = authService;