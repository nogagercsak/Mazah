# Password Reset Feature

This document outlines the password reset functionality implemented for the Mazah app.

## Overview

The password reset feature allows users who have forgotten their password to securely reset it using their email address. The flow follows Supabase's standard email-based password reset process.

## User Flow

1. **Initiate Reset**: User clicks "Forgot Password?" on the login screen
2. **Enter Email**: User enters their email address on the forgot password screen
3. **Email Sent**: System sends a password reset email via Supabase Auth
4. **Click Link**: User clicks the reset link in their email
5. **Set New Password**: User enters and confirms their new password
6. **Login**: User is redirected to login with their new password

## Files Created/Modified

### New Files Created:
- `app/auth/forgot-password.tsx` - Screen for entering email to request password reset
- `app/auth/reset-password.tsx` - Screen for setting new password (accessed via email link)

### Files Modified:
- `app/auth/login.tsx` - Added "Forgot Password?" link and styling
- `supabase/config.toml` - Added mobile app deep link to allowed redirect URLs

## Technical Implementation

### Password Reset Email
- Uses `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'mazah://auth/reset-password' })`
- Redirects to the mobile app using the `mazah://` deep link scheme
- Email contains a secure link with access and refresh tokens

### Password Update
- Validates the reset tokens from the email link
- Uses `supabase.auth.setSession()` to authenticate with the reset tokens
- Updates password using `supabase.auth.updateUser({ password })`
- Signs out the reset session and redirects to login

### Security Features

1. **Token Validation**: Verifies reset tokens are valid before allowing password change
2. **Password Validation**: Enforces minimum 6 characters and maximum 72 characters
3. **Password Confirmation**: Requires user to enter password twice
4. **Session Management**: Clears the reset session after successful password update
5. **Rate Limiting**: Supabase handles rate limiting for password reset requests
6. **Link Expiry**: Reset links expire after 1 hour (configurable in Supabase)

### Error Handling

- Invalid or expired reset links
- Network connectivity issues
- Password validation errors
- Rate limiting
- Generic error fallbacks

## Configuration

### Supabase Configuration (`supabase/config.toml`)
```toml
[auth]
additional_redirect_urls = ["https://127.0.0.1:3000", "mazah://auth/reset-password"]

[auth.email]
enable_signup = true
enable_confirmations = false
max_frequency = "1s"
otp_expiry = 3600
```

### App Configuration (`app.config.js`)
```javascript
{
  scheme: "mazah",  // Enables deep linking
}
```

## Testing

To test the password reset flow:

1. **Development Setup**:
   - Ensure Supabase local development is running
   - Configure email provider (or use Supabase's development email preview)

2. **Test Steps**:
   - Navigate to login screen
   - Tap "Forgot Password?"
   - Enter a valid email address
   - Check email for reset link
   - Click the reset link (should open the app)
   - Enter and confirm new password
   - Verify redirect to login screen
   - Login with new password

3. **Edge Cases to Test**:
   - Invalid email addresses
   - Non-existent email accounts
   - Expired reset links
   - Network connectivity issues
   - Password validation failures

## Production Considerations

1. **Email Provider**: Configure a production SMTP provider in Supabase for reliable email delivery
2. **Domain Verification**: Ensure your domain is verified with your email provider
3. **Rate Limiting**: Monitor and adjust rate limits based on usage patterns
4. **Analytics**: Track password reset success/failure rates
5. **User Support**: Provide clear instructions and support documentation

## Future Enhancements

- SMS-based password reset option
- Two-factor authentication integration
- Password strength meter
- Account lockout after multiple failed attempts
- Audit logging for security events