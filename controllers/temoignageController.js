const service = require('../services/temoignageService');

exports.create = async (req, res) => {
  try {
    const t = await service.create(req.body);
    res.status(201).json({ success: true, data: t });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const list = await service.getAll();
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getValid = async (req, res) => {
  try {
    const list = await service.getValid();
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const t = await service.update(req.params.id, req.body);
    res.json({ success: true, data: t });
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
