// Isolated browser QA: synthetic profile, mocked APIs, no real OTPs or payouts.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';

const root = path.resolve(process.argv[2] || '.preview/web');
const output = path.resolve(process.argv[3] || '.preview/screenshots');
fs.mkdirSync(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const route = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let file = path.resolve(root, '.' + route);
  if (file !== root && !file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
await new Promise(resolve => server.listen(4767, '127.0.0.1', resolve));
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'paisa-design-qa-'));
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=9477', '--remote-allow-origins=http://127.0.0.1:9477', '--user-data-dir=' + profileDir, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws, nextId = 0;
const pending = new Map();
const errors = [];
const checks = [];
const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++nextId; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(r.exceptionDetails.text + ': ' + r.exceptionDetails.exception?.description); return r.result?.value; };
async function waitFor(expression, label) {
  for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(200); }
  throw Error('Timed out: ' + label + '\n' + await evaluate('document.body.innerText.slice(0,2000)'));
}
async function capture(name) { await sleep(250); const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(data, 'base64')); }
async function click(label) { const ok = await evaluate(`(()=>{const x=[...document.querySelectorAll('[role="button"],button,[role="tab"],a')].find(x=>x.textContent.trim()===${JSON.stringify(label)} || x.getAttribute('aria-label')===${JSON.stringify(label)});if(!x)return false;x.click();return true})()`); if (!ok) throw Error('Missing control: '+label); }
async function viewport(width, height) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }); }
async function input(label, value) { await evaluate(`(()=>{let x=document.querySelector('input[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(x,${JSON.stringify(value)});x.dispatchEvent(new Event('input',{bubbles:true}));})()`); }
async function assert(expression, label) { if (!await evaluate(expression)) throw Error(label); checks.push(label); }

const seed = { name: 'Ananya Rao', phoneNumber: '9000000000', email: 'preview@example.test', occupation: 'Self employed', qualification: 'Graduate', annualIncome: '300000', pincode: '500001', dateOfBirth: { day: '1', month: '1', year: '1990' }, createdAt: '2026-09-20T00:00:00.000Z' };
try {
  let pages;
  for (let i = 0; i < 70; i++) { try { pages = await (await fetch('http://127.0.0.1:9477/json')).json(); if (pages.length) break; } catch {} await sleep(150); }
  ws = new WebSocket(pages.find(x => x.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
  ws.addEventListener('message', event => { const data = JSON.parse(event.data); if (data.id) { const p = pending.get(data.id); pending.delete(data.id); data.error ? p?.reject(Error(data.error.message)) : p?.resolve(data.result); } else if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.exception?.description || data.params.exceptionDetails.text); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['https://*', 'http://paisa-mart.com/*'] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__qaRequests=[];
    const realFetch=window.fetch.bind(window);
    window.fetch=async (input, init)=>{
      const url=typeof input==='string'?input:input.url;
      if(url.includes('/api/')){
        window.__qaRequests.push({url,body:init?.body});
        if(url.includes('send-otp')){await new Promise(r=>setTimeout(r,500));return new Response(JSON.stringify(window.__qaOtpSuccess?{success:true,reqId:'preview-request'}:{error:'Preview: simulated OTP provider error'}),{status:window.__qaOtpSuccess?200:503,headers:{'Content-Type':'application/json'}})}
        return new Response(JSON.stringify({success:true,data:${JSON.stringify(seed)}}),{headers:{'Content-Type':'application/json'}});
      }
      return realFetch(input,init);
    };
  ` });
  await viewport(1440, 1000);
  await send('Page.navigate', { url: 'http://127.0.0.1:4767/' });
  await waitFor("document.body.innerText.includes('Welcome to Paisa Mart')", 'login');
  await capture('login-desktop'); await assert('document.getElementById("root").getBoundingClientRect().width === 1440', 'Packaged desktop layout uses the full viewport');
  await assert("!!document.querySelector('[aria-disabled=\"true\"]')", 'Login stays disabled before a valid phone number');
  await viewport(390, 844); await capture('login-mobile');
  await viewport(320, 740); await capture('login-small');
  await assert('document.documentElement.scrollWidth <= innerWidth', 'Login fits a 320px viewport');
  await input('Mobile number', '9000000000');
  await click('Get started'); await click('Sending your code…');
  await waitFor("document.body.innerText.includes('simulated OTP provider error')", 'OTP error');
  await assert("window.__qaRequests.filter(x=>x.url.includes('send-otp')).length===1", 'Rapid taps generate only one OTP request');
  await evaluate('window.__qaOtpSuccess=true'); await click('Get started');
  await waitFor("document.body.innerText.includes(\"Let's make it official.\")", 'OTP screen');
  await capture('otp-small');
  await assert('document.documentElement.scrollWidth <= innerWidth', 'Six OTP fields fit a 320px viewport');
  await evaluate(`localStorage.setItem('user-profile-storage', JSON.stringify({state:{profile:${JSON.stringify(seed)}},version:0}))`);
  await viewport(390, 844);
  await send('Page.navigate', { url: 'http://127.0.0.1:4767/(tabs)' });
  await waitFor("document.body.innerText.includes(\"Let's grow.\")", 'home');
  await capture('home-mobile');
  await viewport(1440, 1050); await capture('home-desktop');
  await viewport(390, 844);
  for (const [label, text] of [['Products','Made for every ambition.'],['Learn','A little learning. A lot of growth.'],['Earnings','Every effort adds up.'],['Profile',"A space that's yours."]]) {
    await click(label); await waitFor(`document.body.innerText.includes(${JSON.stringify(text)})`, label); await capture(label.toLowerCase()+'-mobile'); checks.push(label + ' tab renders');
  }
  await click('Log out'); await waitFor("document.body.innerText.includes('Log out?')", 'logout dialog'); await click('Cancel');
  checks.push('Logout confirmation can be cancelled');
  await click('Products'); await input('Search products','does-not-exist-qa');
  await waitFor("document.body.innerText.includes('No matches yet')", 'empty search'); await click('Clear search');
  await waitFor("!document.body.innerText.includes('No matches yet')", 'cleared search'); checks.push('Product search and clear state work');
  await click('Bank Accounts'); await waitFor("document.body.innerText.includes('View benefits')", 'bank category'); await capture('bank-products-mobile');
  await click('Home'); await click('Home Loans'); await waitFor("document.body.innerText.includes('Home Loan')", 'home loan form'); checks.push('Latest home-loan navigation preserved');
  await assert("document.fonts.check('14px Jakarta')", 'Bundled typography loaded');
  if (errors.length) throw Error('Browser runtime errors: ' + errors.join('\n'));
  checks.push('No browser runtime exceptions');
  fs.writeFileSync(path.join(output, 'qa-report.json'), JSON.stringify({ checks, errors, profile: 'Synthetic test profile only', externalNetwork: 'Blocked; APIs mocked' }, null, 2));
  console.log(JSON.stringify({ checks, screenshots: output }, null, 2));
} catch (error) {
  if (ws?.readyState === WebSocket.OPEN) { await capture('failure').catch(()=>{}); console.error(await evaluate('document.body.innerText.slice(0,3000)').catch(()=>'')); }
  console.error(error.stack); process.exitCode = 1;
} finally {
  if (ws?.readyState === WebSocket.OPEN) { await send('Browser.close').catch(()=>{}); ws.close(); }
  browser.kill(); server.close();
}
