exports.formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

exports.formatNumber = (num) => {
    return num.toLocaleString('fr-FR');
};
