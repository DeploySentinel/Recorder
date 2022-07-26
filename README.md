# DeploySentinel Recorder

![Chrome Web Store](https://img.shields.io/chrome-web-store/rating/geggbdbnidkhbnbjoganapfhkpgkndfo?color=8F57F3&label=Chrome%20Rating)
![Tests](https://github.com/DeploySentinel/Recorder/actions/workflows/main.yml/badge.svg)

A Browser Extension that generates Cypress, Playwright and Puppeteer scripts
automatically from your browser interactions.

Simply step through your website while recording with DeploySentinel Recorder
and the extension will convert the captured user flow into a Cypress, Playwright
or Puppeteer script.

[![Chrome Store Icon](assets/ChromeStoreIcon.png)](https://chrome.google.com/webstore/detail/deploysentinel-recorder/geggbdbnidkhbnbjoganapfhkpgkndfo)
[![Firefox Addon Icon](assets/FirefoxAddonIcon.png)](https://addons.mozilla.org/en-US/firefox/addon/deploysentinel-recorder/)

Looking for a Cypress Studio alternative? Check out our
[Cypress Recorder Plugin](https://github.com/DeploySentinel/cypress-recorder).

# Demo

![Demo](assets/demo.gif)

# Features

- 💻 Automatically capture clicks, keyboard inputs, window resizes, and scroll
  events.
- 🤖 Generate clean and commented scripts for Cypress, Playwright and Puppeteer.
- 📋 Preview recording progress and copy generated scripts mid-test to
  clipboard.
- 📛 Generate element selectors using `id` and `class` as well as other HTML
  properties (ex. `aria-label`, `alt`, `name`, `data-testid`)
- 🖱 Capture hover events via context menu option (right-click)
- ✅ Assert/wait for specific text to be visible on the page
- 📸 Generate full page screenshot events

# Getting Started

1. Download the Extension
2. Visit the site you want to start recording from
3. Click the extension icon and click "Start Recording from Current Tab"
4. Use the site as you would normally (click links, fill forms, etc.)

   - Right-click an element and select "Record hover over element" to record a
     hover event over an element.
   - Highlight any text on the page, right-click and select "DeploySentinel
     Recorder" > "Assert/wait for selected text" to add a text-based assertion.

5. Click "End Test" whenever you are done. You can copy the generated script via
   the recording overlay.
6. Click the extension icon and select "View Last Recording" to access the last
   recorded test any time afterwards.

_Pro tip: To view captured steps or generated code mid-recording, click "Show
More" in the recording overlay._

# Alternatives Comparison

We think there are other great open source codegen tools out there, here is how
we think we compare with them. We're always looking to improve our features, so
feel free to open an issue or PR for what you think is missing.

|                                | DeploySentinel Recorder | Headless Recorder | Chrome Puppeteer Recorder | Playwright CLI Codegen |
| ------------------------------ | ----------------------- | ----------------- | ------------------------- | ---------------------- |
| Automatic Click Capture        | ✅                      | ✅                | ✅                        | ✅                     |
| Automatic Input Capture        | ✅                      | ⚠                 | ✅                        | ✅                     |
| Automatic File Upload Capture  | ❌                      | ❌                | ✅                        | ✅                     |
| Accessibility Selector Support | ✅                      | ❌                | ✅                        | ✅                     |
| Copy Code to Clipboard         | ✅                      | ✅                | ❌                        | ✅                     |
| data-testid Selector Support   | ✅                      | ✅                | ❌                        | ✅                     |
| Text selector support          | ⚠                       | ❌                | ❌                        | ✅                     |
| Screenshot event generation    | ✅                      | ✅                | ❌                        | ❌                     |
| Hover event generation         | ✅                      | ❌                | ❌                        | ❌                     |
| Record from Chrome Stable      | ✅                      | ✅                | ✅                        | ❌                     |

# Development Instructions

Install Dependencies: `yarn` (or `yarn --frozen-lockfile`)

## Firefox

Start Local Webpack Dev Server for Firefox: `yarn run start-ff`

Compressed Firefox Extension: `yarn run build-ff`

Bundle source files for review: `yarn run bundle-source`

## Chrome

Start Local Webpack Dev Server for Chrome: `yarn run start-chrome`

Compressed Chrome Extension: `yarn run build-chrome`

Run E2E Tests: `yarn test`

---

## Made with ❤️ by [DeploySentinel](https://deploysentinel.com)

Use DeploySentinel to save hours of failed Cypress test debugging by using DOM,
network, and console events captured from your CI.
[Learn more.](https://deploysentinel.com)
