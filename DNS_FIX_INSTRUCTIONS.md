# 🔧 Fix DNS Configuration for seera-ai.com

## Current Problem
❌ Your domain `seera-ai.com` is still pointing to Squarespace IPs instead of Vercel
✅ Your Vercel deployment is working: https://seera-cv-platform-git-main-abdulaziz1a3s-projects.vercel.app

## Immediate Action Required

### Step 1: Go to Google Domains
1. Visit: https://domains.google.com
2. Sign in with your Google account
3. Click on **seera-ai.com** domain

### Step 2: Access DNS Settings
1. Click on **"DNS"** in the left sidebar
2. Scroll down to **"Custom resource records"** section

### Step 3: DELETE All Squarespace Records

**Delete these records (click the trash icon for each):**

1. **All A Records** pointing to Squarespace:
   - `@` → `198.185.159.144`
   - `@` → `198.49.23.145`
   - `@` → `198.185.159.145`
   - `@` → `198.49.23.144`

2. **CNAME Record**:
   - `www` → `ext-sq.squarespace.com`

3. **HTTPS Record**:
   - `@` → (the HTTPS record with Squarespace data)

4. **Domain Connect Record**:
   - `_domainconnect` → `_domainconnect.domains.squarespace.com`

### Step 4: ADD Vercel DNS Records

**Add these NEW records:**

#### Record 1: A Record (Root Domain)
- **Name/Host**: `@` (or leave blank)
- **Type**: `A`
- **TTL**: `3600` (or use default)
- **Data**: `76.76.21.21`
- Click **Save**

#### Record 2: CNAME Record (www subdomain)
- **Name/Host**: `www`
- **Type**: `CNAME`
- **TTL**: `3600` (or use default)
- **Data**: `cname.vercel-dns.com`
- Click **Save**

### Step 5: Verify Your DNS Records

After adding, you should ONLY have these 2 records:
```
Type    Name    Data
----    ----    ----
A       @       76.76.21.21
CNAME   www     cname.vercel-dns.com
```

## After Updating DNS

### Wait for Propagation
- **Time**: 15 minutes to 2 hours (usually 30 minutes)
- DNS changes need time to propagate globally

### Verify DNS Update
Run this command to check:
```bash
nslookup seera-ai.com
```

**Expected Result**: Should show `76.76.21.21` instead of Squarespace IPs

### Check Vercel Status
1. Visit: https://vercel.com/abdulaziz1a3s-projects/seera-cv-platform/settings/domains
2. Click on `seera-ai.com`
3. Status should change from "Not configured" to "Valid Configuration"

### Test Your Domain
- Visit: https://seera-ai.com
- Should show your Vercel deployment

## Troubleshooting

### Still Not Working After 2 Hours?

1. **Double-check DNS records**:
   - Ensure all Squarespace records are deleted
   - Verify A record points to `76.76.21.21`
   - Verify CNAME for www points to `cname.vercel-dns.com`

2. **Check DNS propagation**:
   - Visit: https://dnschecker.org/#A/seera-ai.com
   - Should show `76.76.21.21` globally

3. **Clear DNS cache**:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Or restart your router
   ```

4. **Verify in Vercel Dashboard**:
   - Check for any error messages
   - Ensure SSL certificate is being issued

### Common Mistakes to Avoid

❌ **Don't keep both Squarespace and Vercel records** - Delete all Squarespace records first
❌ **Don't use wrong IP address** - Must be exactly `76.76.21.21`
❌ **Don't forget the @ symbol** - For root domain, use `@` or leave blank
❌ **Don't wait too long** - DNS changes should work within 2 hours

## Quick Checklist

- [ ] Deleted all 4 Squarespace A records
- [ ] Deleted Squarespace CNAME for www
- [ ] Deleted Squarespace HTTPS record
- [ ] Deleted _domainconnect record
- [ ] Added A record: `@` → `76.76.21.21`
- [ ] Added CNAME record: `www` → `cname.vercel-dns.com`
- [ ] Waited 30 minutes
- [ ] Verified DNS propagation
- [ ] Tested https://seera-ai.com

## Need Help?

If you're stuck:
1. Take a screenshot of your DNS records page
2. Verify you've deleted all Squarespace records
3. Confirm the A record shows `76.76.21.21`
4. Check Vercel dashboard for domain status
