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

    test('waitForNavigation', () => {
      expect(builder.waitForNavigation()).toBe('page.waitForNavigation()');
    });

    test('waitForActionAndNavigation', () => {
      mockWaitForActionAndNavigation.mockRestore();
      expect(builder.waitForActionAndNavigation('action')).toBe('await Promise.all([\n    action,\n    page.waitForNavigation()\n  ]);');
    });

    test('click', () => {
      expect(builder.click('selector', true)).toBe('foo');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.click('selector')");
      expect(builder.click('selector', false).includes("await page.click('selector');"));
    });

    test('hover', () => {
      expect(builder.hover('selector', true)).toBe('foo');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.hover('selector')");
      expect(builder.hover('selector', false).includes("await page.hover('selector');"));
    });

    test('load', () => {
      expect(builder.load('url')).toBe("await page.goto('url');");
    });

    test('resize', () => {
      expect(builder.resize(1, 1)).toBe('await page.setViewportSize({ width: 1, height: 1 });');
    });
    
    test('fill', () => {
      expect(builder.fill('selector', 'value', true)).toBe('foo');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.fill('selector', 'value')");
      expect(builder.fill('selector', false).includes("await page.fill('selector', 'value');"));
    });

    test('type', () => {
      expect(builder.type('selector', 'value', true)).toBe('foo');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.type('selector', 'value')");
      expect(builder.type('selector', false).includes("await page.type('selector', 'value');"));
    });

    test('select', () => {
      expect(builder.select('selector', 'value', true)).toBe('foo');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.selectOption('selector', 'value')");
      expect(builder.select('selector', false).includes("await page.selectOption('selector', 'value');"));
    });

    test('keydown', () => {
      expect(builder.keydown('selector', 'value', true)).toBe('foo');
      expect(builder.waitForActionAndNavigation).toHaveBeenNthCalledWith(1, "page.press('selector', 'value')");
      expect(builder.keydown('selector', false).includes("await page.press('selector', 'value');"));
    });

    test('wheel', () => {
      expect(builder.wheel(1.6, 1.1)).toBe('await page.mouse.wheel(1, 1);');
    });

    test('fullScreenshot', () => {
      expect(builder.fullScreenshot()).toBe("await page.screenshot({ path: 'screenshot.png', fullPage: true });");
    });

    test('awaitText', () => {
      expect(builder.awaitText('foo')).toBe("await page.waitForSelector('text=foo')");
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
      mockWaitForSelectorAndNavigation = jest.spyOn(builder, 'waitForSelector')
        .mockImplementation(() => 'bar');
    });

    test('click', () => {
      expect(builder.click('selector', true)).toBe('foo');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.click('selector')");
      expect(builder.click('selector', false)).toBe("await bar;\n  await page.click('selector');");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('hover', () => {
      expect(builder.hover('selector', true)).toBe('foo');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.hover('selector')");
      expect(builder.hover('selector', false)).toBe("await bar;\n  await page.hover('selector');");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('load', () => {
      expect(builder.load('url')).toBe("await page.goto('url');");
    });

    test('resize', () => {
      expect(builder.resize(1, 1)).toBe('await page.setViewport({ width: 1, height: 1 });');
    });

    test('type', () => {
      expect(builder.type('selector', 'value', true)).toBe('foo');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.type('selector', 'value')");
      expect(builder.type('selector', 'value', false)).toBe("await bar;\n  await page.type('selector', 'value');");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('fill', () => {
      expect(builder.fill('selector', 'value', true)).toBe('foo');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector:not([disabled])', "page.type('selector', 'value')");
      expect(builder.fill('selector', 'value', false)).toBe("await bar;\n  await page.type('selector', 'value');");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector:not([disabled])');
    });

    test('select', () => {
      expect(builder.select('selector', 'value', true)).toBe('foo');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.select('selector', 'value')");
      expect(builder.select('selector', 'value', false)).toBe("await bar;\n  await page.select('selector', 'value');");
      expect(builder.waitForSelector).toHaveBeenNthCalledWith(1, 'selector');
    });

    test('keydown', () => {
      expect(builder.keydown('selector', 'value', true)).toBe('foo');
      expect(builder.waitForSelectorAndNavigation).toHaveBeenNthCalledWith(1, 'selector', "page.keyboard.press('value')");
      expect(builder.keydown('selector', 'value', false)).toBe("await page.waitForSelector('selector');\n  await page.keyboard.press('value');");
    });

    test('wheel', () => {
      expect(builder.wheel(1.6, 1.1)).toBe('await page.evaluate(() => window.scrollBy(1.6, 1.1));');
    });

    test('fullScreenshot', () => {
      expect(builder.fullScreenshot()).toBe("await page.screenshot({ path: 'screenshot.png', fullPage: true });");
    });

    test('awaitText', () => {
      expect(builder.awaitText('foo')).toBe(`await page.waitForFunction("document.body.innerText.includes('foo')");`);
    });
  });
});
