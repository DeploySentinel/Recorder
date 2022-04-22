import {
  CypressScriptBuilder,
  PlaywrightScriptBuilder,
  PuppeteerScriptBuilder,
  truncateText,
} from '../src/pages/builders';

describe('Test builders', () => {
  test('truncateText', () => {
    expect(truncateText('hello', 10)).toBe('hello');
    expect(truncateText('hello', 2)).toBe('he...');
    expect(truncateText('hello', 0)).toBe('...');
  });

  describe('CypressScriptBuilder', () => {
    let builder: any;
    let mockPushCodes: any;

    beforeEach(() => {
      builder = new CypressScriptBuilder(true);
      mockPushCodes = jest.spyOn(builder, 'pushCodes').mockReturnValue(builder);
    });

    test('pushComments, pushCodes and build', () => {
      mockPushCodes.mockRestore();

      const output = builder
        .pushComments('// hello-world')
        .pushCodes('cy.visit();')
        .buildScript();
      expect(output).toBe(
        `it('Written with DeploySentinel Recorder', () => {\n  // hello-world\n  cy.visit();\n});`
      );
    });

    test('click', () => {
      builder.click('selector', true);
      expect(mockPushCodes).toHaveBeenNthCalledWith(
        1,
        "cy.get('selector').click();"
      );
    });

    test('hover', () => {
      builder.hover('selector', true);
      expect(mockPushCodes).toHaveBeenNthCalledWith(
        1,
        "cy.get('selector').trigger('mouseover');"
      );
    });

    test('load', () => {
      builder.load('url');
      expect(mockPushCodes).toHaveBeenNthCalledWith(1, "cy.visit('url');");
    });

    test('resize', () => {
      builder.resize(1, 2);
      expect(mockPushCodes).toHaveBeenNthCalledWith(1, 'cy.viewport(1, 2);');
    });

    test('fill', () => {
      builder.fill('selector', 'value', true);
      expect(mockPushCodes).toHaveBeenNthCalledWith(
        1,
        'cy.get(\'selector\').type("value");'
      );
    });

    test('type', () => {
      builder.type('selector', 'value', true);
      expect(mockPushCodes).toHaveBeenNthCalledWith(
        1,
        'cy.get(\'selector\').type("value");'
      );
    });

    test('select', () => {
      builder.select('selector', 'option', true);
      expect(mockPushCodes).toHaveBeenNthCalledWith(
        1,
        "cy.get('selector').select('option');"
      );
    });

    test('keydown', () => {
      builder.keydown('selector', 'Enter', true);
      expect(mockPushCodes).toHaveBeenNthCalledWith(
        1,
        "cy.get('selector').type('{Enter}');"
      );
    });

    test('wheel', () => {
      builder.wheel(5, 6, 1, 2);
      expect(mockPushCodes).toHaveBeenNthCalledWith(1, 'cy.scrollTo(1, 2);');
    });

    test('fullScreenshot', () => {
      builder.fullScreenshot();
      expect(mockPushCodes).toHaveBeenNthCalledWith(1, 'cy.screenshot();');
    });

    test('awaitText', () => {
      builder.awaitText('text');
      expect(mockPushCodes).toHaveBeenNthCalledWith(1, "cy.contains('text');");
    });
  });

  describe('PlaywrightScriptBuilder', () => {
    let builder: any;
    let mockWaitForActionAndNavigation: any;

    beforeEach(() => {
      builder = new PlaywrightScriptBuilder(true);

      mockWaitForActionAndNavigation = jest
        .spyOn(builder, 'waitForActionAndNavigation')
        .mockImplementation(() => 'foo');
    });

    test('pushComments, pushCodes and build', () => {
      const output = builder
        .pushComments('// hello-world')
        .pushCodes("const hellowWorld = () => console.log('hello world')")
        .buildScript();
      expect(output).toBe(`import { test, expect } from '@playwright/test';

test('Written with DeploySentinel Recorder', async ({ page }) => {
  // hello-world
  const hellowWorld = () => console.log('hello world')
});`);
    });

    test('waitForNavigation', () => {
      expect(builder.waitForNavigation()).toBe('page.waitForNavigation()');
    });

    test('waitForActionAndNavigation', () => {
      mockWaitForActionAndNavigation.mockRestore();
      expect(builder.waitForActionAndNavigation('action')).toBe(
        'await Promise.all([\n    action,\n    page.waitForNavigation()\n  ]);'
      );
    });

    test('click', () => {
      builder.click('selector', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(
        1,
        "page.click('selector')"
      );
      builder.click('selector', false);
      expect(builder.getLatestCode()).toBe(
        "\n  await page.click('selector');\n"
      );
    });

    test('hover', () => {
      builder.hover('selector', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(
        1,
        "page.hover('selector')"
      );
      builder.hover('selector', false);
      expect(builder.getLatestCode()).toBe(
        "\n  await page.hover('selector');\n"
      );
    });

    test('load', () => {
      builder.load('url');
      expect(builder.getLatestCode()).toBe("\n  await page.goto('url');\n");
    });

    test('resize', () => {
      builder.resize(1, 1);
      expect(builder.getLatestCode()).toBe(
        '\n  await page.setViewportSize({ width: 1, height: 1 });\n'
      );
    });

    test('fill', () => {
      builder.fill('selector', 'value', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(
        1,
        'page.fill(\'selector\', "value")'
      );
      builder.fill('selector', 'value', false);
      expect(builder.getLatestCode()).toBe(
        '\n  await page.fill(\'selector\', "value");\n'
      );
    });

    test('type', () => {
      builder.type('selector', 'value', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(
        1,
        'page.type(\'selector\', "value")'
      );
      builder.type('selector', 'value', false);
      expect(builder.getLatestCode()).toBe(
        '\n  await page.type(\'selector\', "value");\n'
      );
    });

    test('select', () => {
      builder.select('selector', 'value', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(
        1,
        "page.selectOption('selector', 'value')"
      );
      builder.select('selector', 'value', false);
      expect(builder.getLatestCode()).toBe(
        "\n  await page.selectOption('selector', 'value');\n"
      );
    });

    test('keydown', () => {
      builder.keydown('selector', 'value', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(
        1,
        "page.press('selector', 'value')"
      );
      builder.keydown('selector', 'value', false);
      expect(builder.getLatestCode()).toBe(
        "\n  await page.press('selector', 'value');\n"
      );
    });

    test('wheel', () => {
      builder.wheel(1.6, 1.1);
      expect(builder.getLatestCode()).toBe(
        '\n  await page.mouse.wheel(1, 1);\n'
      );
    });

    test('fullScreenshot', () => {
      builder.fullScreenshot();
      expect(builder.getLatestCode()).toBe(
        "\n  await page.screenshot({ path: 'screenshot.png', fullPage: true });\n"
      );
    });

    test('awaitText', () => {
      builder.awaitText('foo');
      expect(builder.getLatestCode()).toBe(
        "\n  await page.waitForSelector('text=foo');\n"
      );
    });
  });

  describe('PuppeteerScriptBuilder', () => {
    let builder: any;
    let mockWaitForSelectorAndNavigation: any;
    let mockWaitForSelector: any;

    beforeEach(() => {
      builder = new PuppeteerScriptBuilder(true);

      mockWaitForSelectorAndNavigation = jest
        .spyOn(builder, 'waitForSelectorAndNavigation')
        .mockImplementation(() => 'foo');
      mockWaitForSelector = jest
        .spyOn(builder, 'waitForSelector')
        .mockImplementation(() => 'bar');
    });

    test('pushComments, pushCodes and build', () => {
      const output = builder
        .pushComments('// hello-world')
        .pushCodes("const hellowWorld = () => console.log('hello world')")
        .buildScript();
      expect(output).toBe(`const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    // headless: false, slowMo: 100, // Uncomment to visualize test
  });
  const page = await browser.newPage();

  // hello-world
  const hellowWorld = () => console.log('hello world')

  await browser.close();
})();`);
    });

    test('waitForSelector', () => {
      mockWaitForSelector.mockRestore();
      expect(builder.waitForSelector('foo')).toBe(
        "page.waitForSelector('foo')"
      );
    });

    test('waitForNavigation', () => {
      expect(builder.waitForNavigation()).toBe('page.waitForNavigation()');
    });

    test('waitForSelectorAndNavigation', () => {
      mockWaitForSelectorAndNavigation.mockRestore();
      mockWaitForSelector.mockRestore();
      expect(builder.waitForSelectorAndNavigation('foo', 'bar')).toBe(
        `await page.waitForSelector('foo');\n  await Promise.all([\n    bar,\n    page.waitForNavigation()\n  ]);`
      );
    });

    test('click', () => {
      builder.click('selector', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(
        1,
        'selector',
        "page.click('selector')"
      );
      builder.click('selector', false);
      expect(builder.getLatestCode()).toBe(
        "\n  await bar;\n  await page.click('selector');\n"
      );
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('hover', () => {
      builder.hover('selector', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(
        1,
        'selector',
        "page.hover('selector')"
      );
      builder.hover('selector', false);
      expect(builder.getLatestCode()).toBe(
        "\n  await bar;\n  await page.hover('selector');\n"
      );
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('load', () => {
      builder.load('url');
      expect(builder.getLatestCode()).toBe("\n  await page.goto('url');\n");
    });

    test('resize', () => {
      builder.resize(1, 1);
      expect(builder.getLatestCode()).toBe(
        '\n  await page.setViewport({ width: 1, height: 1 });\n'
      );
    });

    test('type', () => {
      builder.type('selector', 'value', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(
        1,
        'selector',
        'page.type(\'selector\', "value")'
      );
      builder.type('selector', 'value', false);
      expect(builder.getLatestCode()).toBe(
        '\n  await bar;\n  await page.type(\'selector\', "value");\n'
      );
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('fill', () => {
      builder.fill('selector', 'value', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(
        1,
        'selector:not([disabled])',
        'page.type(\'selector\', "value")'
      );
      builder.fill('selector', 'value', false);
      expect(builder.getLatestCode()).toBe(
        '\n  await bar;\n  await page.type(\'selector\', "value");\n'
      );
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(
        1,
        'selector:not([disabled])'
      );
    });

    test('select', () => {
      builder.select('selector', 'value', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(
        1,
        'selector',
        "page.select('selector', 'value')"
      );
      builder.select('selector', 'value', false);
      expect(builder.getLatestCode()).toBe(
        "\n  await bar;\n  await page.select('selector', 'value');\n"
      );
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('keydown', () => {
      builder.keydown('selector', 'value', true);
      expect(builder.getLatestCode()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(
        1,
        'selector',
        "page.keyboard.press('value')"
      );
      builder.keydown('selector', 'value', false);
      expect(builder.getLatestCode()).toBe(
        "\n  await page.waitForSelector('selector');\n  await page.keyboard.press('value');\n"
      );
    });

    test('wheel', () => {
      builder.wheel(1.6, 1.1);
      expect(builder.getLatestCode()).toBe(
        '\n  await page.evaluate(() => window.scrollBy(1.6, 1.1));\n'
      );
    });

    test('fullScreenshot', () => {
      builder.fullScreenshot();
      expect(builder.getLatestCode()).toBe(
        "\n  await page.screenshot({ path: 'screenshot.png', fullPage: true });\n"
      );
    });

    test('awaitText', () => {
      builder.awaitText('foo');
      expect(builder.getLatestCode()).toBe(
        `\n  await page.waitForFunction("document.body.innerText.includes('foo')");\n`
      );
    });
  });
});
