var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const Customers = require("./CustomerDetails");
const Rooms = require("./RoomDetails");
const Room_Booking = require("./BookingDetails");
const joi = require("joi");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
//Create room
app.post("/room", (req, res) => {
  const schema = joi.object({
    name: joi.string().required(),
    amenities: joi.array(),                                                                                                                                                                                                                         
    location: joi.string().required(),
    oneHourPrice: joi.number().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) return res.send(error.details[0].message);

  // Check if hall already Exists
  let isPresent = Rooms.find((room) => room.name == req.body.name);
  if (isPresent)
    return res
      .status(422)
      .json({ message: "Hall with the same name already Exists" });

  // Add the new entry in rooms
  const newRoom = {
    id: Rooms.length + 1,
    name: req.body.name,
    amenities: req.body.amenities,
    location: req.body.location,
    oneHourPrice: req.body.oneHourPrice,
  };

  Rooms.push(newRoom);
  return res
    .status(201)
    .json({ message: "Added successfully", data: newRoom });
});

// Book room for customer
app.post("/bookroom", (req, res) => {
  const schema = joi.object({
    custid: joi.number().required(),
    roomid: joi.number().required(),
    startDate: joi.date().required(),
    endDate: joi.date().required(),
  });

  const { error } = schema.validate(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Bad request", data: error.details[0].message });

  // Check if the room is booked already in the same time range.
  const bookingExists = Room_Booking.find(
    (booking) =>
      ((req.body.startDate <= booking.startDate &&
        req.body.endDate >= booking.startDate &&
        req.body.endDate <= booking.endDate) ||
        (req.body.endDate >= booking.startDate &&
          req.body.endDate <= booking.endDate)) &&
      booking.roomid == req.body.roomid
  );

  if (bookingExists)
    return res.status(422).json({
      message: "Already a booking available in the same time range",
      data: bookingExists,
    });

  let newBooking = {
    id: Room_Booking.length + 1,
    custid: req.body.custid,
    roomid: req.body.roomid,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
  };

  Room_Booking.push(newBooking);
  console.log(Room_Booking);
  return res.status(201).json({ message: "Booking done successfully" });
});

app.get("/roomsbookingstatus", (req, res) => {
  let result = [];
  let bookingViewModel;
  Room_Booking.forEach((booking) => {
    bookingViewModel = {
      customerName: Customers.find((x) => x.id == booking.custid).name,
      roomName: Rooms.find((x) => x.id == booking.roomid).name,
      startDate: booking.startDate,
      endDate: booking.endDate,
    };
    result.push(bookingViewModel);
  });

  res.send(result);
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
