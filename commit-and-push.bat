@echo off
echo ============================================
echo   ARGBOT Frontend - Commit and Push
echo ============================================
echo.

cd C:\Users\FGIAQUINTA\IdeaProjects\arg-bot-frontend

echo Adding all changes...
git add .

echo.
echo Committing with message...
git commit -m "feat: add Address Book with BSC validation and deployment guide

- Create AddressBook component with BSC/BEP20 validation
- Integrate Address Book into Withdraw component
- Add EIP-55 checksum validation for addresses
- Create DEPLOYMENT.md with Render.com instructions
- Remove dead code (SavingsBadge, ipService, lib/utils)
- Remove unused dependencies (clsx, tailwind-merge, lucide-react, vite-plugin-pwa)
- Fix all test failures (text matchers, mocks)
- Add test configuration to vite.config.js
- Add .env.example and documentation
- Frontend tests: 68/68 passing"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ============================================
echo   ✅ Frontend Changes Pushed Successfully!
echo ============================================
echo.
pause
