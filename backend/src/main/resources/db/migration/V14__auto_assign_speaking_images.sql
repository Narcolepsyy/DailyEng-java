-- Auto-assign high-quality Unsplash images for all 168 Speaking Scenarios
-- The script assigns images based on categories, subcategories, and specific keywords in the title.

-- 1. BASE CATEGORY ASSIGNMENTS (Thematic fallbacks)

-- Daily Life: Shopping
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?q=80&w=1074&auto=format&fit=crop' 
WHERE subcategory LIKE '%shop%';

-- Daily Life: Dining
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1170&auto=format&fit=crop' 
WHERE subcategory LIKE '%din%' OR subcategory LIKE '%food%';

-- Daily Life: Healthcare
UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1658506671316-0b293df7c72b?q=80&w=1170&auto=format&fit=crop' 
WHERE subcategory LIKE '%health%' OR subcategory LIKE '%medic%';

-- Daily Life: Transportation & Travel Hub
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1000&auto=format&fit=crop' 
WHERE category LIKE '%travel%' OR subcategory LIKE '%transport%';

-- Academic Hub
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=1000&auto=format&fit=crop' 
WHERE category LIKE '%academic%';

-- Business, Professional English & Job Interviews
UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1684769160411-ab16f414d1bc?q=80&w=1163&auto=format&fit=crop' 
WHERE category LIKE '%business%' OR category LIKE '%professional%' OR category LIKE '%interview%';

-- Social Situations
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1529156069898-49953eb1b5ae?q=80&w=1000&auto=format&fit=crop' 
WHERE category LIKE '%social%';


-- 2. SPECIFIC TITLE OVERRIDES (For more variety within subcategories)

-- Fast Food & Coffee
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1000&auto=format&fit=crop' 
WHERE title LIKE '%Fast Food%' OR title LIKE '%Burger%';

UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1542372147193-a7aca54189cd?q=80&w=687&auto=format&fit=crop' 
WHERE title LIKE '%Coffee%' OR title LIKE '%Cafe%';

-- Clothes & Fashion
UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1664202526047-405824c633e7?q=80&w=687&auto=format&fit=crop' 
WHERE title LIKE '%Cloth%' OR title LIKE '%Fashion%';

-- Maps & Directions
UPDATE "SpeakingScenario" 
SET image = 'https://media.istockphoto.com/id/947742820/photo/gps-map-to-route-destination-network-connection-location-street-map-with-gps-icons-navigation.webp?a=1&b=1&s=612x612&w=0&k=20&c=DJ8gl9dZfpGe4ipBtV8uaHGOzOeKsJafoJ1gAVTwt-A=' 
WHERE title LIKE '%Direction%' OR title LIKE '%Map%';

-- Hotels
UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1661776594516-6895a89de126?q=80&w=1170&auto=format&fit=crop' 
WHERE title LIKE '%Hotel%' OR title LIKE '%Resort%';

-- Fruits & Supermarket
UPDATE "SpeakingScenario" 
SET image = 'https://plus.unsplash.com/premium_photo-1686840551986-54b832f9f5c7?q=80&w=1170&auto=format&fit=crop' 
WHERE title LIKE '%Fruit%';

-- Job Interview
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1000&auto=format&fit=crop' 
WHERE title LIKE '%Job Interview%';

-- Meetings & Office
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1000&auto=format&fit=crop' 
WHERE title LIKE '%Meeting%' OR title LIKE '%Presentation%';


-- 3. CATCH-ALL FALLBACK
-- In case there are any remaining scenarios without images, give them a nice universal learning image
UPDATE "SpeakingScenario" 
SET image = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop' 
WHERE image = '/learning.png' OR image IS NULL;
