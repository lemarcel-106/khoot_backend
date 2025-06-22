const FAQ = require('../models/FAQ');

exports.create = (data) => FAQ.create(data);
exports.getAll = () => FAQ.find().sort({ ordre: 1 });
exports.getPublic = () => FAQ.find().sort({ ordre: 1 }); 
exports.update = (id, data) => FAQ.findByIdAndUpdate(id, data, { new: true });
exports.remove = (id) => FAQ.findByIdAndDelete(id);
