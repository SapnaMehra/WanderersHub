const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware.js");
const User = require("../models/user.js");
router.get("/", isLoggedIn, async (req, res) => {
  const user = await User.findById(req.user._id).populate("favorites");

  res.render("listings/favorites.ejs", {
    allListings: user.favorites
  });
});

router.post("/:id", isLoggedIn, async (req, res) => {
  const listingId = req.params.id;
  const user = await User.findById(req.user._id);

  if (user.favorites.includes(listingId)) {
    user.favorites.pull(listingId);
  } else {
    user.favorites.push(listingId);
  }

  await user.save();

  res.redirect(`/listings/${listingId}`);
});

module.exports = router;