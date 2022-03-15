export abstract class ScriptBuilder {
  protected readonly actions: string[];

  constructor() {
    this.actions = [];
  }

  pushComments = (comments: string) => {
    this.actions.push(`\n  ${comments}`);
    return this;
  }

  pushCodes = (codes: string) => {
    this.actions.push(`\n  ${codes}\n`);
    return this;
  }

  getLastestAction = () => this.actions[this.actions.length - 1];

  abstract click: (selector: string, causesNavigation: boolean) => this;

  abstract hover: (selector: string, causesNavigation: boolean) => this;

  abstract load: (url: string) => this;

  abstract resize: (width: number, height: number) => this;

  abstract fill: (selector: string, value: string, causesNavigation: boolean) => this;

  abstract type: (selector: string, value: string, causesNavigation: boolean) => this;

  abstract select: (selector: string, key: string, causesNavigation: boolean) => this;

  abstract wheel: (deltaX: number, deltaY: number) => this;

  abstract fullScreenshot: () => this;

  abstract awaitText: (test: string) => this;

  abstract build: () => string;
}


export class PlaywrightScriptBuilder extends ScriptBuilder {
  private waitForNavigation() {
    return `page.waitForNavigation()`;
  }

  private waitForActionAndNavigation(action: string) {
    return `await Promise.all([\n    ${action},\n    ${this.waitForNavigation()}\n  ]);`;
  }

  click = (selector: string, causesNavigation: boolean) => {
    const actionStr = `page.click('${selector}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  }

  hover = (selector: string, causesNavigation: boolean) => {
    const actionStr = `page.hover('${selector}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  }

  load = (url: string) => {
    this.pushCodes(`await page.goto('${url}');`);
    return this;
  }

  resize = (width: number, height: number) => {
    this.pushCodes(`await page.setViewportSize({ width: ${width}, height: ${height} });`);
    return this;
  }

  fill = (selector: string, value: string, causesNavigation: boolean) => {
    const actionStr = `page.fill('${selector}', '${value}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  }

  type = (selector: string, value: string, causesNavigation: boolean) => {
    const actionStr = `page.type('${selector}', '${value}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  }

  select = (selector: string, option: string, causesNavigation: boolean) => {
    const actionStr = `page.selectOption('${selector}', '${option}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  }

  keydown = (selector: string, key: string, causesNavigation: boolean) => {
    const actionStr = `page.press('${selector}', '${key}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  }

  wheel = (deltaX: number, deltaY: number) => {
    this.pushCodes(`await page.mouse.wheel(${Math.floor(deltaX)}, ${Math.floor(
      deltaY
    )});`);
    return this;
  }

  fullScreenshot = () => {
    this.pushCodes(`await page.screenshot({ path: 'screenshot.png', fullPage: true });`);
    return this;
  }

  awaitText = (text: string) => {
    this.pushCodes(`await page.waitForSelector('text=${text}')`);
    return this;
  }

  build = () => {
    return `const playwright = require('playwright');
(async () => {
  const browser = await playwright['chromium'].launch({
    // headless: false, slowMo: 100, // Uncomment to visualize test
  });
  const page = await browser.newPage();
${this.actions.join('')}
  await browser.close();
})();`;
  }
}

export class PuppeteerScriptBuilder extends ScriptBuilder {
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

  click = (selector: string, causesNavigation: boolean) => {
    const pageClick = `page.click('${selector}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(selector, pageClick));
    }
    else {
      this.pushCodes(`await ${this.waitForSelector(selector)};\n  await ${pageClick};`);
    }
    return this;
  }

  hover = (selector: string, causesNavigation: boolean) => {
    const pageHover = `page.hover('${selector}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(selector, pageHover));
    }
    else {
      this.pushCodes(`await ${this.waitForSelector(selector)};\n  await ${pageHover};`);
    }
    return this;
  }

  load = (url: string) => {
    this.pushCodes(`await page.goto('${url}');`);
    return this;
  }

  resize = (width: number, height: number) => {
    this.pushCodes(`await page.setViewport({ width: ${width}, height: ${height} });`);
    return this;
  }

  type = (selector: string, value: string, causesNavigation: boolean) => {
    const pageType = `page.type('${selector}', '${value}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(selector, pageType));
    }
    else {
      this.pushCodes(`await ${this.waitForSelector(selector)};\n  await ${pageType};`)
    }
    return this;
  }

  // Puppeteer doesn't support `fill` so we'll do our own actionability checks
  // but still type
  fill = (selector: string, value: string, causesNavigation: boolean) => {
    const pageType = `page.type('${selector}', '${value}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(
        `${selector}:not([disabled])`,
        pageType
      ));
    }
    else {
      this.pushCodes(`await ${this.waitForSelector(
        `${selector}:not([disabled])`
      )};\n  await ${pageType};`);
    }
    return this;
  }

  select = (selector: string, option: string, causesNavigation: boolean) => {
    const pageSelectOption = `page.select('${selector}', '${option}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(selector, pageSelectOption));
    }
    else {
      this.pushCodes(`await ${this.waitForSelector(
        selector
      )};\n  await ${pageSelectOption};`);
    }
    return this;
  }

  keydown = (selector: string, key: string, causesNavigation: boolean) => {
    const pagePress = `page.keyboard.press('${key}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(selector, pagePress));
    }
    else {
      this.pushCodes(`await page.waitForSelector('${selector}');\n  await page.keyboard.press('${key}');`);
    }
    return this;
  }

  wheel = (deltaX: number, deltaY: number) => {
    this.pushCodes(`await page.evaluate(() => window.scrollBy(${deltaX}, ${deltaY}));`);
    return this;
  }

  fullScreenshot = () => {
    this.pushCodes(`await page.screenshot({ path: 'screenshot.png', fullPage: true });`);
    return this;
  }

  awaitText = (text: string) => {
    this.pushCodes(`await page.waitForFunction("document.body.innerText.includes('${text}')");`);
    return this;
  }

  build = () => {
    return `const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    // headless: false, slowMo: 100, // Uncomment to visualize test
  });
  const page = await browser.newPage();
${this.actions.join('')}
  await browser.close();
})();`;
  };
}


