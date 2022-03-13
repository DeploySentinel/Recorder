export class PlaywrightScriptBuilder {
  fileTemplate(lines: string) {
    return `const playwright = require('playwright');
(async () => {
  const browser = await playwright['chromium'].launch({
    // headless: false, slowMo: 100, // Uncomment to visualize test
  });
  const page = await browser.newPage();

${lines}

  await browser.close();
})();`;
  }

  private waitForNavigation() {
    return `page.waitForNavigation()`;
  }

  private waitForActionAndNavigation(action: string) {
    return `await Promise.all([\n    ${action},\n    ${this.waitForNavigation()}\n  ]);`;
  }

  click(selector: string, causesNavigation: boolean) {
    const actionStr = `page.click('${selector}')`;
    return causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
  }

  hover(selector: string, causesNavigation: boolean) {
    const actionStr = `page.hover('${selector}')`;
    return causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
  }

  load(url: string) {
    return `await page.goto('${url}');`;
  }

  resize(width: number, height: number) {
    return `await page.setViewportSize({ width: ${width}, height: ${height} });`;
  }

  fill(selector: string, value: string, causesNavigation: boolean) {
    const actionStr = `page.fill('${selector}', '${value}')`;
    return causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
  }

  type(selector: string, value: string, causesNavigation: boolean) {
    const actionStr = `page.type('${selector}', '${value}')`;
    return causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
  }

  select(selector: string, option: string, causesNavigation: boolean) {
    const actionStr = `page.selectOption('${selector}', '${option}')`;
    return causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
  }

  keydown(selector: string, key: string, causesNavigation: boolean) {
    const actionStr = `page.press('${selector}', '${key}')`;
    return causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
  }

  wheel(deltaX: number, deltaY: number) {
    return `await page.mouse.wheel(${Math.floor(deltaX)}, ${Math.floor(
      deltaY
    )});`;
  }

  fullScreenshot() {
    return `await page.screenshot({ path: 'screenshot.png', fullPage: true });`;
  }

  awaitText(text: string) {
    return `await page.waitForSelector('text=${text}')`;
  }
}

export class PuppeteerScriptBuilder {
  fileTemplate(lines: string) {
    return `const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    // headless: false, slowMo: 100, // Uncomment to visualize test
  });
  const page = await browser.newPage();

${lines}

  await browser.close();
})();`;
  }

  private waitForSelector(selector: string) {
    return `page.waitForSelector('${selector}')`;
  }
  private waitForNavigation() {
    return `page.waitForNavigation()`;
  }
  private waitForSelectorAndNavigation(selector: string, action: string) {
    return `await ${this.waitForSelector(
      selector
    )};\n  await Promise.all([\n    ${action},\n    ${this.waitForNavigation()}\n  ]);`;
  }

  click(selector: string, causesNavigation: boolean) {
    const pageClick = `page.click('${selector}')`;
    if (causesNavigation) {
      return this.waitForSelectorAndNavigation(selector, pageClick);
    }
    return `await ${this.waitForSelector(selector)};\n  await ${pageClick};`;
  }

  hover(selector: string, causesNavigation: boolean) {
    const pageHover = `page.hover('${selector}')`;
    if (causesNavigation) {
      return this.waitForSelectorAndNavigation(selector, pageHover);
    }
    return `await ${this.waitForSelector(selector)};\n  await ${pageHover};`;
  }

  load(url: string) {
    return `await page.goto('${url}');`;
  }

  resize(width: number, height: number) {
    return `await page.setViewport({ width: ${width}, height: ${height} });`;
  }

  type(selector: string, value: string, causesNavigation: boolean) {
    const pageType = `page.type('${selector}', '${value}')`;
    if (causesNavigation) {
      return this.waitForSelectorAndNavigation(selector, pageType);
    }
    return `await ${this.waitForSelector(selector)};\n  await ${pageType};`;
  }

  // Puppeteer doesn't support `fill` so we'll do our own actionability checks
  // but still type
  fill(selector: string, value: string, causesNavigation: boolean) {
    const pageType = `page.type('${selector}', '${value}')`;
    if (causesNavigation) {
      return this.waitForSelectorAndNavigation(
        `${selector}:not([disabled])`,
        pageType
      );
    }
    return `await ${this.waitForSelector(
      `${selector}:not([disabled])`
    )};\n  await ${pageType};`;
  }

  select(selector: string, option: string, causesNavigation: boolean) {
    const pageSelectOption = `page.select('${selector}', '${option}')`;
    if (causesNavigation) {
      return this.waitForSelectorAndNavigation(selector, pageSelectOption);
    }
    return `await ${this.waitForSelector(
      selector
    )};\n  await ${pageSelectOption};`;
  }

  keydown(selector: string, key: string, causesNavigation: boolean) {
    const pagePress = `page.keyboard.press('${key}')`;
    if (causesNavigation) {
      return this.waitForSelectorAndNavigation(selector, pagePress);
    }
    return `await page.waitForSelector('${selector}');\n  await page.keyboard.press('${key}');`;
  }

  wheel(deltaX: number, deltaY: number) {
    return `await page.evaluate(() => window.scrollBy(${deltaX}, ${deltaY}));`;
  }

  fullScreenshot() {
    return `await page.screenshot({ path: 'screenshot.png', fullPage: true });`;
  }

  awaitText(text: string) {
    return `await page.waitForFunction("document.body.innerText.includes('${text}')");`;
  }
}


