# Demo Guide For Dennis

This guide is meant for `dennis@soleria.se` so he can present the system clearly at school as a product demo, not just as code.

## Demo account

- Email: `dennis@soleria.se`
- Password: `dennis123`
- Seed script: `prisma/seed/create-dennis-demo.ts`

If the account does not already exist in the database, run:

```bash
npx tsx prisma/seed/create-dennis-demo.ts
```

## What the website is

The website is an offer and quotation workflow system inside the Soleria / Kollegan platform. The main idea is that staff can:

- manage companies and branding
- create reusable offer templates
- manage a product library
- create and send offers
- let the customer view and sign the offer through a public-facing link

In short: it covers the core flow from internal sales work to customer-facing offer acceptance.

## The simplest way to present it

Dennis should present the website as a connected workflow instead of as isolated pages.

Suggested order:

1. Log in and show the dashboard shell
2. Go to `Offerter` and explain the overview
3. Go to `Ny offert` and explain how a new offer starts
4. Go to `Mallar` and explain that templates define the visual structure
5. Go to `Produktbibliotek` and explain reusable products/services
6. Go to `Företag` / company settings and explain branding and sender identity
7. Show the public customer view and explain signing / approval
8. End with infrastructure and security talking points

## Walkthrough of the website

### 1. Login

Start by saying:

> "This is a role-based internal system where staff log in to manage offers, templates, branding, products and customer-facing documents."

What Dennis should do:

- open the login page
- log in with the demo account
- point out that the system is an internal staff interface

### 2. Offerter

This is the core presentation page.

What exists here:

- status tabs such as draft, sent, viewed, accepted and declined
- search and filtering
- table/list overview of offers
- entry point for creating a new offer

Talking point:

> "This page gives the sales team one place to track the lifecycle of offers, from creation to acceptance."

### 3. Ny offert

This is the start of the offer creation flow.

What exists here:

- company selection
- template selection
- recipient inputs
- live preview-oriented layout

Talking point:

> "A new offer starts by choosing the selling company, selecting a template and then defining the recipient. The structure is meant to make the offer feel like a real branded document early in the flow."

If there are no templates in the environment, Dennis can still explain:

- that the system is template-driven
- that the offer flow is designed to load a company-specific visual template
- that templates and products are managed separately and then reused in offer creation

### 4. Mallar

This page is about reusable offer templates.

What exists here:

- template overview
- create new template
- preview template
- duplicate / delete template actions
- company-scoped template handling

Talking point:

> "Templates separate document design from the actual offer data. That means the team can reuse the same branded structure for many offers instead of rebuilding each document from scratch."

### 5. Produktbibliotek

This area is for reusable products and services.

What it is for:

- standard product entries
- standard services
- categories
- pricing reuse

Talking point:

> "The product library reduces manual work and makes the pricing more consistent, because sales staff can reuse existing products and services instead of typing everything manually each time."

### 6. Företag / company setup

This area matters because the platform is multi-company / multi-brand aware.

What exists conceptually:

- company profile
- logo and branding
- sender name / sender email
- address and legal company details
- company memberships

Talking point:

> "The company layer controls branding, sender identity, templates and products. This makes it possible to use the same platform for different brands or selling entities."

### 7. Public customer view

This is one of the strongest parts of the demo, because it shows the external side of the system.

What exists here:

- branded offer document
- customer-facing summary
- PDF support
- acceptance / decline flow
- digital signature area

Talking point:

> "After the internal team creates and sends an offer, the customer gets a clean public-facing page where they can read, download and sign the offer. That bridges the internal workflow with the external client experience."

### 8. Settings and admin areas

These pages support the platform and make it feel like a complete internal system.

Examples of what exists in navigation:

- profile
- users
- security
- notifications
- company settings
- appearance / visual preferences
- integrations / connections

Talking point:

> "The system is not only a document page. It also includes the account, company, notification and appearance layers needed to run it as a real internal platform."

## Short demo script Dennis can say out loud

> "This platform is built to manage the full offer workflow. Internally, staff can handle companies, templates, products and offers. Externally, the customer receives a public-facing offer page where they can review and sign the offer. The purpose is to reduce manual administration and make the sales flow more structured, branded and traceable."

## Infrastructure talking points

Dennis can present the infrastructure in simple terms like this:

- The application is deployed on a VPS and is not just a local school prototype.
- We use GitHub as the source of truth and GitHub Actions / workflows for deployment automation.
- The VPS setup is hardened so only controlled access paths are allowed.
- SSH is not exposed as a normal open management path for the whole internet.
- The only SSH entry is through port `2222`, and that access is hardened with SSH keys.
- Normal public IP-based SSH access is not how administration is intended to happen.
- Administrative access goes through a WireGuard VPN layer, which restricts who can even reach the internal environment.
- The same private networking approach is used around internal services such as PostgreSQL and Redis.
- Fail2ban is used as an extra hardening layer to reduce brute-force and repeated bad access attempts.
- PostgreSQL backups are part of the operational story, which is important when presenting the system as something closer to a real production platform.
- The point of this setup is to show that the project includes not only application features but also operational thinking around security, availability and controlled access.

## More technical infrastructure version

If Dennis wants a slightly more technical explanation, he can say:

> "The system is hosted on a VPS behind a controlled network setup. Deployment is connected to GitHub Actions, while access to the server is restricted and hardened through SSH keys, port hardening and VPN-based access. WireGuard is used to keep sensitive services such as PostgreSQL and Redis behind private networking. We also use hardening measures such as Fail2ban and PostgreSQL backups to improve security and operational resilience."

## Important presentation angle

Dennis does not need to present every page in detail. He should focus on the story:

- internal configuration
- reusable business data
- offer creation
- customer-facing approval
- secure deployment and infrastructure

That is enough to make it feel like a coherent system rather than a collection of unrelated screens.

## Temporary regression note

Dennis should mention clearly that there is a temporary regression in the current website state.

Suggested wording:

> "There has been some regression in the website because we intentionally moved back a few commits to inspect and compare behaviour. That means a few parts are visually incorrect right now, especially the desktop template flow, the desktop public offer view and the final PDF download output. The current visual issues are therefore part of a temporary rollback/checking process, not the intended final UX."

Shorter version:

> "Some desktop visuals are temporarily incorrect because we rolled back a few commits to verify a regression, mainly around templates, the public offer page and the final PDF rendering."

This helps frame the demo properly:

- the product flow is still understandable
- the current visual state is not the intended final polish
- the regression is known and being inspected deliberately

## If Dennis gets asked why the desktop view looks off

He can answer:

> "The reason it looks a bit off on desktop right now is that we are comparing versions to isolate a regression. We temporarily went back a few commits to inspect the behaviour around the template rendering, the public offer layout and the generated PDF output. So what you are seeing is a debugging state, not the final intended design."
