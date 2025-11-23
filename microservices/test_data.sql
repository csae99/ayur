-- Test Data for Admin Dashboard
-- Run this on the ayur_db database

-- ============================================
-- PRACTITIONERS (Mix of verified and pending)
-- ============================================

-- Verified Practitioners
INSERT INTO practitioners (fname, lname, username, password, email, phone, office_name, address, professionality, bio, nida, verified, joined_on)
VALUES 
('Dr. Rajesh', 'Sharma', 'dr_rajesh', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'rajesh@ayurveda.com', '9876543210', 'Sharma Ayurvedic Clinic', 'Mumbai, Maharashtra', 'Ayurvedic Physician', 'Specialized in Panchakarma therapy with 15 years experience', '1234567890', true, NOW()),
('Dr. Priya', 'Patel', 'dr_priya', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'priya@ayurveda.com', '9876543211', 'Patel Wellness Center', 'Ahmedabad, Gujarat', 'Ayurvedic Consultant', 'Expert in herbal medicine and dietary consultation', '1234567891', true, NOW()),
('Dr. Arun', 'Kumar', 'dr_arun', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'arun@ayurveda.com', '9876543212', 'Kumar Ayurvedic Hospital', 'Bangalore, Karnataka', 'Senior Ayurvedic Doctor', 'Specializing in chronic disease management', '1234567892', true, NOW());

-- Pending Verification Practitioners
INSERT INTO practitioners (fname, lname, username, password, email, phone, office_name, address, professionality, bio, nida, verified, joined_on)
VALUES 
('Dr. Meera', 'Reddy', 'dr_meera', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'meera@ayurveda.com', '9876543213', 'Reddy Ayurvedic Clinic', 'Hyderabad, Telangana', 'Ayurvedic Practitioner', 'Focus on skin and hair care treatments', '1234567893', false, NOW()),
('Dr. Vikram', 'Singh', 'dr_vikram', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'vikram@ayurveda.com', '9876543214', 'Singh Wellness Spa', 'Jaipur, Rajasthan', 'Ayurvedic Therapist', 'Specialized in stress management and rejuvenation', '1234567894', false, NOW()),
('Dr. Anita', 'Desai', 'dr_anita', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'anita@ayurveda.com', '9876543215', 'Desai Ayurvedic Center', 'Pune, Maharashtra', 'Ayurvedic Consultant', 'Expert in women health and pregnancy care', '1234567895', false, NOW()),
('Dr. Karthik', 'Iyer', 'dr_karthik', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'karthik@ayurveda.com', '9876543216', 'Iyer Traditional Medicine', 'Chennai, Tamil Nadu', 'Traditional Healer', 'Practicing traditional South Indian Ayurveda', '1234567896', false, NOW());

-- ============================================
-- MEDICINES (Mix of Pending, Approved, Rejected)
-- ============================================

-- Approved Medicines (by verified practitioners)
INSERT INTO items (item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, added_by, status)
VALUES 
('Ashwagandha Capsules', 'Himalaya', 'Herbs for Health', 'Premium quality Ashwagandha for stress relief and energy boost. Contains 500mg of pure extract per capsule.', 'stress, energy, immunity', 'Medicine.png', 100, 299, 'dr_rajesh', 'Approved'),
('Triphala Churna', 'Patanjali', 'Herbs for Health', 'Traditional Ayurvedic digestive powder made from three fruits. Helps in detoxification and digestion.', 'digestion, detox, immunity', 'Medicine.png', 150, 150, 'dr_rajesh', 'Approved'),
('Chyawanprash', 'Dabur', 'Herbs for Health', 'Complete immunity booster with 40+ herbs. Suitable for all ages. Rich in Vitamin C and antioxidants.', 'immunity, energy, wellness', 'Medicine.png', 80, 450, 'dr_priya', 'Approved'),
('Kumkumadi Tailam', 'Kama Ayurveda', 'Skin Infections', 'Luxurious face oil for glowing skin. Contains saffron and other precious herbs. Reduces dark spots.', 'skincare, beauty, glow', 'Medicine.png', 50, 1200, 'dr_priya', 'Approved'),
('Brahmi Tablets', 'Organic India', 'Herbs for Health', 'Brain tonic for memory and concentration. 100% organic Brahmi extract with no additives.', 'memory, focus, brain', 'Medicine.png', 120, 350, 'dr_arun', 'Approved');

-- Pending Approval Medicines
INSERT INTO items (item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, added_by, status)
VALUES 
('Neem Capsules', 'Himalaya', 'Skin Infections', 'Pure Neem extract for blood purification and skin health. Helps in treating acne and infections.', 'skincare, blood purifier, detox', 'Medicine.png', 90, 250, 'dr_meera', 'Pending'),
('Garcinia Cambogia', 'HealthVit', 'Weight Loss', 'Natural weight loss supplement with HCA. Helps suppress appetite and boost metabolism.', 'weight loss, metabolism, fat burner', 'Medicine.png', 60, 599, 'dr_vikram', 'Pending'),
('Guggul Tablets', 'Zandu', 'Weight Loss', 'Ayurvedic herb for cholesterol management and weight loss. Supports healthy lipid levels.', 'weight loss, cholesterol, heart health', 'Medicine.png', 75, 399, 'dr_anita', 'Pending'),
('Tulsi Drops', 'Organic India', 'Herbs for Health', 'Holy Basil extract for immunity and respiratory health. Anti-stress and adaptogenic properties.', 'immunity, respiratory, stress', 'Medicine.png', 100, 180, 'dr_karthik', 'Pending'),
('Arjuna Extract', 'Sri Sri Tattva', 'Other', 'Heart care supplement. Supports cardiovascular health and maintains healthy blood pressure.', 'heart, blood pressure, cardiovascular', 'Medicine.png', 85, 450, 'dr_meera', 'Pending');

-- Rejected Medicines
INSERT INTO items (item_title, item_brand, item_cat, item_details, item_tags, item_image, item_quantity, item_price, added_by, status)
VALUES 
('Magic Weight Loss Tea', 'Unknown Brand', 'Weight Loss', 'Instant weight loss tea with guaranteed results in 7 days.', 'weight loss, quick fix', 'Medicine.png', 200, 99, 'dr_vikram', 'Rejected'),
('Super Power Capsules', 'Generic', 'Other', 'Increases energy and stamina 10x instantly.', 'energy, power', 'Medicine.png', 150, 199, 'dr_anita', 'Rejected');

-- ============================================
-- PATIENTS (For testing patient list)
-- ============================================

INSERT INTO patients (fname, lname, username, password, email, phone, address, joined_on)
VALUES 
('Amit', 'Verma', 'amit_v', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'amit@example.com', '9123456780', 'Delhi, India', NOW()),
('Sneha', 'Kapoor', 'sneha_k', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'sneha@example.com', '9123456781', 'Mumbai, India', NOW()),
('Rahul', 'Mehta', 'rahul_m', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'rahul@example.com', '9123456782', 'Bangalore, India', NOW()),
('Pooja', 'Nair', 'pooja_n', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'pooja@example.com', '9123456783', 'Chennai, India', NOW()),
('Arjun', 'Rao', 'arjun_r', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'arjun@example.com', '9123456784', 'Hyderabad, India', NOW()),
('Kavya', 'Prasad', 'kavya_p', '$2b$10$a91TulEO3DBZSjeGYDR5W.I1aHvEOqukm.TBpFTRZTRRDqZBvWPIy', 'kavya@example.com', '9123456785', 'Pune, India', NOW());

-- ============================================
-- SUMMARY
-- ============================================
-- Practitioners: 7 total (3 verified + 1 existing verified, 4 pending)
-- Medicines: 12 total (5 approved, 5 pending, 2 rejected)
-- Patients: 6 new patients
-- 
-- All passwords are hashed version of: "password123"
-- (Same hash as admin_user for consistency)
