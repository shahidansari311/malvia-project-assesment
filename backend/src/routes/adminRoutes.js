const express = require("express");
const router = express.Router();
const {
  declareResult,
  getResults,
} = require("../controllers/resultController");
const { protect, admin } = require("../middleware/authMiddleware");

router.post("/declare-result", protect, admin, declareResult);
router.get("/results", getResults);

module.exports = router;
