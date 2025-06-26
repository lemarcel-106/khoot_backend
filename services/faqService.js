// services/faqService.js - VERSION AMÉLIORÉE
const FAQ = require('../models/FAQ');

const faqService = {

  // Méthodes existantes améliorées
  create: (data) => {
    return FAQ.create(data);
  },

  getAll: () => {
    return FAQ.find().sort({ ordre: 1, dateCreation: -1 });
  },

  getPublic: () => {
    return FAQ.find().sort({ ordre: 1, dateCreation: -1 });
  },

  getById: (id) => {
    return FAQ.findById(id);
  },

  update: (id, data) => {
    return FAQ.findByIdAndUpdate(id, data, { new: true });
  },

  remove: (id) => {
    return FAQ.findByIdAndDelete(id);
  },

  // ===============================================
  // NOUVELLES MÉTHODES SPÉCIALISÉES
  // ===============================================

  getByType: (type) => {
    return FAQ.find({ type }).sort({ ordre: 1, dateCreation: -1 });
  },

  search: (searchTerm) => {
    const regex = new RegExp(searchTerm, 'i');
    return FAQ.find({
      $or: [
        { question: regex },
        { reponse: regex }
      ]
    }).sort({ ordre: 1, dateCreation: -1 });
  },

  reorder: async (orders) => {
    const operations = orders.map(({ id, ordre }) => ({
      updateOne: {
        filter: { _id: id },
        update: { ordre: ordre }
      }
    }));

    return await FAQ.bulkWrite(operations);
  },

  // Méthodes de statistiques
  getStats: async () => {
    const total = await FAQ.countDocuments();
    const byType = await FAQ.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    return {
      total,
      byType
    };
  }

};

module.exports = faqService;