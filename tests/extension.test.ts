import playwright from 'playwright';
import type { BrowserContext, Worker } from 'playwright';

jest.setTimeout(15000);

function waitForServiceWorkers(
  browser: BrowserContext,
  maxWaitTime: number
): Promise<Worker[]> {
  return new Promise((resolve, reject) => {
    let waitTime = 0;
    const interval = setInterval(() => {
      waitTime += 100;
      if (waitTime > maxWaitTime) {
        clearInterval(interval);
        reject(new Error('Timed out waiting for service workers'));
      }
      const serviceWorkers = browser.serviceWorkers();
      if (serviceWorkers.length > 0) {
        clearInterval(interval);
        resolve(serviceWorkers);
      }
    }, 100);
  });
}

let extensionId = '';
let browserContext: BrowserContext | null = null;
beforeAll(async () => {
  const userDataDir = '/tmp/deploysentinel-recorder-test-user-data-dir';
  browserContext = await playwright['chromium'].launchPersistentContext(
    userDataDir,
    {
      headless: false,
      args: ['--disable-extensions-except=./build', '--load-extension=./build'],
    }
  );

  const serviceWorkers = await waitForServiceWorkers(browserContext, 5000);
  const serviceWorkerUrl = serviceWorkers[0].url();
  const regex = /chrome-extension:\/\/(\w+)\//;
  extensionId = regex.exec(serviceWorkerUrl ?? '')?.[1] ?? '';
});

afterAll(async () => {
  if (browserContext) {
    await browserContext.close();
  }
});

test('extension is installed', async () => {
  expect(extensionId).toBeTruthy();
});

test('control bar shows correct actions during recording', async () => {
  expect(browserContext).toBeTruthy();
  if (browserContext == null) {
    return;
  }

  const page = await browserContext.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await page.click('[data-testid="record-new-test"]');

  await page.goto('https://wikipedia.com');
  await page.click('#searchInput');
  await page.type('#searchInput', 'tacos', { delay: 100 });
  await page.press('#searchInput', 'Enter', { delay: 100 });
  await page.click('[href="/wiki/Corn_tortilla"]:nth-child(7)');

  // Take Screenshot
  await page.click('[data-testid="show-more-actions"]');
  await page.click('[data-testid="record-screenshot"]');

  // Show actions in control bar
  await page.click('[data-testid="show-actions"]');

  const content = await page.textContent('[data-testid="action-list"]');
  expect(content).toEqual(
    expect.stringContaining('Click on input #searchInput')
  );
  expect(content).toEqual(
    expect.stringContaining('Fill "tacos" on #searchInput')
  );
  expect(content).toEqual(
    expect.stringContaining('Press "Enter" on #searchInput')
  );
  expect(content).toEqual(expect.stringContaining('Take full page screenshot'));

  // End test
  await page.click('[data-testid="end-test"]');
  expect(await page.textContent('[data-testid="recording-finished"]')).toEqual(
    'Recording Finished!'
  );

  await page.close();
});

test('can click through recording steps and it generates the right code', async () => {
  expect(browserContext).toBeTruthy();
  if (browserContext == null) {
    return;
  }

  const page = await browserContext.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  await page.click('[data-testid="record-new-test"]');

  await page.goto('https://wikipedia.com');
  await page.click('#searchInput');
  await page.type('#searchInput', 'tacos', { delay: 100 });
  await page.press('#searchInput', 'Enter', { delay: 100 });
  await page.click('[href="/wiki/Corn_tortilla"]:nth-child(7)');

  // Take Screenshot
  await page.click('[data-testid="show-more-actions"]');
  await page.click('[data-testid="record-screenshot"]');

  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.click('[data-testid="end-test-recording"]');
  await page.click('[data-testid="view-last-test"]');
  await page
    .locator('[data-testid="script-type-select"]')
    .selectOption('playwright');

  // Grab code generated
  const content = await page.textContent('[data-testid="code-block"]');
  expect(content).toEqual(
    expect.stringContaining("import { test, expect } from '@playwright/test'")
  );
  expect(content).toEqual(
    expect.stringContaining(
      "test('Written with DeploySentinel Recorder', async ({ page }) =>"
    )
  );
  expect(content).toEqual(
    expect.stringContaining("page.click('#searchInput');")
  );
  expect(content).toEqual(
    expect.stringContaining('page.fill(\'#searchInput\', "tacos");')
  );
  expect(content).toEqual(
    expect.stringContaining("page.press('#searchInput', 'Enter'),")
  );
  expect(content).toEqual(
    expect.stringContaining(
      'page.click(\'[href="/wiki/Corn_tortilla"]:nth-child(7)\'),'
    )
  );
  expect(content).toEqual(
    expect.stringContaining(
      "await page.screenshot({ path: 'screenshot.png', fullPage: true });"
    )
  );

  await page.close();
});
