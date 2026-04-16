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

app.get('/', (req, res) => res.json({
  name: 'StayHub API',
  version: '1.0.0',
  endpoints: {
    health: 'GET /api/health',
    auth: 'POST /api/auth/login, POST /api/auth/register, GET /api/auth/profile',
    properties: 'GET /api/properties',
    bookings: 'GET /api/bookings/guest, GET /api/bookings/host',
    reviews: 'GET /api/reviews/property/:id',
    promotions: 'GET /api/promotions',
    availability: 'GET /api/availability/:propertyId',
    search: 'GET /api/search',
  },
}));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use(errorHandler);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
