# 3. Leverabler och bilagor

Detta avsnitt beskriver de leverabler som tas fram inom projektet samt var tillhörande underlag och bilagor finns. Fokus i den här delleveransen ligger på det offertsystem som har utvecklats efter omprioriteringen från det ursprungliga CRM-spåret.

## 3.1 Produkt- och systembeskrivning

Projektets huvudsakliga leverabel är ett webbaserat offertsystem utvecklat för KolleganAI. Systemet är utformat för att effektivisera processen att skapa, skicka, följa upp och administrera offerter i ett sammanhållet flöde. Den levererade lösningen är inte bara ett tekniskt experiment utan ett fungerande inkrement av plattformen, byggt för att kunna användas som grund för fortsatt utveckling.

De centrala funktioner som finns i systemet i nuläget är:

- skapa nya offerter
- lista och filtrera offerter utifrån status
- arbeta med mottagare, produktrader och summeringar
- hantera offertmallar
- hantera produkt- och tjänstebibliotek med kategorier
- koppla offerter till företag/avsändare och branding
- generera och visa publika offertvyer för kund
- ladda ned offert som PDF
- acceptera eller avvisa offert via publik kundvy
- spara offertdata, mallar, produkter och företagsinformation i relationsdatabas

Det som har byggts hittills visar att systemet täcker kärnflödet för offertarbete: intern hantering i administrationsgränssnittet och extern kundvy för mottagaren. Offertsystemet är samtidigt utformat så att det på sikt kan kopplas ihop med övriga delar av KolleganAIs plattform, exempelvis leads, kunddata och automatiserade arbetsflöden.

## 3.2 Varför projektet bytte från CRM till offertsystem

Den ursprungliga planen var att utveckla en CRM-plattform med funktioner för autentisering, rollbaserad åtkomst, lead-hantering och aktivitetsloggning. Under projektets gång gjordes dock en omprioritering tillsammans med uppdragsgivaren. Bedömningen var att ett offertsystem skulle ge större direkt affärsvärde i ett tidigare skede än ett mer omfattande CRM-system.

Spårbytet innebar därför att projektet gick från en bred och generell plattformssatsning till en mer avgränsad men verksamhetskritisk del av säljprocessen. Detta gav flera fördelar:

- högre sannolikhet att leverera ett fungerande system inom projektets tidsram
- tydligare koppling mellan utvecklingsarbete och konkret verksamhetsnytta
- möjlighet att snabbare testa användarflöden och förbättra gränssnittet iterativt
- fortsatt möjlighet att längre fram koppla ihop offertsystemet med CRM-funktionalitet

Med andra ord var spårbytet inte ett avbrott i projektet, utan en strategisk förflyttning mot den del av plattformen som bedömdes vara mest värdefull att realisera först.

## 3.3 Teknisk stack

Den tekniska stacken har i huvudsak behållits efter spårbytet. De viktigaste valen är fortfarande moderna webbtekniker som lämpar sig för en skalbar fullstack-lösning.

Nuvarande teknisk stack:

- Next.js 16 och React 19 för webbapplikationens frontend och servernära logik
- TypeScript för typning, struktur och säkrare datahantering
- Prisma som ORM och PostgreSQL som relationsdatabas
- Redis för cache och stöd kring sessions- och driftfunktioner
- Docker Compose för containerbaserad driftmiljö
- Caddy som reverse proxy och TLS-terminering
- Vitest och Playwright för test och verifiering

Det som har förändrats är främst systemets fokus, inte den tekniska grunden. I stället för att optimera för ett bredare CRM-domänlager används stacken nu för ett tydligare offertflöde med mallar, dokumentrendering, publik visning och signering.

## 3.4 Hur arbetet har bedrivits

Projektet har bedrivits enligt agila principer med Scrum som metodstöd. Arbetet har delats upp i sprintliknande iterationer med planering, uppföljning och omprioritering utifrån verksamhetens behov. GitHub har använts för versionshantering och GitHub Projects för backlog och uppföljning. Kommunikation och löpande avstämningar har skett digitalt mellan projektets deltagare och uppdragsgivaren.

Det agila arbetssättet har varit särskilt viktigt eftersom projektet ändrade riktning under genomförandet. Scrum har här fungerat som ett stöd för att kunna omdefiniera backloggen och fokusera på offertsystemet utan att tappa struktur i arbetet.

Sammanfattningsvis har arbetet präglats av:

- iterativ utveckling
- tät återkoppling
- omprioritering utifrån affärsnytta
- kontinuerlig förbättring av funktioner och gränssnitt

## 3.5 Genomförd tidslinje och fortsatt plan

För att tydliggöra att projektet följer en plan presenteras här centrala milstolpar i utvecklingen av offertsystemet.

| Datum | Genomfört arbete |
|---|---|
| 2026-03-07 | Grundläggande databasstöd för offertmodulen infördes. |
| 2026-03-13 | Stöd för offertmallar och utökad dokumentstruktur lades till. |
| 2026-03-15 | Offertnummer, påminnelser, produktbibliotek och giltighetstid byggdes ut. |
| 2026-03-18 | Signerarnamn och signeringsrelaterade fält infördes. |
| 2026-03-19 till 2026-03-20 | E-postfält, avsändarkonfiguration och visuell e-postheader utökades. |
| 2026-04-02 till 2026-04-04 | Produktkategorier, företagskoppling, medlemskap och adress-/brandingfält infördes. |
| 2026-04-09 | Persistens för offentlig offert-PDF och förbättrad publik offertleverans implementerades. |
| 2026-04-10 till 2026-04-11 | Publik offertvy och PDF-rendering stabiliserades och förbättrades visuellt. |
| 2026-04-14 | Leveranspaket, bilagor, skärmdumpar och diagram sammanställdes för rapportering. |

Planerade eller naturliga nästa steg efter denna leverans är:

- fortsatt hårdning av driftmiljön
- förbättrad övervakning, backup och driftsäkerhet
- säkrare administrativ åtkomst och CI/CD-trafik via privat nätverk/VPN
- fortsatt integrering mellan offertsystemet och framtida CRM-funktionalitet

Tidslinjen visar att projektet inte endast består av idéer eller skisser, utan av ett faktiskt genomfört systeminkrement som successivt har byggts ut över flera datumstyrda steg.

## 3.6 Applikation, kod och granskningsinstruktioner

Applikationen levereras som källkod och som körbar webblösning i projektets utvecklingsmiljö. Koden är organiserad modulärt med separata delar för bland annat offertlogik, produktbibliotek, mallhantering, publik kundvy och datalager.

Granskning kan ske på följande nivåer:

- genom läsning av källkod och struktur i projektets repository
- genom granskning av Prisma-scheman och migreringar
- genom granskning av bifogade skärmdumpar och diagram
- genom körning av applikationen i korrekt konfigurerad miljö

Särskilt relevanta tekniska delar i koden är:

- `src/app/(dashboard)/(shell)/offerter/` för interna offertvyer
- `src/app/offerter/publik/[token]/` för kundvyn
- `src/app/api/offers/` för offertrelaterade API-endpoints
- `src/modules/supporting/offers/` för affärslogik och datahantering
- `prisma/schema/offers.prisma` för databasmodell
- `.github/workflows/deploy.yml` för deploy-flöde

## 3.7 Analyser, designspecifikationer och bilagor

Följande underlag bifogas som separata bilagor i detta leveranspaket:

### Bilaga A - Skapa offert

Skärmdump som visar den centrala vyn för att initiera skapande av ny offert. Denna bilaga visar att systemet har ett separat arbetsflöde för att välja mall och fylla i mottagarinformation.

Fil:

- `bilagor/skarmdumpar/bilaga-a-skapa-offert.png`

### Bilaga B - Lista offerter

Skärmdump som visar översiktsvyn för offertsystemet med statusflikar, filtrering och liststruktur. Denna bilaga visar hur användaren kan hantera och följa upp offerter i administrationsdelen.

Fil:

- `bilagor/skarmdumpar/bilaga-b-lista-offerter.png`

### Bilaga C - Kundvy

Skärmdump som visar den publika offertvyn för mottagaren. Denna bilaga visar hur kunden kan läsa offerten, ta del av summering och genomföra digital accept/signering.

Fil:

- `bilagor/skarmdumpar/bilaga-c-kundvy.png`

### Bilaga D - Databasmodell / ER-diagram

Separat diagram som visar de viktigaste entiteterna i offertsystemet och deras relationer, till exempel organisation, företag, offert, mall, produktrad och produktkategori.

Fil:

- `bilagor/diagram/bilaga-d-er-diagram-offertsystem.png`
- `bilagor/diagram/bilaga-d-er-diagram-offertsystem.svg`

### Bilaga E - Driftöversikt för VPS, VPN och GitHub Actions

Separat diagram som beskriver hur applikationen körs i en VPS-miljö och hur GitHub Actions används i deployflödet. Diagrammet visar också den privata nätverkskopplingen mellan applikation och interna tjänster samt hur VPN/WireGuard är relevant för säkrare administrativ åtkomst och CI/CD-kommunikation.

Fil:

- `bilagor/diagram/bilaga-e-driftoversikt-vps-vpn-github-actions.png`
- `bilagor/diagram/bilaga-e-driftoversikt-vps-vpn-github-actions.svg`

## 3.8 Mjukvaruarkitektur, motiv och reflektion

Systemet är uppbyggt som en modulär webbapplikation där domänlogik, API-lager och datalager hålls isär. Detta gör lösningen lättare att underhålla och vidareutveckla. Offertfunktionen ligger i en separat modul och följer samma övergripande arkitektur som resten av plattformen.

Arkitekturvalen har flera fördelar:

- tydligare ansvarsfördelning mellan gränssnitt, affärslogik och databasåtkomst
- lättare testbarhet
- bättre förutsättningar för vidareutveckling och återanvändning
- möjlighet att knyta ihop offertsystemet med andra delar av plattformen senare

Ett viktigt arkitekturellt motiv har varit att kunna leverera ett fungerande delsystem utan att låsa fast hela plattformen i ett alltför stort första steg.

## 3.9 Kodstruktur, förvaltningsbarhet, återanvändning och driftsäkerhet

Under arbetet har stor vikt lagts vid att organisera koden så att den är begriplig och möjlig att vidareutveckla. Namngivning, modulindelning och separering mellan olika ansvar har varit viktiga förvaltningsaspekter. Det märks bland annat i att offertmodulen innehåller egna repositories, tjänster, API-handlers och domänobjekt.

Även driftsäkerhet har beaktats i lösningen:

- deploy-flödet är automatiserat via GitHub Actions
- applikationen är avsedd att köras i containerbaserad miljö på VPS
- omvänd proxy och HTTPS hanteras via Caddy
- databasmigreringar körs i samband med deploy
- Redis och PostgreSQL ligger som separata tjänster i driftmiljön

I projektets repository finns en faktisk deploy-workflow för VPS-miljön. Vid push till huvudgrenen körs ett arbetsflöde som ansluter till servern, hämtar senaste kod, installerar beroenden, bygger applikationen, kör Prisma-migreringar och startar om tjänsten. Detta visar att projektet inte bara levereras som kod, utan även med ett tydligt driftsättningsspår.

Samtidigt finns dokumentation för en hårdare och mer säker driftmodell där administrativ åtkomst och CI/CD-trafik ska gå via privat tunnel, exempelvis WireGuard/VPN, i stället för att exponera intern infrastruktur offentligt. Detta är särskilt relevant eftersom applikationen använder interna tjänster som databas och Redis, och dessa bör hållas utanför publik åtkomst.

## 3.10 Kvalitetskriterier

De viktigaste kvalitetskriterierna i detta skede har varit:

- användbarhet
- tydligt användarflöde
- teknisk struktur
- möjlighet till fortsatt utveckling
- driftsättningsbarhet

Användbarhet har hanterats genom att lägga stor vikt vid centrala vyer som offertlista, offertskapande och kundvy. Strukturen i systemet har hanterats genom modulär kod, tydlig datamodell och separata lager för logik och dataåtkomst. Kravet på driftsättningsbarhet har hanterats genom containerstöd, serverkonfiguration och ett GitHub Actions-baserat deployflöde.

Sammanfattningsvis visar leverablerna i denna delleverans både vad som har gjorts och hur resultatet kan granskas. De separata bilagorna kompletterar huvudtexten och gör det möjligt att bedöma systemets funktionalitet, arkitektur och mognad utan att granskaren behöver gissa eller leta efter materialet.
