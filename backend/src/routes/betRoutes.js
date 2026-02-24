const express = require("express");
const router = express.Router();
const {
  placeBet,
  getLiveBets,
  getUserBets,
} = require("../controllers/betController");
const { protect } = require("../middleware/authMiddleware");

router.post("/place", protect, placeBet);
router.get("/live", protect, getLiveBets); // protected — admin should use token too
router.get("/my-bets", protect, getUserBets);

module.exports = router;
