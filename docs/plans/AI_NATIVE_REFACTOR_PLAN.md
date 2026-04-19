# Feedback + Reviderad Plan: AI-Native Arkitektur och Refaktor

## Context

Användaren har skrivit en 9-sektions arkitekturplan och bett om kritisk feedback. Jag har verifierat planens antaganden mot faktisk kod i `/home/user/kollegan-demo` och ställt fyra beslutande frågor. Användaren har beslutat:

1. **Docs-strategi:** Full rewrite av canonical docs.
2. **AI-regel-struktur:** En källa (`docs/AI_ENGINEERING.md`) + tunna proxies (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`) + Claude-skills i `.claude/skills/` + CI-checksum-gate.
3. **API-versionering:** URL-versionering `/api/v1/` direkt från start.
4. **UI-split:** Render-tester för alla filer (ingen feature-flag-infra).
5. **Feature-flags:** Finns inte i koden (verifierat — ingen `feature_flag`-tabell i Prisma, inga referenser i `src/`). Eftersom render-tester valts för split är flags inte blockerande, men kan läggas till senare om gradvis rollout önskas.

Denna fil är både feedback på den ursprungliga planen och den reviderade plan som användaren godkänt per ovan.

---

## 1. Verifierad ground truth (vad som redan finns)

Innan feedback: några av planens "att göra"-punkter är redan gjorda. Det påverkar prioritet.

- **DDD-lagring finns redan** i `src/modules/`. 13 supporting-moduler, 2 core, 5 generic, samtliga med `domain/`, `application/`, `infrastructure/`, `events/`, `index.ts`. Planens "införa DDD-lager" ska alltså skrivas om till "**håll fast vid och upprätthåll** DDD-lagren".
- **API-routes är redan thin re-exports**. Exempel: `src/app/api/offers/route.ts` gör `export { handleListOffers as GET, handleCreateOffer as POST } from '@modules/supporting/offers'`. Handlers ligger i `src/modules/supporting/offers/api/handlers/`. Planens punkt om "route.ts ska vara tunn" är alltså inte en refaktor utan en regel att **bevara**.
- **Centraliserad API-klient finns** i `src/shared/lib/api-client.ts` (`fetchWithRefresh`, `apiGet`, etc). Det som saknas är **feature-specifika wrappers** (`offers.api.ts` etc) — inte bas-infrastrukturen.
- **Docs är redan omfattande**: `docs/ARCHITECTURE.md` (43.7 KB), `docs/API_PLATFORM.md` (49.6 KB), `docs/PLATFORM_ARCHITECTURE.md` (24.7 KB). "Skriva om canonical docs" är alltså en 100+ KB rewrite — stor risk för regression av information.
- **Problematisk migration bekräftad**: `prisma/migrations/20260418193000_project_subsystem/migration.sql` rad 3–5 innehåller `DROP TABLE IF EXISTS "prj_tasks" CASCADE; DROP TABLE IF EXISTS "prj_projects" CASCADE;`. Planens oro är alltså **validerad** mot verklig kod, inte teoretisk.
- **Inga AI-instruktionsfiler finns**: ingen `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, ingen `ai/skills/` eller `.claude/skills/`. Detta är alltså greenfield.

---

## 2. De verkliga monoliterna (ska högst upp i planen)

Planen nämner `offerter/page.tsx` i förbifarten i sektion 6. Det undervärderar risken. De två största riskfilerna:

| Fil | Rader |
|---|---|
| `src/app/offerter/publik/[token]/page.tsx` | **2,884** |
| `src/app/(dashboard)/(shell)/offerter/page.tsx` | **2,795** |
| `src/app/(dashboard)/(shell)/installningar/utseende/page.tsx` | 711 |
| `src/app/(dashboard)/(shell)/mallar/[id]/page.tsx` | 518 |
| `src/app/(dashboard)/(shell)/mallar/page.tsx` | 477 |
| `src/app/(auth)/logga-in/page.tsx` | 450 |
| `src/app/(dashboard)/(shell)/projekt/[id]/page.tsx` | 391 |

Att splittra 2,884 rader utan beteendeändring kräver **mer** än "extrahera utan beteendeändring först". Det kräver:
- snapshot/DOM-tester före split,
- ett feature-flag på `/api/offers/public/[token]` för att parallell-köra gammal/ny renderer,
- explicit state-ownership-karta (vilka useState/useEffect som rör vilken sub-komponent).

Detta bör vara en egen fas, inte en punkt i Phase 4.

---

## 3. Brister & rekommenderade revideringar

### 3.1 Phase-ordning: AI/docs före refaktor är rätt, men saknar contract-tests

Phase 1 (docs + AI + safety) ger ingen beteenderisk. Bra. **Men** innan Phase 4 (UI split) behövs **Phase 3.5: Regression-skydd**:
- `@testing-library/react` render-tester för offerter-list och public offer som fångar viktiga flöden (skapa, skicka, signera, PDF).
- API-contract-tests (mat mot verklig handler) för `/api/offers`, `/api/offers/[id]`, `/api/offers/public/[token]`, `/api/projects`.
- Utan detta är "extrahera utan beteendeändring" önsketänkande.

### 3.2 AI-skills-placering är oklar

Planen säger `ai/skills/` — men:
- **Claude Code** läser `.claude/skills/` (projekt) eller `~/.claude/skills/` (user). Inte `ai/skills/`.
- **Codex** läser `AGENTS.md` i repo-rot och dess parents.
- **Copilot** läser `.github/copilot-instructions.md`.

En delad `ai/skills/`-mapp upptäcks inte av något verktyg automatiskt. Rekommendation:
- Behåll `AGENTS.md` + `CLAUDE.md` + `.github/copilot-instructions.md` som korta pekare.
- Placera faktiska skills i `.claude/skills/` (Claude-format: `SKILL.md` per skill).
- Låt `AGENTS.md` referera till `docs/AI_ENGINEERING.md` för Codex (som läser det som vanlig text).

### 3.3 API-versionering är oavgjord

Planen säger "API response shape får inte ändras utan adapter/versionering" men definierar ingen strategi. Eftersom planen också säger "framtida mobilapp ska konsumera samma API" är detta ett låst vägval nu:

- Alternativ A: URL-versionering (`/api/v1/offers`). Dyr att införa senare.
- Alternativ B: Additiv-endast (nya fält får läggas till, gamla får aldrig tas bort eller byta typ). Billigt, fungerar om disciplin finns.
- Alternativ C: Header-versionering (`Api-Version: 2026-04-19`). Bra för externa API, overkill internt.

Rekommendation: **B nu, plus en policy-fil** `docs/API_VERSIONING.md`. Ingen URL-version förrän första mobil-release.

### 3.4 Production Data Safety saknar CI-gate

Planen listar krav (backup, rollback, pg_dump) men inget **automatiskt gate**. Utan gate är det ett dokument, inte ett skydd. Rekommendation:
- GitHub Actions-check: `scripts/check-migration-safety.sh` som scannar nya `.sql`-filer i `prisma/migrations/**` efter `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM` (utan WHERE). Failar PR om träff saknar label `data-safety-approved`.
- ESLint-regel eller grep-check mot `deleteMany` utan `where` i `src/modules/**/infrastructure/**`.

### 3.5 Den historiska DROP-migrationen är inte "avklarad" bara för att den är committad

Migrationen `20260418193000_project_subsystem` dropar `prj_tasks` och `prj_projects` vid körning på **vilken DB som helst** där den inte redan körts. Ny staging, ny dev-setup, eller en återställd backup → droppar data. Planen behandlar den som "historisk" vilket är halvsant.

Rekommendation:
- Markera migrationen som "only-safe-on-DBs-created-before-SHA-abc123" i en kommentar.
- Lägg till en preflight-check i migrations-runnern som failar om någon av tabellerna har rader > 0.
- Alternativt: skriv en kompenserande `0000_preflight_guard/migration.sql` som kräver env-flag för att köra DROP-historiken.

### 3.6 Mobile-first som Phase 5 är för sent

Om komponenter extraheras i Phase 4 utan mobile-first-constraints kommer mobile-pass att innebära **omskrivning**, inte **tillägg**. Rekommendation: slå ihop Phase 4 och 5 — varje extraktion måste lämna in mobil-, tablet- och desktop-state samtidigt. Accepts CI-block om Storybook-viewport-tests inte täcker alla tre.

### 3.7 Branding: namnen krockar med befintlig kod

Koden har redan:
- `src/modules/supporting/offers/application/company-branding.ts`
- `src/modules/supporting/offers/application/offer-branding-profile.ts`

Planens `platformBrand` / `companyBrand` måste **reconciliera** med dessa, inte introducera parallella termer. Rekommendation:
- Behåll `companyBranding` som namn (det finns).
- Lägg till `platformBranding` på samma nivå i en ny `src/shared/branding/` eller `src/modules/generic/branding/`.
- Resolver: `resolveBranding({ companyId, orgId })` → `{ platform, company, merged }`.

### 3.8 Demo-isolering är underspecifierad

`src/modules/demos/hotel/` finns redan och är ganska isolerad. "Isoleras som separat intern sälj-/showcase-yta" kan betyda flera saker:
- Separat subdomän? Separat deploy?
- Feature-flag som gömmer demos i prod-UI?
- Egen Prisma-schema med `demo_hotel.prisma` (finns redan)?

Rekommendation: välj **en** av dessa och skriv den i planen. Annars blir det ingen.

### 3.9 Docs: revidera, inte rewrite

`docs/ARCHITECTURE.md` (43 KB) och `docs/API_PLATFORM.md` (49 KB) är **live och aktuella**. En full rewrite riskerar att tappa nyanser. Rekommendation:
- Skriv om bara de sektioner som motsäger den nya planen.
- Lägg AI-lagret och Production Data Safety som **nya** docs.
- Lägg en "ändringsbudget" i Phase 1: max N rader per canonical doc utan separat review.

### 3.10 Enforcement (Phase 6) behöver konkreta verktyg

"Lint/dependency-regler" är för vagt. Konkreta val:
- `eslint-plugin-boundaries` eller `dependency-cruiser` för att blocka `src/app/**` → `src/modules/**/infrastructure/` och `src/app/**` → `@prisma/client`.
- `eslint-plugin-filenames` eller egen ESLint-regel för max-file-LOC (warn > 500, error > 1000).
- API-contract-tests via `zod` schemas återanvända i test (finns redan Zod i handlers).

---

## 4. Vad planen får helt rätt (behåll)

- **Additiv-först dataphilosophy**: rätt.
- **Små PR:er framför stor rewrite**: rätt.
- **pg_dump + commit SHA innan deploy**: rätt, bara lägg till CI-gate.
- **Feature-API-clients ovanpå `fetchWithRefresh`**: rätt — basen finns, wrappers saknas.
- **Browser får inte importera Prisma/services**: rätt, och kan enforcas via dependency-cruiser.
- **Separat public-offer-rendering från dashboard**: kritiskt, de är i dag 2,884 + 2,795 rader.

---

## 5. Reviderad prioriteringsordning (beslutad)

| Fas | Innehåll | Risk |
|---|---|---|
| 1 | `docs/AI_ENGINEERING.md` (enda sanningen) + tunna proxies (`AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`) + `.claude/skills/` + CI-checksum-gate | Låg |
| 2 | `docs/PRODUCTION_DATA_SAFETY.md` + `scripts/check-migration-safety.sh` + GitHub Actions-gate för `DROP TABLE`/`DROP COLUMN`/`TRUNCATE` | Låg |
| 3 | Full rewrite av `README.md`, `docs/ARCHITECTURE.md`, `docs/API_PLATFORM.md`, `docs/PLATFORM_ARCHITECTURE.md`, modul-READMEs. Nya docs: `docs/FRONTEND_GUIDELINES.md`, `docs/BRANDING_AND_THEMING.md`, `docs/REFACTORING_PLAYBOOK.md`, `docs/API_VERSIONING.md` | Låg |
| 4 | Render-tester (`@testing-library/react` + `vitest`) för de 7 största sidorna (offerter, publik offer, mallar, projekt, utseende, logga-in, projekt-detalj). Contract-tests för `/api/offers/**`, `/api/projects/**`, `/api/offers/public/[token]` | Låg |
| 5 | **URL-versionering:** flytta alla routes `src/app/api/**` → `src/app/api/v1/**`. Lägg HTTP 410 + redirect på icke-versionerade paths i 3 månader, sedan ta bort. Uppdatera alla klientanrop i samma PR | Medel |
| 6 | Feature-API-clients (`offers.api.ts`, `projects.api.ts`, `companies.api.ts`, `products.api.ts`) som wrappers ovanpå `fetchWithRefresh` och pekar på `/api/v1/` | Låg |
| 7 | Branding-resolver (platform + company, reconcilierat med befintliga `company-branding.ts` och `offer-branding-profile.ts`) | Medel |
| 8 | **Public offer page split** (2,884 rader) — render-tester körs, extrahera steg för steg, verifiera efter varje commit | Hög |
| 9 | **Offerter dashboard split** (2,795 rader) — samma metod | Hög |
| 10 | Mindre page-splits (mallar, projekt-detalj, inställningar) mobile-first i samma PR | Medel |
| 11 | Enforcement: `dependency-cruiser` eller `eslint-plugin-boundaries` för förbjudna imports, max-file-LOC warn > 500/error > 1000, contract-tests i CI | Låg |
| 12 | Demo-isolering (val av subdomän/flag/prod-kill ännu inte beslutat — ta i eget mini-RFC innan denna fas) | Låg |

---

## 6. Beslutade svar + kvarvarande frågor

**Beslutade:**
1. API-versionering: **URL `/api/v1/` direkt.**
2. AI-skills-placering: **`.claude/skills/` + `docs/AI_ENGINEERING.md` som enda sanning + thin proxies.**
3. Docs: **Full rewrite.**
4. UI-split: **Render-tester för alla filer, ingen feature-flag-infra nu.**
5. Feature-flag-mekanism: **Finns inte. Skjuts upp — inte blockerande med tester.**

**Kvarvarande inför exekvering:**
- **Demo-isolering:** ta mini-RFC innan fas 12 (subdomän, flag, prod-kill, eller nöja sig med nuvarande modul-isolering?).
- **Branding-resolver-placering:** `src/shared/branding/` eller `src/modules/generic/branding/`? Jag föreslår `src/modules/generic/branding/` eftersom generic-mappen redan finns (`src/modules/generic/{dashboard,portal,team-hub,analytics,projects}`) och detta är samma sorts tvärgående funktionalitet.
- **Historisk DROP-migration:** ska vi lägga till en preflight-guard nu (fas 2) eller i egen PR?

---

## 7. Kritiska filer att referera vid exekvering

- `src/app/offerter/publik/[token]/page.tsx` (2,884 rader) — största splittarget.
- `src/app/(dashboard)/(shell)/offerter/page.tsx` (2,795 rader) — näst största.
- `src/modules/supporting/offers/api/handlers/offer.handler.ts` — bekräftar thin-route-pattern.
- `src/shared/lib/api-client.ts` — bas för feature-API-clients.
- `src/modules/supporting/offers/application/company-branding.ts` — branding-reconciliering.
- `src/modules/supporting/offers/application/offer-branding-profile.ts` — samma.
- `prisma/migrations/20260418193000_project_subsystem/migration.sql` — DROP TABLE-migration som behöver guard.
- `docs/ARCHITECTURE.md`, `docs/API_PLATFORM.md`, `docs/PLATFORM_ARCHITECTURE.md` — befintliga canonical docs.

---

## 8. Fördjupning på öppna frågor (2026 best practice)

### 8.1 AI-instruktioner för Claude + Codex (enterprise 2026)

**Så fungerar det tekniskt:**

| Verktyg | Vad det läser automatiskt | Format |
|---|---|---|
| **Claude Code** | `CLAUDE.md` (repo-rot och alla parents), `.claude/skills/*/SKILL.md`, `.claude/commands/*.md`, `.claude/settings.json` | Markdown + frontmatter |
| **Codex CLI** (OpenAI) | `AGENTS.md` (repo-rot och alla parents) | Ren markdown, inga skills-konventioner |
| **Copilot** | `.github/copilot-instructions.md` (repo-rot) | Ren markdown |
| **Cursor/Windsurf** | `.cursorrules` / `.windsurfrules` | Ren markdown |

**Kärnproblemet du pekar på:** Claude har skills (paketerade med metadata, on-demand-laddning via `SKILL.md`-frontmatter); Codex har bara en platt `AGENTS.md`. Det finns ingen standard som båda respekterar.

**Enterprise best practice 2026** (det som större team gör):

1. **En källa till sanning för *regler***: `docs/AI_ENGINEERING.md` som innehåller alla regler i vanlig markdown. Ingen agent-specifik syntax.
2. **Tunna proxyfiler** i repo-rot som pekar dit:
   - `AGENTS.md` (10–30 rader): "Read docs/AI_ENGINEERING.md. Always start with git status. Follow DDD layers. Protect production data."
   - `CLAUDE.md` (10–30 rader): samma innehåll, plus "Skills in .claude/skills/".
   - `.github/copilot-instructions.md` (10–30 rader): samma innehåll.
3. **Claude-specifika skills** i `.claude/skills/` — *men* bara för saker som kräver Claudes on-demand-laddning (t.ex. "production-data-safety" som laddas när migration-filer rörs). Varje skill har också en rad i `docs/AI_ENGINEERING.md` som beskriver den i klartext, så Codex läser regeln även utan skill-mekanismen.
4. **CI-gate** som failar om `AGENTS.md`, `CLAUDE.md` och `.github/copilot-instructions.md` har divergerat i kärnregler (script jämför checksummor på en normaliserad "rules"-sektion).

**Netto:** Claude och Codex följer *samma* regler (från `docs/AI_ENGINEERING.md`). Claude får därutöver extra verktyg via skills, men inga regler som Codex inte också har.

**Rekommendation:** Alternativ **A** med denna struktur. Inte alternativ C (duplicering utan sync gör att de divergerar inom månader).

---

### 8.2 API-versionering: för/nackdelar för mobil-först + framtida app

Kontext: browser nu, mobilapp om 6–18 månader, samma backend.

#### Alternativ A: Additiv-endast policy (ingen versionering)
- **Regler:** Nya fält får läggas till. Fält får aldrig tas bort. Fälttyp får aldrig ändras. Obligatoriska fält får aldrig bli valfria och vice versa.
- **Pro:** Noll overhead nu. Backend förenklas (ingen versionshantering). Fungerar utmärkt så länge disciplin finns.
- **Con:** Om du senare *måste* göra en breaking change har du inga verktyg — du måste då införa URL-versionering i panik. Discipline-driven, inte verktygsdriven.
- **Passar:** Små team, tidiga produkter, interna API:er. Vanligt hos startups fram till serie A.

#### Alternativ B: URL-versionering (`/api/v1/offers`)
- **Regler:** Varje breaking change bumpar versionen. `/api/v1/` behålls tills alla konsumenter migrerat.
- **Pro:** Explicit, lätt att felsöka (versionen syns i loggar/nätverkstab). Mobilappen kan låsa `/api/v1/` och uppgradera i egen takt. Standard i enterprise.
- **Con:** Mekaniskt arbete nu att prefixa alla 50+ routes. Varje ny version kräver dubbel kodbas tills gamla klienter migrerat. Server behöver route-mellanlager.
- **Passar:** Team med extern API-yta, mobilapp som distribueras via App Store (gamla versioner dröjer kvar i månader).

#### Alternativ C: Header-versionering (`Api-Version: 2026-04-19`)
- **Regler:** Klienten skickar en datum-header. Servern returnerar det kontrakt som gällde det datumet (Stripe-modellen).
- **Pro:** URL:er förblir rena. Stripe gör det. Maximalt flexibelt.
- **Con:** Komplex implementation (versionsadaptrar per breaking change). Svårt att felsöka (header syns inte i URL). Överkurs för interna API:er.
- **Passar:** Företag som säljer API som produkt (Stripe, Twilio, Shopify).

**För ditt case** (ERP med webb nu, mobilapp om 6–18 mån, inget publikt API):

Den pragmatiska vägen är **hybrid**: börja med **A (additiv)**, men bygg routes från dag ett på ett sätt som gör framtida **B** billigt:
- Lägg alla handlers i `src/modules/**/api/handlers/` (redan gjort).
- Låt `src/app/api/offers/route.ts` vara thin re-export (redan gjort).
- Om du någonsin behöver `v2`, skapa `src/app/api/v2/offers/route.ts` som re-exporterar en `v2-handler`. Inga andra routes påverkas.
- Dokumentera policyn i `docs/API_VERSIONING.md`: "Additiv-endast. URL-version (v2) införs *endast* vid breaking change för extern konsument."

**Konkret för mobilappen:** När mobil-teamet börjar, låsa de en datumstämpel (t.ex. "vi baseras på API per 2026-10-01") och du åtar dig att additiv-only från den dagen. Om du måste bryta, introducerar du `/api/v2/` *bara för de bristande routes*, inte för hela API:et.

**Rekommendation:** **A nu + förberedelse för B senare.** C är overkill om du inte säljer API:et externt.

---

### 8.3 UI-splittstrategi: hur man delar en 2 884-radersfil säkert

Kontext: `src/app/offerter/publik/[token]/page.tsx` är den publika offertvyn som kunder ser innan de signerar. Om den buggar under split → förlorad affär.

#### Alternativ A: Feature-flag + A/B parallell-kör
- **Vad det betyder konkret:**
  1. Behåll nuvarande fil som `page-legacy.tsx`.
  2. Bygg ny splittad version som `page-next.tsx` (med `<OfferHeader>`, `<LineItemsTable>`, `<SignaturePanel>` etc).
  3. `page.tsx` blir en router: `if (featureFlag.get('public-offer-v2', { offerId })) return <PageNext/>; else return <PageLegacy/>;`
  4. Aktivera flag för 1 % av trafik. Mäta fel. Öka till 10 %, 50 %, 100 %. Ta sedan bort `page-legacy.tsx`.
- **Pro:** Säkraste vägen. Kan rulla tillbaka omedelbart om kunder rapporterar fel. Mäter faktisk produktion, inte teoretiska tester.
- **Con:** Kräver feature-flag-mekanism (GrowthBook, LaunchDarkly, Unleash, eller egen DB-tabell). Dubbel kod i flera veckor. Fler testfall (bägge paths ska hållas gröna).
- **När:** Hög-risk vyer (public offer, signering, betalning).

#### Alternativ B: Render-tester + direkt extraction
- **Vad det betyder konkret:**
  1. Skriv `@testing-library/react`-tester som renderar hela sidan med fixtures och asserterar att viktiga element finns, att en signatur kan skapas, att PDF-länken funkar.
  2. Kör testerna → grönt.
  3. Extrahera en komponent i taget (t.ex. `<LineItemsTable>`). Kör tester → grönt. Commit.
  4. Upprepa tills filen är < 500 rader.
- **Pro:** Ingen dubbel kod. Ingen flag-infrastruktur. Snabbare att nå mål.
- **Con:** Om testet missar ett edge-case (t.ex. en viss kundkonfig) kan det nå produktion. Manuell regressionstestning måste komplettera.
- **När:** Medel-risk vyer (mallar, projektlista, företagslista).

#### Alternativ C: Branch-baserad refactor + staging-snapshot
- **Vad det betyder konkret:**
  1. Skapa `refactor/public-offer-split`-branch.
  2. Splitta helt på branchen.
  3. Deploya branchen till staging med en kopia av prod-databasen (`pg_dump` → staging).
  4. Manuellt gå igenom 20 verkliga offerter i staging-UI:t.
  5. Merga till main när alla 20 ser identiska ut som i prod.
- **Pro:** Verifierar mot verklig data, inte fixtures. Inga kodändringar i main förrän verifierat.
- **Con:** Långsam feedback. Kräver att staging speglar prod (schema + ev. läskopia av data). Ingen automatisk rollback om bug upptäcks i prod senare.
- **När:** Om du inte har feature-flag-infra och inte litar på render-tester.

**Rekommendation per fil:**

| Fil | Rader | Risk | Strategi |
|---|---|---|---|
| `offerter/publik/[token]/page.tsx` | 2 884 | Extremt hög (kund-facing) | **A (feature-flag)** |
| `(dashboard)/(shell)/offerter/page.tsx` | 2 795 | Hög (intern, men dagligt) | **A eller B**, beror på om flag-infra finns |
| `mallar/[id]/page.tsx` | 518 | Medel | **B** |
| `mallar/page.tsx` | 477 | Medel | **B** |
| `projekt/[id]/page.tsx` | 391 | Medel | **B** |
| `installningar/utseende/page.tsx` | 711 | Låg (konfig) | **B** |

**Vad du måste besluta:**
1. Har ni en feature-flag-mekanism? Om inte, ska den införas som del av detta arbete?
2. Kan staging få en säker kopia av prod-data (eller anonymiserad kopia) för Alternativ C?

---

## 9. Verifieringsplan för själva feedbacken

Om planen revideras enligt ovan, kör före merge av första PR:
- `npx tsc --noEmit`
- `npm run lint`
- `npx vitest run`
- `npm run build`
- Scanna `prisma/migrations/**/*.sql` för `DROP TABLE|DROP COLUMN|TRUNCATE`.
- Spot-check: räkna rader i `src/app/**/page.tsx` och bekräfta att ingen fil överstigit startläget.
- Manuell: skapa → skicka → signera → PDF på en testoffert.
