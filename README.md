# Beacon Technology & AI Solutions Website

Responsive Next.js business website with services, solutions, about, and working contact form (once configured).

## Run locally

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Run `npm run dev`.
4. Visit http://localhost:3000.

## Configure contact form

1. Create a Resend account and verify a sending domain.
2. Copy `.env.example` to `.env.local`.
3. Set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_FROM_EMAIL` to your real values. The FROM address must be on your verified domain.
4. Restart the dev server. Never commit `.env.local`.
5. In production, set the same environment variables in Vercel.

The contact form validates inputs, has a basic honeypot and emails inquiries through Resend. Before a public launch, add rate limiting, bot protection, and a real privacy policy. The footer email is a placeholder and must be replaced.

## Deploy

Push the repository to GitHub, import it into Vercel, add environment variables, deploy, and connect your domain. Test contact delivery and mobile layout before advertising.

## Customize

Edit `app/page.tsx` for content and branding; `app/globals.css` for colors and layout; `app/layout.tsx` for SEO metadata. Replace placeholder email, add legal pages, and only publish case studies you have permission to use.

## Interactive edition

The homepage now includes a horizontally swipeable capability carousel, animated architecture preview, and three clickable simulated AI demonstrations (document extraction, supply chain risk, and computer vision). Demo outputs are static examples and do not call any AI API. Consulting/team messaging is intentionally forward-looking; do not claim staff, clients, certifications or outcomes that cannot be verified.

Before launch, replace the placeholder footer email, add your privacy policy, and add anti-spam/rate limiting to the contact API. The service cards and demo content can be edited in `app/page.tsx`.


## Version 3 solution pages
Click **Solutions** in the top navigation to open a mega-menu. Each solution has a dedicated URL under `/solutions/`. Computer Vision includes an SVG industrial scene with bounding boxes and environment selector. Dashboards and Supply Chain include interactive synthetic KPI charts. Document Intelligence, Agentic AI and Automation include interactive illustrative demos. These are UI simulations, not connected AI models.
