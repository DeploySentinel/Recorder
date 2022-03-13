export enum ActionsMode {
  Actions = 'actions',
  Code = 'code',
  Playwright = 'playwright',
  Puppeteer = 'puppeteer',
}

export type BaseAction = {
  type: string;
  tagName: string;
  inputType: string | undefined;
  value: string | undefined;
  selectors: { [key: string]: string | null };
  timestamp: number;
  isPassword: boolean;
};

export type ResizeAction = {
  type: 'resize';
  width: number;
  height: number;
};

export type Action =
  | (BaseAction & {
      type: 'keydown';
      key: string;
    })
  | (BaseAction & {
      type: 'input';
    })
  | (BaseAction & {
      type: 'click';
    })
  | (BaseAction & {
      type: 'hover';
    })
  | { type: 'load'; url: string }
  | {
      type: 'navigate';
      url: string;
      source: string;
    }
  | ResizeAction
  | { type: 'wheel'; deltaY: number; deltaX: number }
  | { type: 'fullScreenshot' }
  | (BaseAction & { type: 'awaitText'; text: string });

