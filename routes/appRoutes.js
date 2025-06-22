const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
    const data = {
        title: 'Accueil',
        message: 'Ceci est la page à propos de notre site.'
    };
    res.render('index', data);
});

module.exports = router;