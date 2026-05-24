const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requests.controller');

// Get requests made by the current user (Borrower)
router.get('/sent', requestController.getSentRequests);

// Get requests received by the current user (Lender)
router.get('/received', requestController.getReceivedRequests);

// Create a new borrow request
router.post('/', requestController.createRequest);

// Update request status (Approve, Reject, Cancel, Return, etc)
router.put('/:id/status', requestController.updateStatus);

module.exports = router;
