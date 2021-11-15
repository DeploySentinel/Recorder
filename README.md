# DeploySentinel Recorder

A Chrome Extension that generates Playwright and Puppeteer scripts automatically
from your browser interactions.

Simply step through your website while recording with DeploySentinel Recorder
and the extension will convert the captured user flow into a Playwright or
Puppeteer script.

**Demo:**

![Demo](assets/demo.gif)

# Features

- Automatically capture clicks, keyboard inputs, window resizes, and scroll
  events.
- Generate clean and commented scripts for both Playwright and Puppeteer.
- Preview recording progress and copy generated scripts mid-test to clipboard.
- Generate selectors using `id` and `class` as well as other HTML properties
  (ex. `aria-label`, `alt`, `name`, `data-testid`)
- Capture hover events via context menu option (right-click)

# Getting Started

1. Download the Extension
2. Visit the site you want to start recording from
3. Click the extension icon and click "Record a New Test"
4. Use the site as you would normally (click links, fill forms, etc.)

   - Right-click an element and select "Record hover over element" to record a
     hover event over an element.

5. Click "End Test" whenever you are done. You can copy the generated script via
   the recording overlay.
6. Click the extension icon and select "View Last Test Steps & Code" to access
   the last recorded test any time afterwards.

_Pro tip: To view captured steps or generated code mid-recording, click "See
Prior Steps" in the recording overlay._

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
| Text selector support          | ❌                      | ❌                | ❌                        | ✅                     |
| Screenshot event generation    | ❌                      | ✅                | ❌                        | ❌                     |
| Hover event generation         | ✅                      | ❌                | ❌                        | ❌                     |
| Record from Chrome Stable      | ✅                      | ✅                | ❌                        | ❌                     |

# Development Instructions

Start Local Webpack: `yarn run start`

Build Compressed Chrome Extension: `yarn run build`
