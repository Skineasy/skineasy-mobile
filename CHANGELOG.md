# Changelog

## 1.0.0

- Added Recommendations section on dashboard with up to 3 journal-driven tips
- Added docs/recommendations.md describing rules, thresholds, and data windows
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
- Added per-day progress rings on the journal calendar for days with score > 0
- Added Profile tab in the floating tab bar when routine access is unlocked (4-tab symmetric layout)
- Changed home avatar to push /account stack screen when no routine access, navigate to /profile tab otherwise
- Changed profile screen into a shared component rendered by both tab and stack routes
- Changed profile subroutes (edit, questionnaire-demo) to live under /account/
- Added 1-5 meal quality rating at the top of the nutrition form
- Added quality column on meal_entries and factored it into the nutrition score
