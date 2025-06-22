module.exports = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = [];

        requiredFields.forEach(field => {
            const fieldValue = req.body[field];

            // Vérifie si le champ est manquant ou non une chaîne de caractères vide
            if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
                missingFields.push(field);
            }
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                message: 'Certains champs sont manquants ou vides',
                champsManquants: missingFields
            });
        }

        next();
    };
};
