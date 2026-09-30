const itemsService = require('../services/items.service');

exports.getItems = async (req, res, next) => {
  try {
    const { category, condition, search } = req.query;
    const items = await itemsService.getAllItems({ category, condition, search });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

exports.getItem = async (req, res, next) => {
  try {
    const item = await itemsService.getItemById(req.params.id);
    res.json(item);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

exports.createItem = async (req, res, next) => {
  try {
    // Inject user address if neighborhood isn't provided
    const itemData = { ...req.body };
    if (!itemData.neighborhood && req.user && req.user.address) {
      itemData.neighborhood = req.user.address;
    }
    const newItem = await itemsService.createItem(req.user.id, itemData);
    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
};

exports.updateItem = async (req, res, next) => {
  try {
    const updated = await itemsService.updateItem(req.user.id, req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};

exports.deleteItem = async (req, res, next) => {
  try {
    await itemsService.deleteItem(req.user.id, req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    next(err);
  }
};
