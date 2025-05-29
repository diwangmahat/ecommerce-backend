const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  deleteProduct,
  deleteAllProducts,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
  getProductStats,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/")
  .get(getProducts)
  .post(protect, admin, createProduct)
  .delete(protect, admin, deleteAllProducts);

router.route("/stats").get(protect, admin, getProductStats);
router.route("/top").get(getTopProducts);
router.route("/:id/reviews").post(protect, createProductReview);

router.route("/:id")
  .get(getProductById)
  .delete(protect, admin, deleteProduct)
  .put(protect, admin, updateProduct);

module.exports = router;