# 🔐 Security Guidelines

## Environment Variables Only
**NEVER commit sensitive data to git!**

### ✅ Correct - Use Environment Variables:
```javascript
// firebase.js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ... other config using env vars
};
```

### ❌ WRONG - Hardcoded Keys:
```javascript
// DON'T DO THIS!
const firebaseConfig = {
  apiKey: "AIzaSyD7GsEhT1w_pQf9uW9j5Umqfs8HopTuGDk", // NEVER!
};
```

## Security Checklist Before Committing

1. **Check for API Keys**: Search for patterns like `AIzaSy...`, `sk_...`, `SG.`
2. **Check for Passwords**: Look for `password:`, `passwd:`
3. **Check for Tokens**: Look for `token:`, `secret:`
4. **Run Security Check**: `./pre-commit-check.sh`

## Files That Should NEVER Be Committed

- `.env` files (any environment)
- `config.js` with hardcoded credentials  
- `deploy.js` with FTP passwords
- Any file with API keys, passwords, or tokens

## If You Accidentally Commit Secrets

1. **Stop immediately** - don't push if possible
2. **Change the credentials** immediately
3. **Rewrite git history** to remove the secrets:
   ```bash
   git filter-branch --force --tree-filter 'sed -i.bak "s/SECRET_VALUE/REMOVED/g" file.js' --all
   ```
4. **Force push** the cleaned history
5. **Notify team members** to re-clone if shared

## Emergency Response

If secrets are pushed to GitHub:
1. **Revoke/regenerate** the exposed credentials IMMEDIATELY
2. **Contact GitHub Support** for sensitive data removal
3. **Review access logs** for any unauthorized usage
4. **Update all systems** using the compromised credentials

## Prevention Tools

- **Pre-commit hook**: `./pre-commit-check.sh` 
- **Git secrets patterns**: `.gitsecrets`
- **Environment variables**: Always use `.env` files
- **Code review**: Always review diffs before committing

Remember: It's easier to prevent secrets from being committed than to remove them later!
