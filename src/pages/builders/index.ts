import { ActionType, ScriptType, TagName, isSupportedActionType } from '../types';
import { getBestSelectorForAction } from './selector';

import type { Action } from '../types';

const FILLABLE_INPUT_TYPES = [
  '',
  'date',
  'datetime',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
];

export abstract class ScriptBuilder {
  protected readonly actions: string[];

  constructor() {
    this.actions = [];
  }

  pushComments = (comments: string) => {
    this.actions.push(`\n  ${comments}`);
    return this;
  };

  pushCodes = (codes: string) => {
    this.actions.push(`\n  ${codes}\n`);
    return this;
  };

  getLastestAction = () => this.actions[this.actions.length - 1];

  abstract click: (selector: string, causesNavigation: boolean) => this;

  abstract hover: (selector: string, causesNavigation: boolean) => this;

  abstract load: (url: string) => this;

  abstract resize: (width: number, height: number) => this;

  abstract fill: (
    selector: string,
    value: string,
    causesNavigation: boolean
  ) => this;

  abstract type: (
    selector: string,
    value: string,
    causesNavigation: boolean
  ) => this;

  abstract keydown: (
    selector: string,
    key: string,
    causesNavigation: boolean
  ) => this;

  abstract select: (
    selector: string,
    key: string,
    causesNavigation: boolean
  ) => this;

  abstract wheel: (
    deltaX: number,
    deltaY: number,
    pageXOffset?: number,
    pageYOffset?: number
  ) => this;

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
  };

  hover = (selector: string, causesNavigation: boolean) => {
    const actionStr = `page.hover('${selector}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  };

  load = (url: string) => {
    this.pushCodes(`await page.goto('${url}');`);
    return this;
  };

  resize = (width: number, height: number) => {
    this.pushCodes(
      `await page.setViewportSize({ width: ${width}, height: ${height} });`
    );
    return this;
  };

  fill = (selector: string, value: string, causesNavigation: boolean) => {
    const actionStr = `page.fill('${selector}', '${value}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  };

  type = (selector: string, value: string, causesNavigation: boolean) => {
    const actionStr = `page.type('${selector}', '${value}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  };

  select = (selector: string, option: string, causesNavigation: boolean) => {
    const actionStr = `page.selectOption('${selector}', '${option}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  };

  keydown = (selector: string, key: string, causesNavigation: boolean) => {
    const actionStr = `page.press('${selector}', '${key}')`;
    const action = causesNavigation
      ? this.waitForActionAndNavigation(actionStr)
      : `await ${actionStr};`;
    this.pushCodes(action);
    return this;
  };

  wheel = (deltaX: number, deltaY: number) => {
    this.pushCodes(
      `await page.mouse.wheel(${Math.floor(deltaX)}, ${Math.floor(deltaY)});`
    );
    return this;
  };

  fullScreenshot = () => {
    this.pushCodes(
      `await page.screenshot({ path: 'screenshot.png', fullPage: true });`
    );
    return this;
  };

  awaitText = (text: string) => {
    this.pushCodes(`await page.waitForSelector('text=${text}')`);
    return this;
  };

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
  };
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
    } else {
      this.pushCodes(
        `await ${this.waitForSelector(selector)};\n  await ${pageClick};`
      );
    }
    return this;
  };

  hover = (selector: string, causesNavigation: boolean) => {
    const pageHover = `page.hover('${selector}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(selector, pageHover));
    } else {
      this.pushCodes(
        `await ${this.waitForSelector(selector)};\n  await ${pageHover};`
      );
    }
    return this;
  };

  load = (url: string) => {
    this.pushCodes(`await page.goto('${url}');`);
    return this;
  };

  resize = (width: number, height: number) => {
    this.pushCodes(
      `await page.setViewport({ width: ${width}, height: ${height} });`
    );
    return this;
  };

  type = (selector: string, value: string, causesNavigation: boolean) => {
    const pageType = `page.type('${selector}', '${value}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(selector, pageType));
    } else {
      this.pushCodes(
        `await ${this.waitForSelector(selector)};\n  await ${pageType};`
      );
    }
    return this;
  };

  // Puppeteer doesn't support `fill` so we'll do our own actionability checks
  // but still type
  fill = (selector: string, value: string, causesNavigation: boolean) => {
    const pageType = `page.type('${selector}', '${value}')`;
    if (causesNavigation) {
      this.pushCodes(
        this.waitForSelectorAndNavigation(
          `${selector}:not([disabled])`,
          pageType
        )
      );
    } else {
      this.pushCodes(
        `await ${this.waitForSelector(
          `${selector}:not([disabled])`
        )};\n  await ${pageType};`
      );
    }
    return this;
  };

  select = (selector: string, option: string, causesNavigation: boolean) => {
    const pageSelectOption = `page.select('${selector}', '${option}')`;
    if (causesNavigation) {
      this.pushCodes(
        this.waitForSelectorAndNavigation(selector, pageSelectOption)
      );
    } else {
      this.pushCodes(
        `await ${this.waitForSelector(selector)};\n  await ${pageSelectOption};`
      );
    }
    return this;
  };

  keydown = (selector: string, key: string, causesNavigation: boolean) => {
    const pagePress = `page.keyboard.press('${key}')`;
    if (causesNavigation) {
      this.pushCodes(this.waitForSelectorAndNavigation(selector, pagePress));
    } else {
      this.pushCodes(
        `await page.waitForSelector('${selector}');\n  await page.keyboard.press('${key}');`
      );
    }
    return this;
  };

  wheel = (deltaX: number, deltaY: number) => {
    this.pushCodes(
      `await page.evaluate(() => window.scrollBy(${deltaX}, ${deltaY}));`
    );
    return this;
  };

  fullScreenshot = () => {
    this.pushCodes(
      `await page.screenshot({ path: 'screenshot.png', fullPage: true });`
    );
    return this;
  };

  awaitText = (text: string) => {
    this.pushCodes(
      `await page.waitForFunction("document.body.innerText.includes('${text}')");`
    );
    return this;
  };

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

export class CypressScriptBuilder extends ScriptBuilder {
  // Cypress automatically detects and waits for the page to finish loading
  click = (selector: string, causesNavigation: boolean) => {
    this.pushCodes(`cy.get('${selector}').click()`);
    return this;
  };

  hover = (selector: string, causesNavigation: boolean) => {
    this.pushCodes(`cy.get('${selector}').trigger('mouseover')`);
    return this;
  };

  load = (url: string) => {
    this.pushCodes(`cy.visit('${url}')`);
    return this;
  };

  resize = (width: number, height: number) => {
    this.pushCodes(`cy.viewport(${width}, ${height})`);
    return this;
  };

  fill = (selector: string, value: string, causesNavigation: boolean) => {
    this.pushCodes(`cy.get('${selector}').type('${value}')`);
    return this;
  };

  type = (selector: string, value: string, causesNavigation: boolean) => {
    this.pushCodes(`cy.get('${selector}').type('${value}')`);
    return this;
  };

  select = (selector: string, option: string, causesNavigation: boolean) => {
    this.pushCodes(`cy.get('${selector}').select('${option}')`);
    return this;
  };

  keydown = (selector: string, key: string, causesNavigation: boolean) => {
    this.pushCodes(`cy.get('${selector}').type('{${key}}')`);
    return this;
  };

  wheel = (
    deltaX: number,
    deltaY: number,
    pageXOffset?: number,
    pageYOffset?: number
  ) => {
    this.pushCodes(
      `cy.scrollTo(${Math.floor(pageXOffset ?? 0)}, ${Math.floor(
        pageYOffset ?? 0
      )})`
    );
    return this;
  };

  fullScreenshot = () => {
    this.pushCodes(`cy.screenshot()`);
    return this;
  };

  awaitText = (text: string) => {
    this.pushCodes(`cy.contains('${text}')`);
    return this;
  };

  build = () => {
    return `it('Written with DeploySentinel Recorder', () => {${this.actions.join(
      ''
    )}})`;
  };
}

const truncateText = (str: string, maxLen: number) => {
  return `${str.substring(0, maxLen)}${str.length > maxLen ? '...' : ''}`;
};

function describeAction(action: Action, lib: ScriptType) {
  return action?.type === ActionType.Click
    ? `Click on <${action.tagName.toLowerCase()}> ${
        action.selectors.text != null && action.selectors.text.length > 0
          ? `"${truncateText(action.selectors.text.replace('\n', ' '), 25)}"`
          : getBestSelectorForAction(action, lib)
      }`
    : action?.type === ActionType.Hover
    ? `Hover over <${action.tagName.toLowerCase()}> ${
        action.selectors.text != null && action.selectors.text.length > 0
          ? `"${truncateText(action.selectors.text.replace('\n', ' '), 25)}"`
          : getBestSelectorForAction(action, lib)
      }`
    : action?.type === ActionType.Input
    ? `Fill "${
        action.value
      }" on <${action.tagName.toLowerCase()}> ${getBestSelectorForAction(
        action,
        lib
      )}`
    : action?.type == ActionType.Keydown
    ? `Press ${action.key} on ${action.tagName.toLowerCase()}`
    : action?.type == ActionType.Load
    ? `Load "${action.url}"`
    : action.type === ActionType.Resize
    ? `Resize window to ${action.width} x ${action.height}`
    : action.type === ActionType.Wheel
    ? `Scroll wheel by X:${action.deltaX}, Y:${action.deltaY}`
    : action.type === ActionType.FullScreenshot
    ? `Take full page screenshot`
    : action.type === ActionType.AwaitText
    ? `Wait for text "${truncateText(action.text, 25)}" to appear`
    : '';
}

export function genCode(
  actions: Action[],
  showComments: boolean = true,
  lib: ScriptType = 'playwright' as ScriptType
): string {
  let scriptBuilder: ScriptBuilder;

  switch (lib) {
    case ScriptType.Playwright:
      scriptBuilder = new PlaywrightScriptBuilder();
      break;
    case ScriptType.Puppeteer:
      scriptBuilder = new PuppeteerScriptBuilder();
      break;
    case ScriptType.Cypress:
      scriptBuilder = new CypressScriptBuilder();
      break;
    default:
      throw new Error('Unsupported script type');
  }

  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];

    if (!isSupportedActionType(action.type)) {
      continue;
    }

    const nextAction = actions[i + 1];
    const causesNavigation = nextAction?.type === ActionType.Navigate;
    const actionDescription = describeAction(action, lib);

    if (showComments) {
      scriptBuilder.pushComments(`// ${actionDescription}`);
    }

    let bestSelector = null;

    // Selector-based actions
    if (
      action.type === ActionType.Click ||
      action.type === ActionType.Input ||
      action.type === ActionType.Keydown ||
      action.type === ActionType.Hover
    ) {
      bestSelector = getBestSelectorForAction(action, lib);
      if (bestSelector === null) {
        throw new Error(`Cant generate selector for action ${action}`);
      }
    }

    console.log('@@@@@@@@@@2');
    console.log(action);
    console.log('@@@@@@@@@@2');

    switch (action.type) {
      case ActionType.Click:
        scriptBuilder.click(bestSelector as string, causesNavigation);
        break;
      case ActionType.Hover:
        scriptBuilder.hover(bestSelector as string, causesNavigation);
        break;
      case ActionType.Keydown:
        scriptBuilder.keydown(
          bestSelector as string,
          action.key ?? '',
          causesNavigation
        );
        break;
      case ActionType.Input: {
        if (action.tagName === TagName.Select) {
          scriptBuilder.select(
            bestSelector as string,
            action.value ?? '',
            causesNavigation
          );
        } else if (
          // If the input is "fillable" or a text area
          (action.tagName === TagName.Input &&
            action.inputType != null &&
            FILLABLE_INPUT_TYPES.includes(action.inputType)) ||
          action.tagName === TagName.TextArea
        ) {
          // Do more actionability checks
          scriptBuilder.fill(
            bestSelector as string,
            action.value ?? '',
            causesNavigation
          );
        } else {
          scriptBuilder.type(
            bestSelector as string,
            action.value ?? '',
            causesNavigation
          );
        }
        break;
      }
      case ActionType.Load:
        scriptBuilder.load(action.url);
        break;
      case ActionType.Resize:
        scriptBuilder.resize(action.width, action.height);
        break;
      case ActionType.Wheel:
        scriptBuilder.wheel(
          action.deltaX,
          action.deltaY,
          action.pageXOffset,
          action.pageYOffset
        );
        break;
      case ActionType.FullScreenshot:
        scriptBuilder.fullScreenshot();
        break;
      case ActionType.AwaitText:
        scriptBuilder.awaitText(action.text);
        break;
      default:
        break;
    }
  }
  return scriptBuilder.build();
}
