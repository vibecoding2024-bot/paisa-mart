let otpLoginActive = false;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

export function startOtpLoginFlow() {
  otpLoginActive = true;
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}

export function finishOtpLoginFlow(delayMs = 4000) {
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    otpLoginActive = false;
    clearTimer = null;
  }, delayMs);
}

export function cancelOtpLoginFlow() {
  otpLoginActive = false;
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
}

export function isOtpLoginFlowActive() {
  return otpLoginActive;
}
