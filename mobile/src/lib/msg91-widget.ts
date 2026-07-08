export type Msg91WidgetResult = {
  accessToken?: string;
  token?: string;
  message?: string;
  [key: string]: unknown;
};

type WidgetConfiguration = {
  widgetId: string;
  tokenAuth: string;
  identifier: string;
  exposeMethods: boolean;
  success: (data: Msg91WidgetResult) => void;
  failure: (error: unknown) => void;
};

declare global {
  interface Window {
    initSendOTP?: (configuration: WidgetConfiguration) => void;
  }
}

const MSG91_WIDGET_SCRIPT = 'https://verify.msg91.com/otp-provider.js';
const WIDGET_TIMEOUT_MS = 15_000;

let scriptPromise: Promise<void> | null = null;

function loadWidgetScript() {
  if (typeof document === 'undefined') return Promise.reject(new Error('MSG91 widget is web-only'));
  if (window.initSendOTP) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${MSG91_WIDGET_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load MSG91 OTP widget')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = MSG91_WIDGET_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Unable to load MSG91 OTP widget'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function getMsg91WebWidgetConfig() {
  const widgetId = process.env.EXPO_PUBLIC_MSG91_WEB_WIDGET_ID;
  const tokenAuth = process.env.EXPO_PUBLIC_MSG91_WEB_WIDGET_TOKEN_AUTH;
  if (!widgetId || !tokenAuth) return null;
  return { widgetId, tokenAuth };
}

export async function startMsg91WebOtp(phone: string) {
  const config = getMsg91WebWidgetConfig();
  if (!config) throw new Error('MSG91 web widget is not configured');

  await loadWidgetScript();
  if (!window.initSendOTP) throw new Error('MSG91 web widget did not initialize');

  return new Promise<Msg91WidgetResult>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error('MSG91 web widget did not respond. Using OTP code flow instead.'));
    }, WIDGET_TIMEOUT_MS);

    window.initSendOTP?.({
      widgetId: config.widgetId,
      tokenAuth: config.tokenAuth,
      identifier: `91${phone}`,
      exposeMethods: true,
      success: (data) => {
        window.clearTimeout(timeout);
        resolve(data);
      },
      failure: (error) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    });
  });
}

export function getMsg91AccessToken(data: Msg91WidgetResult) {
  const token = data.accessToken || data.token || data.message;
  return typeof token === 'string' ? token : null;
}
