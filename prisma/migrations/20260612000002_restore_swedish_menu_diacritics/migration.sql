-- Restore Swedish diacritics (å/ä/ö) in the seeded Fluffy's menu content.
-- The 20260611000002 seed stored ASCII-stripped text ("Sot o saltig", "Lask").
-- Data-only and idempotent: each UPDATE matches the exact stripped seed value,
-- so rows already corrected — or edited manually in the portal — are untouched.

UPDATE "rst_menu_categories" AS c
SET "name" = v."newName", "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('11111111-1000-4000-8000-000000000005', 'Tillbehor och saser', 'Tillbehör och såser')
) AS v("id", "oldName", "newName")
WHERE c."id" = v."id" AND c."name" = v."oldName";

UPDATE "rst_menu_categories" AS c
SET "description" = v."newDescription", "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('11111111-1000-4000-8000-000000000005',
     'Pizzasallad, vitloksbrod, kycklingklubbor, saser och extra tillbehor.',
     'Pizzasallad, vitlöksbröd, kycklingklubbor, såser och extra tillbehör.'),
    ('11111111-1000-4000-8000-000000000006',
     'Lask, chips, cookies och sot dessert.',
     'Läsk, chips, cookies och söt dessert.')
) AS v("id", "oldDescription", "newDescription")
WHERE c."id" = v."id" AND c."description" = v."oldDescription";

UPDATE "rst_menu_items" AS i
SET "name" = v."newName", "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('11111111-2000-4000-8000-000000000003', '3. Sot o saltig', '3. Söt o saltig'),
    ('11111111-2000-4000-8000-000000000007', '7. Kottsmockan', '7. Köttsmockan'),
    ('11111111-2000-4000-8000-000000000010', '10. Rok o vitlok', '10. Rök o vitlök'),
    ('11111111-3000-4000-8000-000000000009', 'Skagenrora', 'Skagenröra'),
    ('11111111-6000-4000-8000-000000000002', 'Vitloksbrod', 'Vitlöksbröd'),
    ('11111111-6000-4000-8000-000000000004', 'Saser', 'Såser'),
    ('11111111-6000-4000-8000-000000000005', 'Extra gronsaker', 'Extra grönsaker'),
    ('11111111-6000-4000-8000-000000000006', 'Extra kott', 'Extra kött'),
    ('11111111-6000-4000-8000-000000000011', 'Dubbel kott', 'Dubbel kött'),
    ('11111111-7000-4000-8000-000000000001', 'Lask', 'Läsk')
) AS v("id", "oldName", "newName")
WHERE i."id" = v."id" AND i."name" = v."oldName";

UPDATE "rst_menu_items" AS i
SET "description" = v."newDescription", "updatedAt" = CURRENT_TIMESTAMP
FROM (
  VALUES
    ('11111111-2000-4000-8000-000000000004',
     'Tonfisk, lok.',
     'Tonfisk, lök.'),
    ('11111111-2000-4000-8000-000000000006',
     'Tacosas, tacofars, nachos, guacamole, jalapenos.',
     'Tacosås, tacofärs, nachos, guacamole, jalapeños.'),
    ('11111111-2000-4000-8000-000000000008',
     'Kyckling, pesto, tomater, jalapenos.',
     'Kyckling, pesto, tomater, jalapeños.'),
    ('11111111-2000-4000-8000-000000000009',
     'Strimlad notkott, paprika, champinjoner, lok.',
     'Strimlad nötkött, paprika, champinjoner, lök.'),
    ('11111111-2000-4000-8000-000000000010',
     'Strimlad notkott, bacon, vitlok.',
     'Strimlad nötkött, bacon, vitlök.'),
    ('11111111-2000-4000-8000-000000000011',
     'Kyckling, champinjoner, majs, lok.',
     'Kyckling, champinjoner, majs, lök.'),
    ('11111111-2000-4000-8000-000000000012',
     'Kyckling, tacosas, nachos, majs, jalapenos, vitlok.',
     'Kyckling, tacosås, nachos, majs, jalapeños, vitlök.'),
    ('11111111-2000-4000-8000-000000000014',
     'Teriyaki-kyckling, majs, tomater, lok.',
     'Teriyaki-kyckling, majs, tomater, lök.'),
    ('11111111-2000-4000-8000-000000000016',
     'Gyros, bacon, majs, lok, BBQ-sas.',
     'Gyros, bacon, majs, lök, BBQ-sås.'),
    ('11111111-2000-4000-8000-000000000017',
     'Champinjoner, paprika, ananas, tomater, oliver, majs, lok.',
     'Champinjoner, paprika, ananas, tomater, oliver, majs, lök.'),
    ('11111111-2000-4000-8000-000000000018',
     'Sallad, tomater, gurka, oliver, vitost, sas.',
     'Sallad, tomater, gurka, oliver, vitost, sås.'),
    ('11111111-2000-4000-8000-000000000019',
     'Valj mellan kebab, gyros eller kyckling. Jalapenos, majs, lok, tacosas, sas.',
     'Välj mellan kebab, gyros eller kyckling. Jalapeños, majs, lök, tacosås, sås.'),
    ('11111111-2000-4000-8000-000000000021',
     'Valj mellan kebab, gyros eller kyckling. Sallad, tomat, gurka, feferoni, lok, sas.',
     'Välj mellan kebab, gyros eller kyckling. Sallad, tomat, gurka, feferoni, lök, sås.'),
    ('11111111-2000-4000-8000-000000000022',
     'Samma goda pizzor, aven pa glutenfri botten. Fraga personalen om dagens utbud.',
     'Samma goda pizzor, även på glutenfri botten. Fråga personalen om dagens utbud.'),
    ('11111111-3000-4000-8000-000000000008',
     'Kramig tonfiskrora.',
     'Krämig tonfiskröra.'),
    ('11111111-3000-4000-8000-000000000009',
     'Skagenrora.',
     'Skagenröra.'),
    ('11111111-3000-4000-8000-000000000010',
     'Ost och gronsaker.',
     'Ost och grönsaker.'),
    ('11111111-3000-4000-8000-000000000015',
     'Skivad notkott.',
     'Skivad nötkött.'),
    ('11111111-3000-4000-8000-000000000016',
     'Notburgare.',
     'Nötburgare.'),
    ('11111111-3000-4000-8000-000000000017',
     'Not tacofars, guacamole, nachos.',
     'Nöt tacofärs, guacamole, nachos.'),
    ('11111111-4000-4000-8000-000000000001',
     'Kyckling, bacon, dubbel mild ost, mozzarella, paprika, lok, vitloksdressing.',
     'Kyckling, bacon, dubbel mild ost, mozzarella, paprika, lök, vitlöksdressing.'),
    ('11111111-4000-4000-8000-000000000002',
     'Skivad notkott, dubbel mild ost, mozzarella, paprika, lok, chilimajonnas.',
     'Skivad nötkött, dubbel mild ost, mozzarella, paprika, lök, chilimajonnäs.'),
    ('11111111-4000-4000-8000-000000000003',
     'Peperoni, salami, dubbel amerikansk ost, mozzarella, paprika, lok, chilimajonnas.',
     'Peperoni, salami, dubbel amerikansk ost, mozzarella, paprika, lök, chilimajonnäs.'),
    ('11111111-5000-4000-8000-000000000001',
     'Bygg din egen sallad eller wrap fran menyn.',
     'Bygg din egen sallad eller wrap från menyn.'),
    ('11111111-6000-4000-8000-000000000004',
     'Kebabsas mild, vitlokssas, BBQ-sas, bearnaisesas, chilibearnaisesas.',
     'Kebabsås mild, vitlökssås, BBQ-sås, bearnaisesås, chilibearnaisesås.')
) AS v("id", "oldDescription", "newDescription")
WHERE i."id" = v."id" AND i."description" = v."oldDescription";
