-- Seed the restaurant tenant with real initial content from Fluffy's menu boards.
-- Idempotent: fixed IDs are used for seeded categories/items, and placeholder
-- demo rows from the previous tenant bootstrap are only soft-hidden.

UPDATE "org_organizations"
SET
  "name" = 'Fluffy''s Subs & Pizza',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "slug" = 'restaurant-demo';

INSERT INTO "org_public_site_settings" (
  "id", "organizationId", "siteName", "heroTitle", "heroSubtitle", "about",
  "phone", "email", "addressLine1", "postalCode", "city", "country",
  "reservationEmail", "seoTitle", "seoDescription", "createdAt", "updatedAt"
)
SELECT
  '11111111-0002-4000-8000-000000000001',
  o."id",
  'Fluffy''s Subs & Pizza',
  'Fluffy''s Subs & Pizza',
  'Subs, pizza, grilled panini, wraps, sides and desserts.',
  'A fast-casual restaurant concept built around loaded subs, bold pizzas, grilled panini, salads, wraps and classic sides.',
  '+46 8 000 00 00',
  'hello@restaurantdomain.se',
  'Exempelgatan 1',
  '111 22',
  'Stockholm',
  'SE',
  'booking@restaurantdomain.se',
  'Fluffy''s Subs & Pizza',
  'Menu, opening hours, reservations, and events for Fluffy''s Subs & Pizza.',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "org_organizations" o
WHERE o."slug" = 'restaurant-demo'
ON CONFLICT ("organizationId") DO UPDATE SET
  "siteName" = EXCLUDED."siteName",
  "heroTitle" = EXCLUDED."heroTitle",
  "heroSubtitle" = EXCLUDED."heroSubtitle",
  "about" = EXCLUDED."about",
  "seoTitle" = EXCLUDED."seoTitle",
  "seoDescription" = EXCLUDED."seoDescription",
  "updatedAt" = CURRENT_TIMESTAMP;

UPDATE "rst_menu_categories" c
SET
  "isActive" = FALSE,
  "deletedAt" = COALESCE(c."deletedAt", CURRENT_TIMESTAMP),
  "updatedAt" = CURRENT_TIMESTAMP
FROM "org_organizations" o
WHERE c."organizationId" = o."id"
  AND o."slug" = 'restaurant-demo'
  AND c."name" IN ('Small plates', 'Mains', 'Dessert')
  AND c."createdBy" IS NULL;

WITH restaurant AS (
  SELECT "id" AS "organizationId"
  FROM "org_organizations"
  WHERE "slug" = 'restaurant-demo'
), categories("id", "name", "description", "sortOrder") AS (
  VALUES
    ('11111111-1000-4000-8000-000000000001', 'Pizzor', 'Pizzor från menybilderna, inklusive S/M/L-priser och glutenfritt alternativ.', 10),
    ('11111111-1000-4000-8000-000000000002', 'Subs', 'Kalla och varma subs med liten/stor prisvariant.', 20),
    ('11111111-1000-4000-8000-000000000003', 'Grillad panini', 'Grillade panini med liten/stor prisvariant.', 30),
    ('11111111-1000-4000-8000-000000000004', 'Sallad och wraps', 'Bygg din egen sallad eller wrap.', 40),
    ('11111111-1000-4000-8000-000000000005', 'Tillbehor och saser', 'Pizzasallad, vitloksbrod, kycklingklubbor, saser och extra tillbehor.', 50),
    ('11111111-1000-4000-8000-000000000006', 'Dryck, snacks och dessert', 'Lask, chips, cookies och sot dessert.', 60)
)
INSERT INTO "rst_menu_categories" (
  "id", "organizationId", "name", "description", "sortOrder", "isActive", "createdAt", "updatedAt"
)
SELECT
  c."id",
  r."organizationId",
  c."name",
  c."description",
  c."sortOrder",
  TRUE,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM categories c
CROSS JOIN restaurant r
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "sortOrder" = EXCLUDED."sortOrder",
  "isActive" = TRUE,
  "deletedAt" = NULL,
  "updatedAt" = CURRENT_TIMESTAMP;

WITH restaurant AS (
  SELECT "id" AS "organizationId"
  FROM "org_organizations"
  WHERE "slug" = 'restaurant-demo'
), items("id", "categoryId", "name", "description", "priceCents", "tags", "sortOrder") AS (
  VALUES
    ('11111111-2000-4000-8000-000000000001', '11111111-1000-4000-8000-000000000001', '1. Det enkla', 'Klassisk ostpizza.', NULL::INT, ARRAY['S 69', 'M 119', 'L 199']::TEXT[], 10),
    ('11111111-2000-4000-8000-000000000002', '11111111-1000-4000-8000-000000000001', '2. Svampgrisen', 'Skinka, champinjoner.', NULL::INT, ARRAY['S 79', 'M 139', 'L 229']::TEXT[], 20),
    ('11111111-2000-4000-8000-000000000003', '11111111-1000-4000-8000-000000000001', '3. Sot o saltig', 'Skinka, ananas.', NULL::INT, ARRAY['S 79', 'M 139', 'L 229']::TEXT[], 30),
    ('11111111-2000-4000-8000-000000000004', '11111111-1000-4000-8000-000000000001', '4. Tuna', 'Tonfisk, lok.', NULL::INT, ARRAY['S 79', 'M 139', 'L 229']::TEXT[], 40),
    ('11111111-2000-4000-8000-000000000005', '11111111-1000-4000-8000-000000000001', '5. Pepp o pap', 'Pepperoni, paprika.', NULL::INT, ARRAY['S 79', 'M 139', 'L 229']::TEXT[], 50),
    ('11111111-2000-4000-8000-000000000006', '11111111-1000-4000-8000-000000000001', '6. Taco & Kaos', 'Tacosas, tacofars, nachos, guacamole, jalapenos.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 60),
    ('11111111-2000-4000-8000-000000000007', '11111111-1000-4000-8000-000000000001', '7. Kottsmockan', 'Ost, salami, pepperoni, chorizo.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 70),
    ('11111111-2000-4000-8000-000000000008', '11111111-1000-4000-8000-000000000001', '8. Kyckling & Pesto', 'Kyckling, pesto, tomater, jalapenos.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 80),
    ('11111111-2000-4000-8000-000000000009', '11111111-1000-4000-8000-000000000001', '9. Biffen', 'Strimlad notkott, paprika, champinjoner, lok.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 90),
    ('11111111-2000-4000-8000-000000000010', '11111111-1000-4000-8000-000000000001', '10. Rok o vitlok', 'Strimlad notkott, bacon, vitlok.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 100),
    ('11111111-2000-4000-8000-000000000011', '11111111-1000-4000-8000-000000000001', '11. Kycklingmix', 'Kyckling, champinjoner, majs, lok.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 110),
    ('11111111-2000-4000-8000-000000000012', '11111111-1000-4000-8000-000000000001', '12. Spicy Chicken Garlic', 'Kyckling, tacosas, nachos, majs, jalapenos, vitlok.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 120),
    ('11111111-2000-4000-8000-000000000013', '11111111-1000-4000-8000-000000000001', '13. Chorizo', 'Chorizo, bacon, oliver, tomater.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 130),
    ('11111111-2000-4000-8000-000000000014', '11111111-1000-4000-8000-000000000001', '14. Teriyaki', 'Teriyaki-kyckling, majs, tomater, lok.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 140),
    ('11111111-2000-4000-8000-000000000015', '11111111-1000-4000-8000-000000000001', '15. Tropikmix', 'Kyckling, banan, ananas, curry.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 150),
    ('11111111-2000-4000-8000-000000000016', '11111111-1000-4000-8000-000000000001', '16. BBQ', 'Gyros, bacon, majs, lok, BBQ-sas.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 160),
    ('11111111-2000-4000-8000-000000000017', '11111111-1000-4000-8000-000000000001', '17. Vegetarisk', 'Champinjoner, paprika, ananas, tomater, oliver, majs, lok.', NULL::INT, ARRAY['S 89', 'M 139', 'L 229']::TEXT[], 170),
    ('11111111-2000-4000-8000-000000000018', '11111111-1000-4000-8000-000000000001', '18. Greken', 'Sallad, tomater, gurka, oliver, vitost, sas.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 180),
    ('11111111-2000-4000-8000-000000000019', '11111111-1000-4000-8000-000000000001', '19. Tacokebab', 'Valj mellan kebab, gyros eller kyckling. Jalapenos, majs, lok, tacosas, sas.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 190),
    ('11111111-2000-4000-8000-000000000020', '11111111-1000-4000-8000-000000000001', '20. Gyros', 'Gyros, bacon.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 200),
    ('11111111-2000-4000-8000-000000000021', '11111111-1000-4000-8000-000000000001', '21. Pick''n Mix Kebaben', 'Valj mellan kebab, gyros eller kyckling. Sallad, tomat, gurka, feferoni, lok, sas.', NULL::INT, ARRAY['S 89', 'M 149', 'L 239']::TEXT[], 210),
    ('11111111-2000-4000-8000-000000000022', '11111111-1000-4000-8000-000000000001', 'Glutenfritt', 'Samma goda pizzor, aven pa glutenfri botten. Fraga personalen om dagens utbud.', 18900, ARRAY['Glutenfri']::TEXT[], 220),

    ('11111111-3000-4000-8000-000000000001', '11111111-1000-4000-8000-000000000002', 'Ham & Cheese', 'Skinka, ost.', NULL::INT, ARRAY['Liten 73', 'Stor 108']::TEXT[], 10),
    ('11111111-3000-4000-8000-000000000002', '11111111-1000-4000-8000-000000000002', 'Turkey & Cheese', 'Kalkon, ost.', NULL::INT, ARRAY['Liten 73', 'Stor 108']::TEXT[], 20),
    ('11111111-3000-4000-8000-000000000003', '11111111-1000-4000-8000-000000000002', 'Roast Beef', 'Rostbiff.', NULL::INT, ARRAY['Liten 74', 'Stor 108']::TEXT[], 30),
    ('11111111-3000-4000-8000-000000000004', '11111111-1000-4000-8000-000000000002', 'Italian Duo', 'Peperoni, salami.', NULL::INT, ARRAY['Liten 74', 'Stor 109']::TEXT[], 40),
    ('11111111-3000-4000-8000-000000000005', '11111111-1000-4000-8000-000000000002', 'Triple Bite', 'Skinka, peperoni, salami.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 50),
    ('11111111-3000-4000-8000-000000000006', '11111111-1000-4000-8000-000000000002', 'Pure Melt', 'Skinka, kalkon, bacon.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 60),
    ('11111111-3000-4000-8000-000000000007', '11111111-1000-4000-8000-000000000002', 'Club Melt', 'Skinka, kalkon, rostbiff.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 70),
    ('11111111-3000-4000-8000-000000000008', '11111111-1000-4000-8000-000000000002', 'Creamy Tuna', 'Kramig tonfiskrora.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 80),
    ('11111111-3000-4000-8000-000000000009', '11111111-1000-4000-8000-000000000002', 'Skagenrora', 'Skagenrora.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 90),
    ('11111111-3000-4000-8000-000000000010', '11111111-1000-4000-8000-000000000002', 'Garden Melt', 'Ost och gronsaker.', NULL::INT, ARRAY['Liten 64', 'Stor 99']::TEXT[], 100),
    ('11111111-3000-4000-8000-000000000011', '11111111-1000-4000-8000-000000000002', 'Veggie Fusion', 'Falafel biff.', NULL::INT, ARRAY['Liten 74', 'Stor 109']::TEXT[], 110),
    ('11111111-3000-4000-8000-000000000012', '11111111-1000-4000-8000-000000000002', 'Veggie Teriyaki', 'Teriyaki veggie.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 120),
    ('11111111-3000-4000-8000-000000000013', '11111111-1000-4000-8000-000000000002', 'Teriyaki Twist', 'Teriyaki marinerad kyckling.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 130),
    ('11111111-3000-4000-8000-000000000014', '11111111-1000-4000-8000-000000000002', 'Chick''n Bite', 'Grillad kycklingbrost.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 140),
    ('11111111-3000-4000-8000-000000000015', '11111111-1000-4000-8000-000000000002', 'Cheesy Steak', 'Skivad notkott.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 150),
    ('11111111-3000-4000-8000-000000000016', '11111111-1000-4000-8000-000000000002', 'Loaded Burger', 'Notburgare.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 160),
    ('11111111-3000-4000-8000-000000000017', '11111111-1000-4000-8000-000000000002', 'Tex-Mex', 'Not tacofars, guacamole, nachos.', NULL::INT, ARRAY['Liten 75', 'Stor 110']::TEXT[], 170),

    ('11111111-4000-4000-8000-000000000001', '11111111-1000-4000-8000-000000000003', 'Chicken Bacon Melt', 'Kyckling, bacon, dubbel mild ost, mozzarella, paprika, lok, vitloksdressing.', NULL::INT, ARRAY['Liten 90', 'Stor 125']::TEXT[], 10),
    ('11111111-4000-4000-8000-000000000002', '11111111-1000-4000-8000-000000000003', 'Steak Melt', 'Skivad notkott, dubbel mild ost, mozzarella, paprika, lok, chilimajonnas.', NULL::INT, ARRAY['Liten 90', 'Stor 125']::TEXT[], 20),
    ('11111111-4000-4000-8000-000000000003', '11111111-1000-4000-8000-000000000003', 'Italian Melt', 'Peperoni, salami, dubbel amerikansk ost, mozzarella, paprika, lok, chilimajonnas.', NULL::INT, ARRAY['Liten 85', 'Stor 120']::TEXT[], 30),

    ('11111111-5000-4000-8000-000000000001', '11111111-1000-4000-8000-000000000004', 'Bygg din egen sallad eller wrap', 'Bygg din egen sallad eller wrap fran menyn.', 10900, ARRAY[]::TEXT[], 10),

    ('11111111-6000-4000-8000-000000000001', '11111111-1000-4000-8000-000000000005', 'Pizzasallad', NULL, 2500, ARRAY[]::TEXT[], 10),
    ('11111111-6000-4000-8000-000000000002', '11111111-1000-4000-8000-000000000005', 'Vitloksbrod', NULL, NULL::INT, ARRAY['Liten 49', 'Mellan 89']::TEXT[], 20),
    ('11111111-6000-4000-8000-000000000003', '11111111-1000-4000-8000-000000000005', 'Kycklingklubbor', NULL, NULL::INT, ARRAY['3 st 49', '6 st 89']::TEXT[], 30),
    ('11111111-6000-4000-8000-000000000004', '11111111-1000-4000-8000-000000000005', 'Saser', 'Kebabsas mild, vitlokssas, BBQ-sas, bearnaisesas, chilibearnaisesas.', NULL::INT, ARRAY['1 st 15', '2 st 25', '3 st 30']::TEXT[], 40),
    ('11111111-6000-4000-8000-000000000005', '11111111-1000-4000-8000-000000000005', 'Extra gronsaker', NULL, NULL::INT, ARRAY['S 10', 'M 20', 'L 30']::TEXT[], 50),
    ('11111111-6000-4000-8000-000000000006', '11111111-1000-4000-8000-000000000005', 'Extra kott', NULL, NULL::INT, ARRAY['S 20', 'M 30', 'L 37']::TEXT[], 60),
    ('11111111-6000-4000-8000-000000000007', '11111111-1000-4000-8000-000000000005', 'Extra ost', NULL, NULL::INT, ARRAY['S 10', 'M 20', 'L 30']::TEXT[], 70),
    ('11111111-6000-4000-8000-000000000008', '11111111-1000-4000-8000-000000000005', 'Bacon', NULL, NULL::INT, ARRAY['Liten 10', 'Stor 20']::TEXT[], 80),
    ('11111111-6000-4000-8000-000000000009', '11111111-1000-4000-8000-000000000005', 'Ost', NULL, NULL::INT, ARRAY['Liten 8', 'Stor 16']::TEXT[], 90),
    ('11111111-6000-4000-8000-000000000010', '11111111-1000-4000-8000-000000000005', 'Guacamole', NULL, NULL::INT, ARRAY['Liten 10', 'Stor 20']::TEXT[], 100),
    ('11111111-6000-4000-8000-000000000011', '11111111-1000-4000-8000-000000000005', 'Dubbel kott', NULL, NULL::INT, ARRAY['Liten 20', 'Stor 40']::TEXT[], 110),

    ('11111111-7000-4000-8000-000000000001', '11111111-1000-4000-8000-000000000006', 'Lask', NULL, NULL::INT, ARRAY['Liten 20', 'Mellan 25', 'Stor 30', 'Burk 25', 'PET 35']::TEXT[], 10),
    ('11111111-7000-4000-8000-000000000002', '11111111-1000-4000-8000-000000000006', 'Chips', NULL, 1500, ARRAY[]::TEXT[], 20),
    ('11111111-7000-4000-8000-000000000003', '11111111-1000-4000-8000-000000000006', 'Cookies', NULL, NULL::INT, ARRAY['1 st 15', '3 st 40', '12 st 120']::TEXT[], 30),
    ('11111111-7000-4000-8000-000000000004', '11111111-1000-4000-8000-000000000006', 'Nutella', NULL, 5900, ARRAY[]::TEXT[], 40),
    ('11111111-7000-4000-8000-000000000005', '11111111-1000-4000-8000-000000000006', 'Nutella med banan', NULL, 6900, ARRAY[]::TEXT[], 50),
    ('11111111-7000-4000-8000-000000000006', '11111111-1000-4000-8000-000000000006', 'Nutella med ananas', NULL, 6900, ARRAY[]::TEXT[], 60)
)
INSERT INTO "rst_menu_items" (
  "id", "organizationId", "categoryId", "name", "description", "priceCents",
  "currency", "tags", "isAvailable", "sortOrder", "createdAt", "updatedAt"
)
SELECT
  i."id",
  r."organizationId",
  i."categoryId",
  i."name",
  i."description",
  i."priceCents",
  'SEK',
  i."tags",
  TRUE,
  i."sortOrder",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM items i
CROSS JOIN restaurant r
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "priceCents" = EXCLUDED."priceCents",
  "currency" = EXCLUDED."currency",
  "tags" = EXCLUDED."tags",
  "isAvailable" = TRUE,
  "deletedAt" = NULL,
  "sortOrder" = EXCLUDED."sortOrder",
  "updatedAt" = CURRENT_TIMESTAMP;
