const requestsService = require('../services/requests.service');

exports.getSentRequests = async (req, res, next) => {
  try {
    const requests = await requestsService.getSentRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

exports.getReceivedRequests = async (req, res, next) => {
  try {
    const requests = await requestsService.getReceivedRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

exports.createRequest = async (req, res, next) => {
  try {
    const newReq = await requestsService.createRequest(req.user.id, req.body);
    res.status(201).json(newReq);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { status, rejectReason } = req.body;
    const updated = await requestsService.updateStatus(req.user.id, req.params.id, status, rejectReason);
    res.json(updated);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};
