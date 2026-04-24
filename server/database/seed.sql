-- Seed data for StayHub
-- Password for all users is: password123
-- Hash generated with bcrypt rounds=12

INSERT INTO users (id, email, password_hash, first_name, last_name, role, avatar_url, phone, is_active) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'sarah@example.com', '$2a$12$w8zAa.q28yMp18aZqJJbgegmXBylzUipk5X0kG4bh4HjptIdFNBZy', 'Sarah', 'Johnson', 'host', 'https://i.pravatar.cc/150?img=47', '+1-555-0101', TRUE),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'john@example.com', '$2a$12$w8zAa.q28yMp18aZqJJbgegmXBylzUipk5X0kG4bh4HjptIdFNBZy', 'John', 'Smith', 'guest', 'https://i.pravatar.cc/150?img=12', '+1-555-0102', TRUE),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'emily@example.com', '$2a$12$w8zAa.q28yMp18aZqJJbgegmXBylzUipk5X0kG4bh4HjptIdFNBZy', 'Emily', 'Chen', 'guest', 'https://i.pravatar.cc/150?img=32', '+1-555-0103', TRUE),
  ('adadada1-adad-adad-adad-adadadadad01', 'admin@example.com', '$2a$12$w8zAa.q28yMp18aZqJJbgegmXBylzUipk5X0kG4bh4HjptIdFNBZy', 'Alex', 'Admin', 'admin', 'https://i.pravatar.cc/150?img=60', '+1-555-0000', TRUE)
ON CONFLICT (email) DO NOTHING;

INSERT INTO properties (id, host_id, title, description, property_type, address, city, country, latitude, longitude, price_per_night, max_guests, bedrooms, bathrooms, amenities) VALUES
  (
    'd4e5f6a7-b8c9-0123-def0-234567890123',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Luxury Downtown Apartment',
    'A stunning modern apartment in the heart of downtown with breathtaking city views. Features floor-to-ceiling windows, designer furniture, and a fully equipped gourmet kitchen. Walking distance to top restaurants, museums, and entertainment.',
    'apartment',
    '123 Main Street, Suite 4B',
    'New York',
    'United States',
    40.71280000,
    -74.00600000,
    185.00,
    4,
    2,
    2.0,
    ARRAY['WiFi', 'Air conditioning', 'Kitchen', 'Washer', 'Dryer', 'TV', 'Elevator', 'Gym', 'Doorman']
  ),
  (
    'e5f6a7b8-c9d0-1234-ef01-345678901234',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Cozy Beach House',
    'Wake up to the sound of waves in this charming beach house just steps from the ocean. Enjoy gorgeous sunsets from the private deck, then relax in the hot tub. Perfect for a romantic getaway or small family vacation.',
    'house',
    '456 Ocean Drive',
    'Miami',
    'United States',
    25.79200000,
    -80.13000000,
    250.00,
    6,
    3,
    2.0,
    ARRAY['WiFi', 'Hot tub', 'Beach access', 'BBQ grill', 'Parking', 'Air conditioning', 'Washer', 'Kitchen', 'TV']
  ),
  (
    'f6a7b8c9-d0e1-2345-f012-456789012345',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Mountain Cabin Retreat',
    'Escape to this rustic yet comfortable mountain cabin surrounded by towering pine trees. Features a stone fireplace, wraparound deck with mountain views, and direct access to hiking trails. Fully equipped kitchen and cozy sleeping areas.',
    'cabin',
    '789 Pine Ridge Road',
    'Aspen',
    'United States',
    39.18610000,
    -106.81750000,
    175.00,
    8,
    4,
    2.0,
    ARRAY['WiFi', 'Fireplace', 'Hot tub', 'Parking', 'Hiking trails', 'Ski storage', 'Kitchen', 'TV', 'BBQ grill']
  ),
  (
    'a7b8c9d0-e1f2-3456-0123-567890123456',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Modern Studio in Arts District',
    'Stylish studio apartment in the vibrant Arts District. Walking distance to galleries, trendy restaurants, and nightlife. High ceilings, exposed brick, designer furnishings, and a fully stocked kitchen make this the perfect urban hideaway.',
    'studio',
    '321 Gallery Lane',
    'Los Angeles',
    'United States',
    34.04000000,
    -118.23530000,
    95.00,
    2,
    1,
    1.0,
    ARRAY['WiFi', 'Air conditioning', 'Kitchen', 'TV', 'Washer', 'Workspace', 'Coffee maker']
  ),
  (
    'b8c9d0e1-f2a3-4567-1234-678901234567',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Tuscan Villa with Pool',
    'Live like Italian royalty in this magnificent Tuscan-style villa. Set on 2 acres of manicured gardens, this stunning property features a private pool, outdoor kitchen, vineyard views, and luxuriously appointed interiors. The ultimate luxury escape.',
    'villa',
    '555 Vineyard Road',
    'Napa',
    'United States',
    38.29550000,
    -122.28770000,
    450.00,
    10,
    5,
    4.0,
    ARRAY['WiFi', 'Pool', 'Hot tub', 'Kitchen', 'BBQ grill', 'Parking', 'TV', 'Washer', 'Air conditioning', 'Wine cellar', 'Garden']
  )
ON CONFLICT DO NOTHING;

INSERT INTO property_photos (property_id, url, caption, is_primary, display_order) VALUES
  ('d4e5f6a7-b8c9-0123-def0-234567890123', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'Living room with city views', TRUE, 0),
  ('d4e5f6a7-b8c9-0123-def0-234567890123', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800', 'Modern kitchen', FALSE, 1),
  ('d4e5f6a7-b8c9-0123-def0-234567890123', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800', 'Master bedroom', FALSE, 2),
  ('d4e5f6a7-b8c9-0123-def0-234567890123', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', 'City view from window', FALSE, 3),

  ('e5f6a7b8-c9d0-1234-ef01-345678901234', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800', 'Beachfront exterior', TRUE, 0),
  ('e5f6a7b8-c9d0-1234-ef01-345678901234', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800', 'Living area', FALSE, 1),
  ('e5f6a7b8-c9d0-1234-ef01-345678901234', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', 'Beach access', FALSE, 2),

  ('f6a7b8c9-d0e1-2345-f012-456789012345', 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800', 'Cabin exterior in winter', TRUE, 0),
  ('f6a7b8c9-d0e1-2345-f012-456789012345', 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800', 'Cozy fireplace', FALSE, 1),
  ('f6a7b8c9-d0e1-2345-f012-456789012345', 'https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=800', 'Mountain views from deck', FALSE, 2),

  ('a7b8c9d0-e1f2-3456-0123-567890123456', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'Studio interior', TRUE, 0),
  ('a7b8c9d0-e1f2-3456-0123-567890123456', 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800', 'Kitchen area', FALSE, 1),

  ('b8c9d0e1-f2a3-4567-1234-678901234567', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', 'Villa exterior with pool', TRUE, 0),
  ('b8c9d0e1-f2a3-4567-1234-678901234567', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'Pool area', FALSE, 1),
  ('b8c9d0e1-f2a3-4567-1234-678901234567', 'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=800', 'Vineyard views', FALSE, 2),
  ('b8c9d0e1-f2a3-4567-1234-678901234567', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', 'Master suite', FALSE, 3)
ON CONFLICT DO NOTHING;

-- Availability for next 90 days (all available by default)
INSERT INTO availability (property_id, date, is_available)
SELECT
  p.id,
  CURRENT_DATE + INTERVAL '1 day' * generate_series(0, 89),
  TRUE
FROM properties p
WHERE p.host_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ON CONFLICT (property_id, date) DO NOTHING;

-- Block some dates for variety
INSERT INTO availability (property_id, date, is_available) VALUES
  ('d4e5f6a7-b8c9-0123-def0-234567890123', CURRENT_DATE + INTERVAL '15 days', FALSE),
  ('d4e5f6a7-b8c9-0123-def0-234567890123', CURRENT_DATE + INTERVAL '16 days', FALSE),
  ('d4e5f6a7-b8c9-0123-def0-234567890123', CURRENT_DATE + INTERVAL '17 days', FALSE),
  ('e5f6a7b8-c9d0-1234-ef01-345678901234', CURRENT_DATE + INTERVAL '20 days', FALSE),
  ('e5f6a7b8-c9d0-1234-ef01-345678901234', CURRENT_DATE + INTERVAL '21 days', FALSE)
ON CONFLICT (property_id, date) DO UPDATE SET is_available = EXCLUDED.is_available;

-- Bookings
INSERT INTO bookings (id, property_id, guest_id, check_in, check_out, num_guests, total_price, discount_amount, final_price, status, special_requests) VALUES
  (
    'c9d0e1f2-a3b4-5678-2345-789012345678',
    'd4e5f6a7-b8c9-0123-def0-234567890123',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '8 days',
    2,
    555.00,
    0.00,
    555.00,
    'confirmed',
    'Early check-in if possible'
  ),
  (
    'd0e1f2a3-b4c5-6789-3456-890123456789',
    'e5f6a7b8-c9d0-1234-ef01-345678901234',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE - INTERVAL '7 days',
    3,
    750.00,
    75.00,
    675.00,
    'completed',
    NULL
  ),
  (
    'e1f2a3b4-c5d6-7890-4567-901234567890',
    'f6a7b8c9-d0e1-2345-f012-456789012345',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    CURRENT_DATE + INTERVAL '25 days',
    CURRENT_DATE + INTERVAL '30 days',
    4,
    875.00,
    0.00,
    875.00,
    'pending',
    'We have skis, need storage'
  )
ON CONFLICT DO NOTHING;

-- Reviews (for completed booking)
INSERT INTO reviews (booking_id, property_id, guest_id, rating, comment) VALUES
  (
    'd0e1f2a3-b4c5-6789-3456-890123456789',
    'e5f6a7b8-c9d0-1234-ef01-345678901234',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    5,
    'Absolutely stunning beach house! The location is perfect, right on the beach with amazing sunsets. Sarah was a wonderful host, very responsive and helpful. The hot tub was an amazing bonus. We will definitely be back!'
  )
ON CONFLICT DO NOTHING;

-- Promotions
INSERT INTO promotions (host_id, property_id, code, description, discount_type, discount_value, max_uses, valid_from, valid_until, is_active) VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    NULL,
    'WELCOME10',
    '10% off your first booking',
    'percentage',
    10.00,
    100,
    CURRENT_DATE - INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '60 days',
    TRUE
  ),
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'b8c9d0e1-f2a3-4567-1234-678901234567',
    'VILLA50',
    '$50 off the Tuscan Villa',
    'fixed',
    50.00,
    20,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Feature two properties so Featured page has content
UPDATE properties SET is_featured = TRUE
WHERE id IN ('b8c9d0e1-f2a3-4567-1234-678901234567', 'e5f6a7b8-c9d0-1234-ef01-345678901234');

-- Payout for the completed booking
INSERT INTO payouts (host_id, booking_id, amount, commission, status, payout_date)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'd0e1f2a3-b4c5-6789-3456-890123456789',
  607.50,
  67.50,
  'paid',
  CURRENT_DATE - INTERVAL '5 days'
)
ON CONFLICT DO NOTHING;

-- Payment record for the completed booking
INSERT INTO payments (booking_id, amount, cardholder_name, card_last4, card_brand, status)
VALUES (
  'd0e1f2a3-b4c5-6789-3456-890123456789',
  675.00,
  'Emily Chen',
  '4242',
  'Visa',
  'succeeded'
)
ON CONFLICT DO NOTHING;

-- Host review of guest for completed booking
INSERT INTO host_reviews (booking_id, host_id, guest_id, rating, comment) VALUES
  (
    'd0e1f2a3-b4c5-6789-3456-890123456789',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    5,
    'Emily was a wonderful guest. Very respectful of the property and communicated well. Would happily host again!'
  )
ON CONFLICT DO NOTHING;

-- Demo conversation (pre-booking inquiry) between John and Sarah about the Downtown Apartment
INSERT INTO conversations (id, guest_id, host_id, property_id, subject) VALUES
  (
    'c0111111-1111-1111-1111-111111111111',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'd4e5f6a7-b8c9-0123-def0-234567890123',
    'Inquiry about Luxury Downtown Apartment'
  )
ON CONFLICT DO NOTHING;

INSERT INTO messages (conversation_id, sender_id, content, is_read) VALUES
  ('c0111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Hi Sarah! Is your downtown apartment available for a work trip next month? Also — is there parking nearby?', TRUE),
  ('c0111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Hi John! Yes it should be available. The building has valet parking ($35/night) and there is also street parking after 6pm.', TRUE),
  ('c0111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Great, thanks! I will go ahead and book.', FALSE)
ON CONFLICT DO NOTHING;

UPDATE conversations SET last_message_at = NOW()
WHERE id = 'c0111111-1111-1111-1111-111111111111';

-- Demo notifications
INSERT INTO notifications (user_id, type, title, message, link, is_read) VALUES
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'booking_confirmed', 'Booking confirmed', 'Your stay at Luxury Downtown Apartment is confirmed.', '/dashboard/guest', FALSE),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'booking_request', 'New booking request', 'John requested to book Mountain Cabin Retreat.', '/dashboard/host', FALSE),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'payout_paid', 'Payout released', 'Your payout of $607.50 has been processed.', '/dashboard/host/payouts', TRUE),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'host_review', 'You received a review', 'Your host left you a 5-star review.', '/users/c3d4e5f6-a7b8-9012-cdef-123456789012', FALSE)
ON CONFLICT DO NOTHING;
