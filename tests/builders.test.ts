import { PlaywrightScriptBuilder, PuppeteerScriptBuilder } from '../src/pages/builders';

describe('Test builders', () => {
  describe('PlaywrightScriptBuilder', () => {
    let builder: any;
    let mockWaitForActionAndNavigation: any;

    beforeEach(() => {
      builder = new PlaywrightScriptBuilder();

      mockWaitForActionAndNavigation = jest.spyOn(builder, 'waitForActionAndNavigation')
        .mockImplementation(() => 'foo');
    });

    test('pushComments, pushCodes and build', () => {
      const output = builder
        .pushComments('// hello-world')
        .pushCodes("const hellowWorld = () => console.log('hello world')")
        .build()
      expect(output).toBe(`const playwright = require('playwright');
(async () => {
  const browser = await playwright['chromium'].launch({
    // headless: false, slowMo: 100, // Uncomment to visualize test
  });
  const page = await browser.newPage();

  // hello-world
  const hellowWorld = () => console.log('hello world')

  await browser.close();
})();`);
    });

    test('waitForNavigation', () => {
      expect(builder.waitForNavigation()).toBe('page.waitForNavigation()');
    });

    test('waitForActionAndNavigation', () => {
      mockWaitForActionAndNavigation.mockRestore();
      expect(builder.waitForActionAndNavigation('action')).toBe('await Promise.all([\n    action,\n    page.waitForNavigation()\n  ]);');
    });

    test('click', () => {
      builder.click('selector', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.click('selector')");
      builder.click('selector', false);
      expect(builder.getLastestAction()).toBe("\n  await page.click('selector');\n");
    });

    test('hover', () => {
      builder.hover('selector', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.hover('selector')");
      builder.hover('selector', false);
      expect(builder.getLastestAction()).toBe("\n  await page.hover('selector');\n");
    });

    test('load', () => {
      builder.load('url');
      expect(builder.getLastestAction()).toBe("\n  await page.goto('url');\n");
    });

    test('resize', () => {
      builder.resize(1, 1);
      expect(builder.getLastestAction()).toBe('\n  await page.setViewportSize({ width: 1, height: 1 });\n');
    });
    
    test('fill', () => {
      builder.fill('selector', 'value', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.fill('selector', 'value')");
      builder.fill('selector', 'value', false);
      expect(builder.getLastestAction()).toBe("\n  await page.fill('selector', 'value');\n");
    });

    test('type', () => {
      builder.type('selector', 'value', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.type('selector', 'value')");
      builder.type('selector', 'value', false);
      expect(builder.getLastestAction()).toBe("\n  await page.type('selector', 'value');\n");
    });

    test('select', () => {
      builder.select('selector', 'value', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.selectOption('selector', 'value')");
      builder.select('selector', 'value', false);
      expect(builder.getLastestAction()).toBe("\n  await page.selectOption('selector', 'value');\n");
    });

    test('keydown', () => {
      builder.keydown('selector', 'value', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.press('selector', 'value')");
      builder.keydown('selector', 'value', false);
      expect(builder.getLastestAction()).toBe("\n  await page.press('selector', 'value');\n");
    });

    test('wheel', () => {
      builder.wheel(1.6, 1.1);
      expect(builder.getLastestAction()).toBe('\n  await page.mouse.wheel(1, 1);\n');
    });

    test('fullScreenshot', () => {
      builder.fullScreenshot();
      expect(builder.getLastestAction()).toBe("\n  await page.screenshot({ path: 'screenshot.png', fullPage: true });\n");
    });

    test('awaitText', () => {
      builder.awaitText('foo');
      expect(builder.getLastestAction()).toBe("\n  await page.waitForSelector('text=foo')\n");
    });
  });

  describe('PuppeteerScriptBuilder', () => {
    let builder: any;
    let mockWaitForSelectorAndNavigation: any;
    let mockWaitForSelector: any

    beforeEach(() => {
      builder = new PuppeteerScriptBuilder();

      mockWaitForSelectorAndNavigation = jest.spyOn(builder, 'waitForSelectorAndNavigation')
        .mockImplementation(() => 'foo');
      mockWaitForSelector = jest.spyOn(builder, 'waitForSelector')
        .mockImplementation(() => 'bar');
    });

    test('waitForSelector', () => {
      mockWaitForSelector.mockRestore();
      expect(builder.waitForSelector('foo')).toBe("page.waitForSelector('foo')");
    });

    test('waitForNavigation', () => {
      expect(builder.waitForNavigation()).toBe('page.waitForNavigation()');
    });

    test('waitForSelectorAndNavigation', () => {
      mockWaitForSelectorAndNavigation.mockRestore();
      mockWaitForSelector.mockRestore();
      expect(builder.waitForSelectorAndNavigation('foo', 'bar'))
        .toBe(`await page.waitForSelector('foo');\n  await Promise.all([\n    bar,\n    page.waitForNavigation()\n  ]);`);
    });

    test('click', () => {
      builder.click('selector', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.click('selector')");
      builder.click('selector', false);
      expect(builder.getLastestAction()).toBe("\n  await bar;\n  await page.click('selector');\n");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('hover', () => {
      builder.hover('selector', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.hover('selector')");
      builder.hover('selector', false);
      expect(builder.getLastestAction()).toBe("\n  await bar;\n  await page.hover('selector');\n");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('load', () => {
      builder.load('url');
      expect(builder.getLastestAction()).toBe("\n  await page.goto('url');\n");
    });

    test('resize', () => {
      builder.resize(1, 1);
      expect(builder.getLastestAction()).toBe('\n  await page.setViewport({ width: 1, height: 1 });\n');
    });

    test('type', () => {
      builder.type('selector', 'value', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.type('selector', 'value')");
      builder.type('selector', 'value', false);
      expect(builder.getLastestAction()).toBe("\n  await bar;\n  await page.type('selector', 'value');\n");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('fill', () => {
      builder.fill('selector', 'value', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector:not([disabled])', "page.type('selector', 'value')");
      builder.fill('selector', 'value', false);
      expect(builder.getLastestAction()).toBe("\n  await bar;\n  await page.type('selector', 'value');\n");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector:not([disabled])');
    });

    test('select', () => {
      builder.select('selector', 'value', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.select('selector', 'value')");
      builder.select('selector', 'value', false);
      expect(builder.getLastestAction()).toBe("\n  await bar;\n  await page.select('selector', 'value');\n");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('keydown', () => {
      builder.keydown('selector', 'value', true);
      expect(builder.getLastestAction()).toBe('\n  foo\n');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.keyboard.press('value')");
      builder.keydown('selector', 'value', false);
      expect(builder.getLastestAction()).toBe("\n  await page.waitForSelector('selector');\n  await page.keyboard.press('value');\n");
    });

    test('wheel', () => {
      builder.wheel(1.6, 1.1);
      expect(builder.getLastestAction()).toBe('\n  await page.evaluate(() => window.scrollBy(1.6, 1.1));\n');
    });

    test('fullScreenshot', () => {
      builder.fullScreenshot();
      expect(builder.getLastestAction()).toBe("\n  await page.screenshot({ path: 'screenshot.png', fullPage: true });\n");
    });

    test('awaitText', () => {
      builder.awaitText('foo');
      expect(builder.getLastestAction()).toBe(`\n  await page.waitForFunction("document.body.innerText.includes('foo')");\n`);
    });
  });
});
