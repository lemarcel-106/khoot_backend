const { v4: uuidv4 } = require('uuid');

exports.generateUniqueId = () => {
    return uuidv4();
};
