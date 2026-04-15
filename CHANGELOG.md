# Changelog

## 1.0.0

- Added SkinEasy existing-account message on welcome screen
- Changed birthday picker to spinner wheels (day/month/year)
- Fixed gender selection defaulting to Mrs in onboarding step 2
- Changed selected card style to brown border instead of background fill
- Added login link on register step 4 to switch to sign-in without going back
- Added floating "+" button next to tab bar opening the add-indicator sheet
- Fixed onboarding step 3 benefit cards using a clear glass style over the brown background
- Added native in-app password recovery screen replacing the website WebView
- Added password reset screen wired for deep-link token flow
- Added docs/deeplinking.md covering scheme, testing, and Supabase integration plan
- Changed sport add flow to skip the day list and open the new-activity screen when no sport is logged
- Fixed sport duration input missing placeholder by allowing placeholder on Input when no floating label
- Changed dashboard indicators to a horizontal carousel always showing all 5 cards, filled ones first
- Removed unused appConfig.ui.indicatorLayout option
