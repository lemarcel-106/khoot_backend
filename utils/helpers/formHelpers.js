exports.checkRequiredFields = (body, fields) => {
    const missingFields = fields.filter(field => !body[field]);
    return missingFields.length === 0 ? null : missingFields;
};

exports.cleanFormData = (data) => {
    Object.keys(data).forEach(key => {
        if (typeof data[key] === 'string') {
            data[key] = data[key].trim();
        }
    });
    return data;
};
