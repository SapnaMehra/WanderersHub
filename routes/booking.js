const express = require("express");
const router = express.Router();

const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");
const { isLoggedIn } = require("../middleware.js");
router.get("/availability/:id", isLoggedIn, async (req, res) => {
  const bookings = await Booking.find({
    listing: req.params.id,
    status: { $ne: "Rejected" }
  });

  res.json(bookings);
});
router.get("/", isLoggedIn, async (req, res) => {

  const allBookings = await Booking.find({
    user: req.user._id
  }).populate("listing");

  res.render("listings/bookings.ejs", {
    allBookings
  });

});
router.get("/dashboard", isLoggedIn, async (req, res) => {
  const listings = await Listing.find({
    owner: req.user._id
  });

  const bookings = await Booking.find({
    listing: { $in: listings.map(listing => listing._id) }
  })
    .populate("listing")
    .populate("user");

  const totalEarnings = bookings
    .filter(booking => booking.status === "Confirmed")
    .reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const totalBookings = bookings.length;

const confirmedBookings = bookings.filter(
  booking => booking.status === "Confirmed"
).length;

const pendingBookings = bookings.filter(
  booking => booking.status === "Pending"
).length;

  res.render("listings/dashboard.ejs", {
    listings,
    bookings,
    totalEarnings,
    totalBookings,
   confirmedBookings,
   pendingBookings
  });
});

router.post("/:id/confirm", isLoggedIn, async (req, res) => {

  const booking = await Booking.findById(req.params.id)
    .populate("listing");

  if (!booking || !booking.listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not authorized to confirm this booking.");
    return res.redirect("/bookings/dashboard");
  }

  await Booking.findByIdAndUpdate(req.params.id, {
    status: "Confirmed"
  });

  req.flash("success", "Booking confirmed!");
  res.redirect("/bookings/dashboard");
});


router.post("/:id/reject", isLoggedIn, async (req, res) => {

  await Booking.findByIdAndUpdate(req.params.id, {
    status: "Rejected"
  });

  req.flash("success", "Booking rejected!");

  res.redirect("/bookings/dashboard");
});
router.post("/:id/cancel", isLoggedIn, async (req, res) => {

  await Booking.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id
  });

  req.flash("success", "Booking cancelled!");

  res.redirect("/bookings");
});


router.post("/:id", isLoggedIn, async (req, res) => {

  const checkIn = new Date(req.body.checkIn);
  const checkOut = new Date(req.body.checkOut);
  const guests = Number(req.body.guests);

  if (checkIn >= checkOut) {
    req.flash("error", "Check-out date must be after check-in date.");
    return res.redirect(`/listings/${req.params.id}`);
  }

  if (guests < 1) {
    req.flash("error", "Guests must be at least 1.");
    return res.redirect(`/listings/${req.params.id}`);
  }
const existingBooking = await Booking.findOne({
  listing: req.params.id,
  checkIn: { $lt: checkOut },
  checkOut: { $gt: checkIn }
});

if (existingBooking) {
  req.flash("error", "This listing is already booked for these dates.");
  return res.redirect(`/listings/${req.params.id}`);
}
const listing = await Listing.findById(req.params.id);

const nights = (checkOut - checkIn) / (1000 * 60 * 60 * 24);

const totalPrice = nights * listing.price;

  const booking = new Booking({
    listing: req.params.id,
    user: req.user._id,
    checkIn: checkIn,
    checkOut: checkOut,
    guests: guests,
    totalPrice: totalPrice
  });

  await booking.save();
  await Notification.create({
  recipient: listing.owner,
  message: `New booking received for "${listing.title}"!`,
  type: "booking"
});

  req.flash("success", "Booking confirmed!");

  res.redirect(`/listings/${req.params.id}`);
});

module.exports = router;