const express = require('express');
const router = express.Router();
const itemController = require('../controllers/items.controller');

// Get all items (discover)
router.get('/', itemController.getItems);

// Get specific item
router.get('/:id', itemController.getItem);

// Create item
router.post('/', itemController.createItem);

// Update item
router.put('/:id', itemController.updateItem);

// Delete item
router.delete('/:id', itemController.deleteItem);

module.exports = router;
