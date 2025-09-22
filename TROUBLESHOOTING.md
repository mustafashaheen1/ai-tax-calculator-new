# Troubleshooting Guide

## Common Issues and Solutions

### 🔧 Chatbot Returns "I apologize, but I encountered an error"

This usually indicates a database corruption issue. Here's how to fix it:

#### Quick Fix:
```bash
./scripts/reset-db.sh
bun run dev
```

#### Manual Fix:
```bash
# 1. Stop the dev server
pkill -f "next dev"

# 2. Remove corrupted database files
rm -f prisma/dev.db*
rm -f dev.db*

# 3. Clear cache and regenerate
rm -rf .next
bunx prisma generate
bunx prisma migrate reset --force

# 4. Restart dev server
bun run dev
```

### 🔍 Other Common Issues

#### API Routes Not Working
- Check if the dev server is running
- Verify environment variables in `.env.local`
- Check for TypeScript errors: `bun run lint`

#### OpenAI API Issues
- Verify `OPENAI_API_KEY` is set in `.env.local`
- Check OpenAI account has available credits
- Ensure API key has proper permissions

#### Database Connection Issues
- The app now has automatic recovery built-in
- Database health checks run before operations
- Safe operation wrappers prevent crashes

### 🛠 Prevention

The application now includes:
- **Robust Database Handling**: Automatic error recovery
- **Health Checks**: Database connectivity verification
- **Safe Operations**: Wrapped database calls
- **Graceful Fallbacks**: Proper error handling

### 📞 When All Else Fails

1. Run the database reset script: `./scripts/reset-db.sh`
2. Clear browser cache and localStorage
3. Restart the development server
4. Check the console for specific error messages

## Development Notes

- Database corruption typically happens during rapid development
- SQLite files can become corrupted when the process is killed unexpectedly
- The new database utilities prevent most corruption issues
- Always use the reset script for clean database state
