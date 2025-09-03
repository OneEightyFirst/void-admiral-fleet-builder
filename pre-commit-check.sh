#!/bin/bash

# Pre-commit security check script
# This script checks for common sensitive data patterns before committing

echo "🔍 Running security checks before commit..."

# Check for common sensitive patterns
SECRETS_FOUND=false

# Check for Firebase API keys
if git diff --cached | grep -E "AIzaSy[A-Za-z0-9_-]{33}"; then
    echo "❌ Firebase API key detected in staged changes!"
    SECRETS_FOUND=true
fi

# Check for generic API keys
if git diff --cached | grep -iE "(api[_-]?key|apiKey)[\"\\s]*[:=][\"\\s]*[A-Za-z0-9_-]{20,}"; then
    echo "❌ API key pattern detected in staged changes!"
    SECRETS_FOUND=true
fi

# Check for passwords
if git diff --cached | grep -iE "(password|passwd)[\"\\s]*[:=][\"\\s]*[^\"\\s]{8,}"; then
    echo "❌ Password detected in staged changes!"
    SECRETS_FOUND=true
fi

# Check for email service keys
if git diff --cached | grep -E "SG\\.[A-Za-z0-9_-]{22}\\.[A-Za-z0-9_-]{43}"; then
    echo "❌ SendGrid API key detected in staged changes!"
    SECRETS_FOUND=true
fi

# Check for AWS keys
if git diff --cached | grep -E "AKIA[0-9A-Z]{16}"; then
    echo "❌ AWS Access Key detected in staged changes!"
    SECRETS_FOUND=true
fi

# Check for private keys
if git diff --cached | grep -E "\-\-\-\-\-BEGIN.*PRIVATE KEY\-\-\-\-\-"; then
    echo "❌ Private key detected in staged changes!"
    SECRETS_FOUND=true
fi

if [ "$SECRETS_FOUND" = true ]; then
    echo ""
    echo "🚨 SECURITY ALERT: Sensitive data detected!"
    echo "Please review your changes and remove any API keys, passwords, or credentials."
    echo "Consider using environment variables instead."
    echo ""
    echo "To bypass this check (NOT RECOMMENDED): git commit --no-verify"
    exit 1
fi

echo "✅ Security check passed - no sensitive data detected"
exit 0
