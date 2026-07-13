@echo off
REM Launch Google Chrome with Chrome DevTools Protocol (CDP) for live audits.
REM Usage: double-click or: scripts\start-chrome-cdp.cmd
REM Then from WSL/Windows: bun scripts/live-audit-cdp.mjs

set PORT=9222
set USERDATA=%TEMP%\lampfarms-cdp-profile
set URL=http://127.0.0.1:5173/welcome

if not exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  echo Chrome not found at "%ProgramFiles%\Google\Chrome\Application\chrome.exe"
  exit /b 1
)

REM Empty title "" is required: `start "name"` treats name as the window title,
REM not the executable — that caused: Windows cannot find '\LampFarmsCDP'.
start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=%PORT% ^
  --user-data-dir="%USERDATA%" ^
  --no-first-run ^
  --no-default-browser-check ^
  --disable-extensions ^
  "%URL%"

echo.
echo Chrome CDP starting on port %PORT%
echo Open DevTools: chrome://inspect  or  http://127.0.0.1:%PORT%/json/version
echo App: %URL%
echo.
echo Then run:
echo   set LIVE_AUDIT_EMAIL=you@example.com
echo   set LIVE_AUDIT_PASS=YourPass1!
echo   bun scripts/live-audit-cdp.mjs
echo.
