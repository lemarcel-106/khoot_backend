// module.exports = (requiredFields) => {
//     return (req, res, next) => {
//         const missingFields = [];

//         requiredFields.forEach(field => {
//             const fieldValue = req.body[field];

//             // Vérifie si le champ est manquant ou non une chaîne de caractères vide
//             if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '')) {
//                 missingFields.push(field);
//             }
//         });

//         if (missingFields.length > 0) {
//             return res.status(400).json({
//                 message: 'Certains champs sont manquants ou vides',
//                 champsManquants: missingFields
//             });
//         }

//         next();
//     };
// };


module.exports = (requiredFields) => {
    return (req, res, next) => {
        const missingFields = [];

        requiredFields.forEach(field => {
            const fieldValue = req.body[field];

            // ✅ AMÉLIORATION: Meilleure validation pour différents types
            if (fieldValue === undefined || fieldValue === null) {
                missingFields.push(field);
            } else if (typeof fieldValue === 'string' && fieldValue.trim() === '') {
                missingFields.push(field);
            } else if (typeof fieldValue === 'boolean') {
                // ✅ AJOUT: Les booléens sont acceptés (pour le champ 'etat')
                // Ne rien faire, c'est valide
            } else if (typeof fieldValue === 'number') {
                // ✅ AJOUT: Les nombres sont acceptés
                // Ne rien faire, c'est valide
            }
        });

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Certains champs sont manquants ou vides',
                champsManquants: missingFields,
                format_attendu: {
                    question: "ID de la question (obligatoire)",
                    etat: "true/false ou 0/1 (obligatoire)",
                    reponse_texte: "Texte de la réponse (optionnel)",
                    file: "Chemin vers fichier (optionnel)"
                }
            });
        }

        next();
    };
};
