import { PlaywrightScriptBuilder } from '../src/pages/builders';

describe('Test CodeGen', () => {
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
});
