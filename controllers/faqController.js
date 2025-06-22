const service = require('../services/faqService');

exports.create = async (req, res) => {
  try {
    const faq = await service.create(req.body);
    res.status(201).json({ success: true, data: faq });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const faqs = await service.getAll();
    res.json({ success: true, data: faqs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getPublic = async (req, res) => {
  try {
    const faqs = await service.getPublic();
    res.json({ success: true, data: faqs });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const faq = await service.update(req.params.id, req.body);
    res.json({ success: true, data: faq });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await service.remove(req.params.id);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
