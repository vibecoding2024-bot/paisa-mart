// Self-contained VimoPay checkout/initiation page served at /api/payment/checkout.
// Collects details, calls POST /api/payment/create, then hands off to the gateway paymentUrl.
export const CHECKOUT_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Paisa Mart — Payment</title>
<style>
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
</style>
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
<script>
const $=id=>document.getElementById(id);
const amt=$('amount'), bamt=$('bamt');
amt.addEventListener('input',()=>bamt.textContent=amt.value||'0');

// If the gateway returned the user here after payment, show the result instead of the form.
(function(){
  const p=new URLSearchParams(location.search);
  const isReturn=['merchantRefId','refId','ref','txnId','txnid','status','txnStatus','responseCode'].some(k=>p.has(k));
  if(!isReturn) return;
  const ref=p.get('merchantRefId')||p.get('refId')||p.get('ref')||localStorage.getItem('pm_last_ref');
  const form=$('f'), msg=$('msg'), result=$('result');
  if(form) form.style.display='none';
  result.style.display='block';
  msg.className='msg ok'; msg.textContent='Verifying your payment…';
  function pill(st){var m=({Success:['#eafaf0','#1e7e45'],Failed:['#fdecec','#c0392b'],ValidationFailed:['#fdecec','#c0392b'],Pending:['#fff3e0','#e67e22']})[st]||['#eef2ff','#555'];return '<span class="pill" style="background:'+m[0]+';color:'+m[1]+'">'+(st||'Pending')+'</span>';}
  function render(d){
    result.innerHTML=
      '<div class="line"><span class="k">Ref</span><span class="v">'+(d.merchantRefId||ref||'-')+'</span></div>'+
      (d.txnId?'<div class="line"><span class="k">Txn ID</span><span class="v">'+d.txnId+'</span></div>':'')+
      (d.amount?'<div class="line"><span class="k">Amount</span><span class="v">₹'+d.amount+'</span></div>':'')+
      '<div class="line"><span class="k">Status</span>'+pill(d.status)+'</div>'+
      (d.responseMessage?'<div class="line"><span class="k">Message</span><span class="v">'+d.responseMessage+'</span></div>':'');
    if(d.status==='Success'){msg.className='msg ok';msg.textContent='Payment successful 🎉';}
    else if(d.status==='Failed'||d.status==='ValidationFailed'){msg.className='msg err';msg.textContent='Payment failed.';}
    else{msg.style.display='none';}
  }
  let tries=0;
  function poll(){
    if(!ref){result.innerHTML='<div class="line"><span class="k">Status</span>'+pill('Unknown')+'</div>';msg.className='msg err';msg.textContent='Could not identify the transaction.';return;}
    fetch('/api/payment/status/'+encodeURIComponent(ref)).then(r=>r.json()).then(d=>{
      render(d); tries++;
      if((!d.found||!d.status||d.status==='Pending'||d.status==='Unknown')&&tries<15) setTimeout(poll,2000);
    }).catch(function(){tries++; if(tries<15) setTimeout(poll,2000);});
  }
  poll();
})();

// load states for the dropdown
fetch('/api/payment/states').then(r=>r.json()).then(d=>{
  const sel=$('location');
  if(d && Array.isArray(d.data)){
    sel.innerHTML='<option value="">Select state</option>'+
      d.data.map(s=>'<option value="'+s.code+'">'+s.description+'</option>').join('');
  } else { sel.innerHTML='<option value="">(states unavailable)</option>'; }
}).catch(()=>{ $('location').innerHTML='<option value="">(states unavailable)</option>'; });

$('f').addEventListener('submit', async e=>{
  e.preventDefault();
  const msg=$('msg'), result=$('result'), btn=$('btn');
  msg.className='msg'; result.style.display='none';
  btn.disabled=true; btn.innerHTML='<span class="spin"></span> Processing…';
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
    if(d && d.paymentUrl){
      try{localStorage.setItem('pm_last_ref', j.merchantRefId||'');}catch(e){}
      msg.className='msg ok'; msg.textContent='Payment created — proceed to pay.';
      result.style.display='block';
      result.innerHTML=
        '<div class="line"><span class="k">Ref</span><span class="v">'+(j.merchantRefId||'-')+'</span></div>'+
        '<div class="line"><span class="k">Txn ID</span><span class="v">'+(d.txnId||'-')+'</span></div>'+
        '<div class="line"><span class="k">Amount</span><span class="v">₹'+(d.amount||'-')+'</span></div>'+
        '<div class="line"><span class="k">Status</span><span class="pill prog">'+(d.txnStatus||'-')+'</span></div>'+
        '<a class="pay-btn" href="'+d.paymentUrl+'" target="_blank" rel="noopener">Proceed to Payment →</a>';
    } else {
      msg.className='msg err';
      msg.textContent='Could not create payment: '+(j.error||(d&&d.responseMessage)||'unknown error');
    }
  }catch(err){ msg.className='msg err'; msg.textContent='Network error: '+err.message; }
  finally{ btn.disabled=false; btn.innerHTML='Pay ₹'+(amt.value||'0'); }
});
</script>
</body>
</html>`;
