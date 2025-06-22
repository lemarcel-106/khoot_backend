const service = require('../services/notificationService');

exports.create = async (req, res) => {
  try {
    const n = await service.create(req.body);
    res.status(201).json({ success: true, data: n });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.getByEcole = async (req, res) => {
  try {
    const list = await service.getByEcole(req.params.ecoleId);
    res.json({ success: true, data: list });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const n = await service.markAsRead(req.params.id);
    res.json({ success: true, data: n });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
