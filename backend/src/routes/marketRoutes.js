const express = require("express");
const router = express.Router();
const {
  getMarkets,
  updateMarketTimings,
} = require("../controllers/marketController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", getMarkets);
router.put("/update", protect, admin, updateMarketTimings);

module.exports = router;
