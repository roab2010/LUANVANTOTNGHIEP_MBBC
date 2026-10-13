const express = require('express');
const router = express.Router();
const {
  getImportReceipts,
  getImportReceiptById,
  createImportReceipt,
  cancelImportReceipt,
} = require('../controllers/importReceiptController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

// Tất cả routes phiếu nhập hàng đều yêu cầu quyền Admin
router.use(authenticateToken, requireAdmin);

router.get('/', getImportReceipts);
router.get('/:id', getImportReceiptById);
router.post('/', createImportReceipt);
router.put('/:id/cancel', cancelImportReceipt);

module.exports = router;
