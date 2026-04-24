require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const bookingRoutes = require('./routes/bookings');
const reviewRoutes = require('./routes/reviews');
const promotionRoutes = require('./routes/promotions');
const availabilityRoutes = require('./routes/availability');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const messageRoutes = require('./routes/messages');
const paymentRoutes = require('./routes/payments');
const payoutRoutes = require('./routes/payouts');
const hostReviewRoutes = require('./routes/hostReviews');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payouts', payoutRoutes);
app.use('/api/host-reviews', hostReviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.json({
  name: 'StayHub API',
  version: '1.1.0',
  endpoints: {
    health: 'GET /api/health',
    auth: 'POST /api/auth/login, POST /api/auth/register, POST /api/auth/verify-2fa, POST /api/auth/forgot-password, POST /api/auth/reset-password, GET /api/auth/profile',
    properties: 'GET /api/properties, GET /api/properties/featured',
    bookings: 'POST /api/bookings/preview, GET /api/bookings/guest, GET /api/bookings/host',
    payments: 'POST /api/payments',
    payouts: 'GET /api/payouts, GET /api/payouts/earnings',
    messages: 'GET /api/messages/conversations, POST /api/messages, POST /api/messages/inquiry',
    notifications: 'GET /api/notifications',
    reviews: 'GET /api/reviews/property/:id',
    hostReviews: 'POST /api/host-reviews, GET /api/host-reviews/guest/:guestId',
    promotions: 'GET /api/promotions',
    availability: 'GET /api/availability/:propertyId, POST /api/availability/:propertyId',
    search: 'GET /api/search',
    users: 'GET /api/users/:id',
    admin: 'GET /api/admin/users, GET /api/admin/revenue',
  },
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
