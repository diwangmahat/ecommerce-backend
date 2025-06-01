const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { getOrders, updateOrderStatus } = require("../controllers/orderController");

router.route("/").get(protect, getOrders);
router.route("/:orderId/status").put(protect, updateOrderStatus);

module.exports = router;