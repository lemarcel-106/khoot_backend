// controllers/faqController.js - VERSION AMÉLIORÉE
const service = require('../services/faqService');

const faqController = {

  async create(req, res) {
    try {
      console.log('➕ Création d\'une nouvelle FAQ...');
      const faq = await service.create(req.body);
      
      res.status(201).json({ 
        success: true, 
        data: faq,
        message: 'FAQ créée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur create FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la création de la FAQ',
        error: error.message 
      });
    }
  },

  async getAll(req, res) {
    try {
      const faqs = await service.getAll();
      res.json({ 
        success: true, 
        data: faqs,
        total: faqs.length,
        message: 'FAQs récupérées avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur getAll FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des FAQs',
        error: error.message 
      });
    }
  },

  async getPublic(req, res) {
    try {
      const faqs = await service.getPublic();
      res.json({ 
        success: true, 
        data: faqs,
        total: faqs.length,
        message: 'FAQs publiques récupérées avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur getPublic FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des FAQs publiques',
        error: error.message 
      });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const faq = await service.getById(id);
      
      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'FAQ non trouvée'
        });
      }

      res.json({ 
        success: true, 
        data: faq,
        message: 'FAQ récupérée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur getById FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération de la FAQ',
        error: error.message 
      });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      console.log('🔄 Mise à jour FAQ ID:', id);
      
      const faq = await service.update(id, req.body);
      
      if (!faq) {
        return res.status(404).json({
          success: false,
          message: 'FAQ non trouvée'
        });
      }

      res.json({ 
        success: true, 
        data: faq,
        message: 'FAQ mise à jour avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur update FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la mise à jour de la FAQ',
        error: error.message 
      });
    }
  },

  async remove(req, res) {
    try {
      const { id } = req.params;
      console.log('🗑️ Suppression FAQ ID:', id);
      
      const result = await service.remove(id);
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'FAQ non trouvée'
        });
      }

      res.status(200).json({
        success: true,
        message: 'FAQ supprimée avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur remove FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la suppression de la FAQ',
        error: error.message 
      });
    }
  },

  // ===============================================
  // NOUVELLES MÉTHODES SPÉCIALISÉES
  // ===============================================

  async getByType(req, res) {
    try {
      const { type } = req.params;
      const faqs = await service.getByType(type);
      
      res.json({ 
        success: true, 
        data: faqs,
        total: faqs.length,
        type: type,
        message: `FAQs de type "${type}" récupérées avec succès`
      });
    } catch (error) {
      console.error('❌ Erreur getByType FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la récupération des FAQs par type',
        error: error.message 
      });
    }
  },

  async search(req, res) {
    try {
      const { searchTerm } = req.params;
      const faqs = await service.search(searchTerm);
      
      res.json({ 
        success: true, 
        data: faqs,
        total: faqs.length,
        searchTerm: searchTerm,
        message: `Recherche effectuée avec succès`
      });
    } catch (error) {
      console.error('❌ Erreur search FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la recherche dans les FAQs',
        error: error.message 
      });
    }
  },

  async reorder(req, res) {
    try {
      const { orders } = req.body; // Array of { id, ordre }
      const result = await service.reorder(orders);
      
      res.json({ 
        success: true, 
        data: result,
        message: 'Ordre des FAQs mis à jour avec succès'
      });
    } catch (error) {
      console.error('❌ Erreur reorder FAQ:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de la réorganisation des FAQs',
        error: error.message 
      });
    }
  }

};

module.exports = faqController;