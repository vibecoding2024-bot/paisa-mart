// Isolated browser QA: synthetic profile, mocked APIs, no real OTPs or payouts.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawn } from 'node:child_process';

const root = path.resolve(process.argv[2] || '.preview/web');
const output = path.resolve(process.argv[3] || '.preview/flow-screenshots');
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
async function click(label) { const ok = await evaluate(`(()=>{const x=[...document.querySelectorAll('[role="button"],button,[role="tab"],a,[tabindex="0"]')].find(x=>x.textContent.trim()===${JSON.stringify(label)} || x.getAttribute('aria-label')===${JSON.stringify(label)});if(!x)return false;x.click();return true})()`); if (!ok) throw Error('Missing control: '+label); }
async function viewport(width, height) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false }); }
async function input(label, value) { await evaluate(`(()=>{let x=document.querySelector('input[aria-label="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(x,${JSON.stringify(value)});x.dispatchEvent(new Event('input',{bubbles:true}));})()`); }
async function assert(expression, label) { if (!await evaluate(expression)) throw Error(label); checks.push(label); }


async function placeholder(label,value) { await evaluate(`(()=>{const x=document.querySelector('input[placeholder="${label}"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(x,${JSON.stringify(value)});x.dispatchEvent(new Event('input',{bubbles:true}));})()`); }
try {
 let pages;for(let i=0;i<70;i++){try{pages=await(await fetch('http://127.0.0.1:9477/json')).json();if(pages.length)break;}catch{}await sleep(150);}
 ws=new WebSocket(pages.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',event=>{const d=JSON.parse(event.data);if(d.id){const p=pending.get(d.id);pending.delete(d.id);d.error?p?.reject(Error(d.error.message)):p?.resolve(d.result);}else if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails.exception?.description||d.params.exceptionDetails.text);});
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Network.setBlockedURLs',{urls:['https://*','http://paisa-mart.com/*']});
 await viewport(390,844);
 await send('Page.navigate',{url:'http://127.0.0.1:4790/__preview'});await waitFor("document.body.innerText.includes('Local preview only')",'preview');
 await send('Page.navigate',{url:'http://127.0.0.1:4790/home-loans-details'});await waitFor("document.body.innerText.includes('Select date from calendar')",'form');
 await placeholder('Enter full name','Preview Flow Customer');await placeholder('Enter 10-digit mobile number','9000000000');await placeholder('Enter CIBIL score (300-900)','750');
 await click('Select date of birth from calendar');await waitFor("document.body.innerText.includes('Previous month') || !!document.querySelector('[aria-label=\"Previous month\"]')",'calendar');await capture('calendar');
 await click('01/01/' + (new Date().getFullYear()-25));
 await placeholder('Enter monthly income','50000');await placeholder('Enter existing EMI (0 if none)','0');await placeholder('Enter loan amount required','2500000');
 await click('Select Loan Type');await click('House Purchase');await placeholder('Enter city','Hyderabad');await click('Select State');await click('Telangana');
 await capture('form');await click('Submit');await waitFor("document.body.innerText.includes('Details submitted successfully')",'confirmation');await capture('confirmation');checks.push('Calendar and real isolated SQLite submission show confirmation');
 const reference=await evaluate("document.body.innerText.match(/HL-[a-zA-Z0-9-]+/)[0]");
 await click('View application status');await waitFor(`document.body.innerText.includes(${JSON.stringify(reference)})`,'customer status');await capture('customer-new');
 await send('Page.navigate',{url:'http://127.0.0.1:4790/admin'});await waitFor("!!document.querySelector('input[placeholder=\"Enter password\"]')",'admin login');
 await placeholder('admin@paisamart.com','admin@paisamart.com');await placeholder('Enter password','preview-only');await click('Sign In');await waitFor("document.body.innerText.includes('Home Loan Pipeline')",'admin');await click('Home Loan Pipeline');await waitFor("document.body.innerText.includes('Preview Flow Customer')",'pipeline');await viewport(1440,1000);await capture('pipeline');
 await evaluate(`(()=>{const x=[...document.querySelectorAll('[tabindex="0"]')].find(x=>x.textContent.includes(${JSON.stringify(reference)}));if(!x)throw Error('Lead missing');x.click()})()`);await waitFor("document.body.innerText.includes('Save changes')",'edit');await click('New leads');await click('Sanctioned');await click('Save changes');await waitFor("!document.body.innerText.includes('Save changes')",'saved');checks.push('Admin updates a real isolated lead to Sanctioned');
 await send('Page.navigate',{url:'http://127.0.0.1:4790/home-loan-applications'});await waitFor("document.body.innerText.includes('Sanctioned')",'updated customer status');await viewport(390,844);await capture('customer-sanctioned');checks.push('Customer reads updated Sanctioned status from isolated backend');
 if(errors.length)throw Error(errors.join('\n'));
 fs.writeFileSync(path.join(output,'flow-report.json'),JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
} catch(error) {if(ws?.readyState===WebSocket.OPEN){await capture('failure').catch(()=>{});console.error(await evaluate('document.body.innerText.slice(0,3000)').catch(()=>''));}console.error(error.stack);process.exitCode=1;}
finally {if(ws?.readyState===WebSocket.OPEN){await send('Browser.close').catch(()=>{});ws.close();}browser.kill();server.close();}
