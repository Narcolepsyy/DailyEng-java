-- Update images for Speaking Scenarios to use high-quality Unsplash/iStock images
-- This matches the approach used in V7 for Vocabulary

UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1686840551986-54b832f9f5c7?q=80&w=1170&auto=format&fit=crop'
WHERE title = 'Buying Fruits';

UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=1074&auto=format&fit=crop'
WHERE title = 'Grocery Shopping';

UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1664202526047-405824c633e7?q=80&w=687&auto=format&fit=crop'
WHERE title = 'Clothing Store';

UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop'
WHERE title = 'Fast Food Order';

UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1542372147193-a7aca54189cd?q=80&w=687&auto=format&fit=crop'
WHERE title = 'Coffee Shop Ordering';

UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1170&auto=format&fit=crop'
WHERE title = 'Restaurant Reservation';

UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1721826054197-2e27eb6bbda8?q=80&w=1331&auto=format&fit=crop'
WHERE title = 'Airport Navigation';

UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1658506671316-0b293df7c72b?q=80&w=1170&auto=format&fit=crop'
WHERE title = 'Doctor''s Appointment';

UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1661776594516-6895a89de126?q=80&w=1170&auto=format&fit=crop'
WHERE title = 'Hotel Reservation';

UPDATE "SpeakingScenario" 
SET image = 'https://media.istockphoto.com/id/947742820/photo/gps-map-to-route-destination-network-connection-location-street-map-with-gps-icons-navigation.webp?a=1&b=1&s=612x612&w=0&k=20&c=DJ8gl9dZfpGe4ipBtV8uaHGOzOeKsJafoJ1gAVTwt-A='
WHERE title = 'Asking for Directions';
