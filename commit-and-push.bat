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
git commit -m "feat: add Address Book with BSC validation and deployment guide"

echo.
echo Pushing to GitHub...
git push origin main

echo.
echo ============================================
echo   ✅ Frontend Changes Pushed Successfully!
echo ============================================
echo.
pause
