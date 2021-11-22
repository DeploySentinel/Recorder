import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { getBestSelectorForAction } from './selector';

import type { Action } from './recorder';

class PlaywrightScriptBuilder {
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

  input(selector: string, value: string, causesNavigation: boolean) {
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
}

class PuppeteerScriptBuilder {
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

  input(selector: string, value: string, causesNavigation: boolean) {
    const pageType = `page.type('${selector}', '${value}')`;
    if (causesNavigation) {
      return this.waitForSelectorAndNavigation(selector, pageType);
    }
    return `await ${this.waitForSelector(selector)};\n  await ${pageType};`;
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
}

function describeAction(action: Action) {
  return action?.type === 'click'
    ? `Click on <${action.tagName.toLowerCase()}> ${
        action.selectors.text != null && action.selectors.text.length > 0
          ? `"${action.selectors.text.replaceAll('\n', ' ').substring(0, 25)}${
              action.selectors.text.length > 25 ? '...' : ''
            }"`
          : getBestSelectorForAction(action)
      }`
    : action?.type === 'hover'
    ? `Hover over <${action.tagName.toLowerCase()}> ${
        action.selectors.text != null && action.selectors.text.length > 0
          ? `"${action.selectors.text.replaceAll('\n', ' ').substring(0, 25)}${
              action.selectors.text.length > 25 ? '...' : ''
            }"`
          : getBestSelectorForAction(action)
      }`
    : action?.type === 'input'
    ? `Fill "${
        action.value
      }" on <${action.tagName.toLowerCase()}> ${getBestSelectorForAction(
        action
      )}`
    : action?.type == 'keydown'
    ? `Press ${action.key} on ${action.tagName.toLowerCase()}`
    : action?.type == 'load'
    ? `Load "${action.url}"`
    : action.type === 'resize'
    ? `Resize window to ${action.width} x ${action.height}`
    : action.type === 'wheel'
    ? `Scroll wheel by X:${action.deltaX}, Y:${action.deltaY}`
    : action.type === 'fullScreenshot'
    ? `Take full page screenshot`
    : '';
}

export function genCode(
  actions: Action[],
  showComments: boolean = true,
  lib: 'playwright' | 'puppeteer' = 'playwright'
): string {
  const scriptBuilder =
    lib === 'playwright'
      ? new PlaywrightScriptBuilder()
      : new PuppeteerScriptBuilder();
  const lines = actions.map((action, i) => {
    const nextAction = actions[i + 1];
    const causesNavigation = nextAction?.type === 'navigate';
    const actionDescription = `${describeAction(action)}${
      causesNavigation && lib === 'puppeteer' ? ' and await navigation' : ''
    }`;
    let line = '';

    // Selector-based actions
    if (
      action.type === 'click' ||
      action.type === 'input' ||
      action.type === 'keydown' ||
      action.type === 'hover'
    ) {
      const bestSelector = getBestSelectorForAction(action);
      if (bestSelector == null) {
        throw new Error(`Cant generate selector for action ${action}`);
      }

      if (action.type === 'click') {
        line += scriptBuilder.click(bestSelector, causesNavigation);
      } else if (action.type === 'hover') {
        line += scriptBuilder.hover(bestSelector, causesNavigation);
      } else if (action.type === 'keydown') {
        line += scriptBuilder.keydown(
          bestSelector,
          action.key ?? '',
          causesNavigation
        );
      } else if (action.type === 'input') {
        if (action.tagName === 'SELECT') {
          line += scriptBuilder.select(
            bestSelector,
            action.value ?? '',
            causesNavigation
          );
        } else {
          line += scriptBuilder.input(
            bestSelector,
            action.value ?? '',
            causesNavigation
          );
        }
      }
    } else if (action.type === 'load') {
      line += scriptBuilder.load(action.url);
    } else if (action.type === 'resize') {
      line += scriptBuilder.resize(action.width, action.height);
    } else if (action.type === 'wheel') {
      line += scriptBuilder.wheel(action.deltaX, action.deltaY);
    } else if (action.type === 'fullScreenshot') {
      line += scriptBuilder.fullScreenshot();
    } else {
      return null;
    }
    return `${showComments ? `  // ${actionDescription}\n` : ''}  ${line}`;
  });

  return scriptBuilder.fileTemplate(
    lines.filter((v) => v != null).join('\n\n')
  );
}

export default function CodeGen({
  actions,
  library,
  styles,
}: {
  actions: Action[];
  library: 'playwright' | 'puppeteer';
  styles?: React.CSSProperties;
}) {
  return (
    <SyntaxHighlighter
      language="javascript"
      style={vscDarkPlus}
      customStyle={{
        background: 'none',
        padding: 0,
        overflow: 'auto',
        paddingRight: '1em',
        paddingBottom: '1em',
        ...(styles || {}),
      }}
      data-testid="code-block"
    >
      {genCode(actions, true, library)}
    </SyntaxHighlighter>
  );
}
