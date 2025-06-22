const Temoignage = require('../models/Temoignage');

exports.create = (data) => Temoignage.create(data);
exports.getAll = () => Temoignage.find();
exports.getValid = () => Temoignage.find({ valide: true });
exports.update = (id, data) => Temoignage.findByIdAndUpdate(id, data, { new: true });
exports.remove = (id) => Temoignage.findByIdAndDelete(id);
