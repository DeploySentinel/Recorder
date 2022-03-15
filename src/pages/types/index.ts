export enum ActionsMode {
  Actions = 'actions',
  Code = 'code',
  Playwright = 'playwright',
  Puppeteer = 'puppeteer',
}

export enum ActionType {
  AwaitText = 'awaitText',
  Click = 'click',
  FullScreenshot = 'fullScreenshot',
  Hover = 'hover',
  Input = 'input',
  Keydown = 'keydown',
  Load = 'load',
  Navigate = 'navigate',
  Resize = 'resize',
  Wheel = 'wheel',
}

export interface BaseAction {
  type: ActionType;
  tagName: string;
  inputType: string | undefined;
  value: string | undefined;
  selectors: { [key: string]: string | null };
  timestamp: number;
  isPassword: boolean;
};

class KeydownAction extends BaseAction {
  type: ActionType.Keydown;
  key: string;
}

class InputAction extends BaseAction {
  type: ActionType.Input;
}

class ClickAction extends BaseAction {
  type: ActionType.Click;
}

class HoverAction extends BaseAction {
  type: ActionType.Hover;
}

class LoadAction extends BaseAction {
  type: ActionType.Load;
  url: string;
}

class NavigateAction extends BaseAction {
  type: ActionType.Navigate;
  url: string;
  source: string;
}

class WheelAction extends BaseAction {
  type: ActionType.Wheel;
  deltaX: number;
  deltaY: number;
}

class FullScreenshotAction extends BaseAction {
  type: ActionType.FullScreenshot;
}

class AwaitTextAction extends BaseAction {
  type: ActionType.AwaitText;
  text: string;
}

class ResizeAction extends BaseAction {
  type: ActionType.Resize;
  width: number;
  height: number;
};

export type Action = KeydownAction |
  InputAction |
  ClickAction |
  HoverAction |
  LoadAction |
  NavigateAction |
  WheelAction |
  FullScreenshotAction |
  AwaitTextAction |
  ResizeAction;
