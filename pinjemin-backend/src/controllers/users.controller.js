const usersService = require('../services/users.service');

exports.getMe = async (req, res, next) => {
  try {
    const freshUser = await usersService.getMe(req.user.id);
    res.json(freshUser);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const updatedUser = await usersService.updateMe(req.user.id, req.user.address, req.body);
    res.json(updatedUser);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

exports.getTopLenders = async (req, res, next) => {
  try {
    const topLenders = await usersService.getTopLenders();
    res.json(topLenders);
  } catch (err) {
    next(err);
  }
};

exports.getImpact = async (req, res, next) => {
  try {
    const impact = await usersService.getImpact(req.user.successfulReturns);
    res.json(impact);
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await usersService.getUser(req.params.id);
    res.json(user);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};
