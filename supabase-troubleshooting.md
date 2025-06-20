# Supabase Email Validation Troubleshooting

## Issue: "Email address is invalid" for valid emails like testing@gmail.com

### Possible Causes:

1. **Supabase Project Settings**
   - Email confirmations might be disabled
   - Domain restrictions might be enabled
   - Email provider settings might be misconfigured

2. **Authentication Settings**
   - Email templates might not be set up
   - SMTP settings might be missing

### Steps to Fix:

#### 1. Check Supabase Project Settings
1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Settings**
3. Check the following:
   - **Enable email confirmations**: Should be ON for new signups
   - **Enable email change confirmations**: Should be ON
   - **Enable phone confirmations**: Can be OFF for now

#### 2. Check Email Templates
1. Go to **Authentication** → **Email Templates**
2. Make sure the following templates exist:
   - **Confirm signup**
   - **Reset password**
   - **Change email address**

#### 3. Check SMTP Settings (if using custom email)
1. Go to **Authentication** → **SMTP Settings**
2. If you're using a custom SMTP provider, make sure it's configured correctly
3. If not using custom SMTP, Supabase should handle emails automatically

#### 4. Test with Different Email
Try these email formats:
- `test@example.com`
- `user123@gmail.com`
- `yourname@outlook.com`

#### 5. Check Supabase Logs
1. Go to **Logs** in your Supabase dashboard
2. Look for authentication-related errors
3. Check if there are any rate limiting or configuration issues

### Quick Fix Options:

#### Option 1: Disable Email Confirmation (for testing)
1. Go to **Authentication** → **Settings**
2. Turn OFF **Enable email confirmations**
3. This will allow immediate signup without email verification

#### Option 2: Use a Different Email Provider
Try using:
- `test@outlook.com`
- `test@yahoo.com`
- `test@protonmail.com`

#### Option 3: Check Project URL
Make sure your Supabase project URL is correctly set in your `.env` file:
```
EXPO_PUBLIC_SUPABASE_URL=https://rlcaflfpihrypxupntcq.supabase.co
```

### If Still Not Working:

1. **Create a new Supabase project** for testing
2. **Use a different email address** (not gmail)
3. **Check if the issue persists** with the new project

This will help isolate whether it's a project-specific issue or a general configuration problem. 