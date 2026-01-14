# DNS Configuration Guide for seera-ai.com

## Current Status
✅ Domain `seera-ai.com` is already added to Vercel project `seera-cv-platform`
⚠️ DNS records need to be updated at Google Domains

## Steps to Configure DNS at Google Domains

### Option 1: Use A Record (Recommended - Faster)

1. **Go to Google Domains**: https://domains.google.com
2. **Select your domain**: `seera-ai.com`
3. **Navigate to DNS Settings**: Click on "DNS" in the left sidebar
4. **Remove Squarespace Records**: Delete all existing Squarespace DNS records:
   - Delete all 4 A records pointing to Squarespace IPs (198.185.159.144, 198.49.23.145, etc.)
   - Delete the CNAME record for `www` pointing to `ext-sq.squarespace.com`
   - Delete the HTTPS record for `@`
   - Delete the `_domainconnect` CNAME record

5. **Add Vercel A Record**:
   - **Type**: `A`
   - **Host**: `@` (or leave blank for root domain)
   - **TTL**: `3600` (1 hour) or use default
   - **Data/Value**: `76.76.21.21`
   - Click **Add** or **Save**

6. **Add CNAME for www subdomain** (Optional but recommended):
   - **Type**: `CNAME`
   - **Host**: `www`
   - **TTL**: `3600` (1 hour) or use default
   - **Data/Value**: `cname.vercel-dns.com`
   - Click **Add** or **Save**

### Option 2: Use Vercel Nameservers (Alternative)

If you prefer to use Vercel's nameservers:

1. **Get Vercel Nameservers**: 
   - Go to: https://vercel.com/abdulaziz1a3s-projects/seera-cv-platform/settings/domains
   - Click on `seera-ai.com`
   - Copy the nameservers shown

2. **Update Nameservers at Google Domains**:
   - Go to Google Domains → DNS → Name servers
   - Change from "Use the Google Domains name servers" to "Use custom name servers"
   - Enter the Vercel nameservers
   - Save changes

**Note**: This method takes longer to propagate (up to 48 hours) but gives Vercel full control over DNS.

## DNS Records Summary

After configuration, your DNS should have:

```
Type    Host    Value/Data              TTL
----    ----    ----------              ---
A       @       76.76.21.21             3600
CNAME   www     cname.vercel-dns.com    3600
```

## Verification

After updating DNS records:

1. **Wait for DNS Propagation**: 5 minutes to 48 hours (usually 15-30 minutes)
2. **Check DNS Propagation**: Use https://dnschecker.org to verify
3. **Verify in Vercel**: 
   - Go to: https://vercel.com/abdulaziz1a3s-projects/seera-cv-platform/settings/domains
   - The domain should show as "Valid Configuration"
4. **Test Your Domain**: Visit https://seera-ai.com

## Troubleshooting

### Domain Not Working After 24 Hours
- Verify DNS records are correct
- Check DNS propagation: https://dnschecker.org
- Ensure SSL certificate is issued (Vercel does this automatically)
- Check Vercel domain settings for any errors

### SSL Certificate Issues
- Vercel automatically provisions SSL certificates
- Wait 5-10 minutes after DNS is configured
- Check SSL status in Vercel dashboard

### www Subdomain Not Working
- Ensure CNAME record for `www` is added
- Verify it points to `cname.vercel-dns.com`
- Wait for DNS propagation

## Quick Reference

- **Vercel Project**: seera-cv-platform
- **Domain**: seera-ai.com
- **A Record**: 76.76.21.21
- **CNAME (www)**: cname.vercel-dns.com
- **Vercel Dashboard**: https://vercel.com/abdulaziz1a3s-projects/seera-cv-platform/settings/domains
