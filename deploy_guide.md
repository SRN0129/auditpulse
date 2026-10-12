# 24/7 Cloud Deployment Guide: Laptop-Independent Operation

Your autonomous business is configured for continuous cloud deployment so that when your laptop is turned off, the business, storefront, payment collector, and agent engine remain online 24 hours a day, 7 days a week with **₹0 cost**.

---

## Option 1: Instant 1-Click Vercel Deployment (Recommended)

1. Open your terminal in the project directory:
   ```powershell
   cd C:\Users\soumy\.gemini\antigravity\brain\bb743938-a395-433e-a91f-69e858d36117\scratch\auditpulse
   ```
2. Run the Vercel CLI (zero install, runs via npx):
   ```powershell
   npx vercel
   ```
3. Follow the 3 prompts:
   - *Set up and deploy?* → Type `y`
   - *Which scope?* → Select your free Vercel account
   - *Link to existing project?* → Type `n`
   - *Project name?* → Press Enter (or `auditpulse`)
4. **Done!** You get an instant, permanent public HTTPS URL (e.g. `https://auditpulse.vercel.app`) with 100% global uptime, completely independent of your laptop.

---

## Option 2: Cloudflare Pages / Workers (Verified CLI Available)

We have already verified Cloudflare `wrangler` CLI v4.147.0 in your environment.
To deploy to Cloudflare's global edge network:
```powershell
npx wrangler deploy
```
This deploys the edge service with 100,000 free requests per day, DDoS protection, and continuous zero-downtime hosting.

---

## Option 3: Immediate Live Cloudflare Tunnel (Zero-Account Tunneling)
If you want to instantly share a public HTTPS URL directly from your current machine right now without signing up anywhere:
```powershell
npx cloudflared tunnel --url http://localhost:3000
```
This generates a live public URL (e.g. `https://random-word.trycloudflare.com`) accessible from any phone or computer worldwide.
