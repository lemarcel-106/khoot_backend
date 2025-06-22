const authService = require('../services/authService');

// Fonction utilitaire générique
const handleLogin = async (res, loginFn, ...params) => {
    try {
        const result = await loginFn(...params);

        if (!result.token) {
            return res.status(400).json({ message: result.message });
        }

        return res.json(result);
    } catch (error) {
        console.error('Erreur dans handleLogin:', error);
        return res.status(500).json({ message: 'Erreur du serveur' });
    }
};

// Login utilisateur normal
exports.login = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }
    return handleLogin(res, authService.login, email, password);
};

// Login administrateur
exports.loginAdmin = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }
    return handleLogin(res, authService.loginAdmin, email, password);
};

// Login super administrateur
exports.loginSuperAdmin = (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email et mot de passe requis.' });
    }
    return handleLogin(res, authService.loginSuperAdmin, email, password);
};

// Login apprenant via matricule
exports.loginApprenant = (req, res) => {
    const { matricule } = req.body;
    if (!matricule) {
        return res.status(400).json({ message: 'Matricule requis.' });
    }
    return handleLogin(res, authService.loginApprenant, matricule);
};
