// Self-contained VimoPay checkout/initiation page served at /api/payment/checkout.
// Collects details, calls POST /api/payment/create, then hands off to the gateway paymentUrl.
//
// A-42: every value shown on this page (URL parameters, the stored last reference, status/create/state API
// responses) is rendered as TEXT through DOM APIs; there is no innerHTML/outerHTML/insertAdjacentHTML/
// document.write. The gateway link is followed only if it is an https URL (the server also allowlists its
// host). The page is served with a Content-Security-Policy that allows only this exact script and style
// (SHA-256 hashes), so even an injected <script> or event handler could not run.
import { createHash } from "node:crypto";

const CHECKOUT_STYLE = `
  *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
  body{margin:0;font-family:'Plus Jakarta Sans',-apple-system,system-ui,sans-serif;
    background:linear-gradient(145deg,#0d0d1a,#1a0a2e 40%,#0d1f3c);min-height:100vh;
    display:flex;align-items:center;justify-content:center;padding:20px;color:#1a1a1a}
  .card{width:100%;max-width:420px;background:#fff;border-radius:20px;overflow:hidden;
    box-shadow:0 30px 80px rgba(0,0,0,.5)}
  .head{background:linear-gradient(135deg,#FF8C00,#FFB800);padding:22px 24px;color:#fff}
  .head .logo{display:flex;align-items:center;gap:9px;font-weight:800;font-size:19px}
  .head .dot{width:24px;height:24px;border-radius:7px;background:rgba(255,255,255,.25);
    display:flex;align-items:center;justify-content:center;font-size:13px}
  .head p{margin:6px 0 0;font-size:12px;opacity:.9}
  .body{padding:22px 24px}
  label{display:block;font-size:12px;font-weight:600;color:#555;margin:14px 0 6px}
  input,select{width:100%;padding:12px 14px;border:1.5px solid #e3e6ea;border-radius:11px;
    font-size:15px;outline:none;transition:border .15s;background:#fff}
  input:focus,select:focus{border-color:#FF8C00}
  .amt{position:relative}
  .amt span{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-size:16px;
    font-weight:700;color:#888}
  .amt input{padding-left:30px;font-weight:700;font-size:18px}
  button{width:100%;margin-top:22px;padding:14px;border:0;border-radius:12px;cursor:pointer;
    background:linear-gradient(135deg,#FF8C00,#FFB800);color:#fff;font-size:16px;font-weight:700;
    transition:transform .12s,opacity .15s}
  button:active{transform:scale(.97)}
  button:disabled{opacity:.55;cursor:not-allowed}
  .row{display:flex;gap:12px}.row>div{flex:1}
  .msg{margin-top:16px;padding:13px 15px;border-radius:11px;font-size:13px;display:none}
  .msg.err{display:block;background:#fdecec;color:#c0392b;border:1px solid #f5c6c6}
  .msg.ok{display:block;background:#eafaf0;color:#1e7e45;border:1px solid #b6e6c8}
  .result{display:none;margin-top:16px;padding:15px;border-radius:12px;background:#f6f8fa;
    border:1px solid #e3e6ea;font-size:13px}
  .result .k{color:#888}.result .v{font-weight:600;word-break:break-all}
  .result .line{display:flex;justify-content:space-between;gap:12px;padding:4px 0}
  .pill{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700}
  .pill.prog{background:#fff3e0;color:#e67e22}
  .pay-btn{display:block;text-align:center;margin-top:14px;padding:13px;border-radius:11px;
    background:#1a1a1a;color:#fff;text-decoration:none;font-weight:700;font-size:15px}
  .foot{text-align:center;font-size:11px;color:#aaa;padding:14px}
  .spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.5);
    border-top-color:#fff;border-radius:50%;animation:s .6s linear infinite;vertical-align:-2px}
  @keyframes s{to{transform:rotate(360deg)}}
`;

const CHECKOUT_SCRIPT = `
const $=id=>document.getElementById(id);
const amt=$('amount'), bamt=$('bamt');
amt.addEventListener('input',()=>{bamt.textContent=amt.value||'0';});

// Text-only DOM helpers: values are always assigned with textContent, never parsed as HTML.
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined&&text!==null)e.textContent=String(text);return e;}
function line(k,v){const d=el('div','line');d.append(el('span','k',k));d.append(v instanceof Node?v:el('span','v',v));return d;}
const PILL={Success:['#eafaf0','#1e7e45'],Failed:['#fdecec','#c0392b'],ValidationFailed:['#fdecec','#c0392b'],Pending:['#fff3e0','#e67e22']};
function pill(st){const label=(typeof st==='string'&&st)?st:'Pending';const m=Object.prototype.hasOwnProperty.call(PILL,label)?PILL[label]:['#eef2ff','#555'];const s=el('span','pill',label);s.style.background=m[0];s.style.color=m[1];return s;}
function safeHttpsUrl(u){try{const x=new URL(String(u));return (x.protocol==='https:'&&!x.username&&!x.password)?x.href:null;}catch(e){return null;}}
function present(v){return v!==undefined&&v!==null&&v!=='';}

// If the gateway returned the user here after payment, show the stored server status instead of the form.
// The URL only identifies the transaction; its status parameters are never trusted or displayed.
(function(){
  const p=new URLSearchParams(location.search);
  const isReturn=['merchantRefId','refId','ref','txnId','txnid','status','txnStatus','responseCode'].some(k=>p.has(k));
  if(!isReturn) return;
  let stored=null; try{stored=localStorage.getItem('pm_last_ref');}catch(e){}
  const ref=p.get('merchantRefId')||p.get('refId')||p.get('ref')||stored;
  const form=$('f'), msg=$('msg'), result=$('result');
  if(form) form.style.display='none';
  result.style.display='block';
  msg.className='msg ok'; msg.textContent='Verifying your payment…';
  function render(d){
    const rows=[line('Ref',(d.found&&d.merchantRefId)||ref||'-')];
    if(present(d.txnId)) rows.push(line('Txn ID',d.txnId));
    if(present(d.amount)) rows.push(line('Amount','₹'+d.amount));
    rows.push(line('Status',pill(d.status)));
    if(present(d.responseMessage)) rows.push(line('Message',d.responseMessage));
    result.replaceChildren(...rows);
    if(d.status==='Success'){msg.className='msg ok';msg.textContent='Payment successful 🎉';}
    else if(d.status==='Failed'||d.status==='ValidationFailed'){msg.className='msg err';msg.textContent='Payment failed.';}
    else{msg.style.display='none';}
  }
  let tries=0;
  function poll(){
    if(!ref){result.replaceChildren(line('Status',pill('Unknown')));msg.className='msg err';msg.textContent='Could not identify the transaction.';return;}
    fetch('/api/payment/status/'+encodeURIComponent(ref)).then(r=>r.json()).then(d=>{
      render(d||{}); tries++;
      if((!d||!d.found||!d.status||d.status==='Pending'||d.status==='Unknown')&&tries<15) setTimeout(poll,2000);
    }).catch(function(){tries++; if(tries<15) setTimeout(poll,2000);});
  }
  poll();
})();

// load states for the dropdown
fetch('/api/payment/states').then(r=>r.json()).then(d=>{
  const sel=$('location');
  if(d && Array.isArray(d.data)){
    sel.replaceChildren(new Option('Select state',''),...d.data.map(s=>new Option(String((s&&s.description)??''),String((s&&s.code)??''))));
  } else { sel.replaceChildren(new Option('(states unavailable)','')); }
}).catch(()=>{ $('location').replaceChildren(new Option('(states unavailable)','')); });

$('f').addEventListener('submit', async e=>{
  e.preventDefault();
  const msg=$('msg'), result=$('result'), btn=$('btn');
  msg.className='msg'; result.style.display='none';
  btn.disabled=true; btn.replaceChildren(el('span','spin'),document.createTextNode(' Processing…'));
  try{
    const body={
      amount:parseFloat(amt.value), custName:$('custName').value.trim(),
      custMobile:$('custMobile').value.trim(), email:$('email').value.trim(),
      location:$('location').value
    };
    const r=await fetch('/api/payment/create',{method:'POST',
      headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const j=await r.json();
    const d=j.data;
    const payUrl=d?safeHttpsUrl(d.paymentUrl):null;
    if(payUrl){
      try{localStorage.setItem('pm_last_ref', String(j.merchantRefId||''));}catch(e){}
      msg.className='msg ok'; msg.textContent='Payment created — proceed to pay.';
      const status=el('span','pill prog',present(d.txnStatus)?d.txnStatus:'-');
      const a=el('a','pay-btn','Proceed to Payment →'); a.href=payUrl; a.target='_blank'; a.rel='noopener noreferrer';
      result.replaceChildren(line('Ref',j.merchantRefId||'-'),line('Txn ID',present(d.txnId)?d.txnId:'-'),
        line('Amount','₹'+(present(d.amount)?d.amount:'-')),line('Status',status),a);
      result.style.display='block';
    } else {
      msg.className='msg err';
      msg.textContent=d&&present(d.paymentUrl)?'The payment link was rejected as unsafe.':
        'Could not create payment: '+(j.error||(d&&d.responseMessage)||'unknown error');
    }
  }catch(err){ msg.className='msg err'; msg.textContent='Network error: '+err.message; }
  finally{ btn.disabled=false; btn.textContent='Pay ₹'+(amt.value||'0'); }
});
`;

const sha256 = (text: string) => "'sha256-" + createHash("sha256").update(text, "utf8").digest("base64") + "'";

/** Allows only this page's own script and style; no other script can execute, even if markup were injected. */
export const CHECKOUT_CSP = [
  "default-src 'none'",
  `script-src ${sha256(CHECKOUT_SCRIPT)}`,
  `style-src ${sha256(CHECKOUT_STYLE)}`,
  "connect-src 'self'",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ");

export const CHECKOUT_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Paisa Mart — Payment</title>
<style>${CHECKOUT_STYLE}</style>
</head>
<body>
<div class="card">
  <div class="head">
    <div class="logo"><span class="dot">₹</span> Paisa Mart</div>
    <p>Secure payment powered by VimoPay</p>
  </div>
  <div class="body">
    <form id="f">
      <label>Amount</label>
      <div class="amt"><span>₹</span><input id="amount" type="number" min="1" max="99999" step="0.01" value="10" required /></div>
      <label>Full name (as in Aadhaar)</label>
      <input id="custName" type="text" placeholder="Your name" required />
      <div class="row">
        <div>
          <label>Mobile</label>
          <input id="custMobile" type="tel" pattern="[0-9]{10}" maxlength="10" placeholder="10-digit" required />
        </div>
        <div>
          <label>State</label>
          <select id="location" required><option value="">Loading…</option></select>
        </div>
      </div>
      <label>Email</label>
      <input id="email" type="email" placeholder="you@example.com" required />
      <button id="btn" type="submit">Pay ₹<span id="bamt">10</span></button>
    </form>
    <div id="msg" class="msg"></div>
    <div id="result" class="result"></div>
  </div>
  <div class="foot">🔒 Your details are encrypted end-to-end</div>
</div>
<script>${CHECKOUT_SCRIPT}</script>
</body>
</html>`;
