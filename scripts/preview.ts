// LOCAL ONLY. Starts an isolated SQLite/API preview; never imports production startup.
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, join, extname, sep } from 'node:path';
import { createHmac } from 'node:crypto';
const root = resolve(import.meta.dir, '..');
const directory = join(root, '.preview');
mkdirSync(directory, { recursive: true });
const reference = process.argv.includes('--reference');
const port = reference ? 4791 : 4790;
const web = reference ? resolve(root, '../.design-refresh/artifacts/deployment/web') : join(directory, 'web');
if (!existsSync(join(web,'index.html'))) throw new Error('Preview build is missing');
process.env.LEADS_DB = join(directory, 'preview-only.db');
process.env.HOME_LOANS_DATABASE_URL = '';
process.env.DATABASE_URL = '';
process.env.POSTGRES_URL = '';
process.env.HOME_LOAN_ADMIN_PASSWORD = 'preview-only';
process.env.HOME_LOAN_ADMIN_TOKEN_SECRET = 'local-preview-admin-secret-not-for-production';
process.env.AUTH_TOKEN_SECRET = 'local-preview-customer-secret-not-for-production';
process.env.ADMIN_EMAIL = 'admin@paisamart.com';
const { Hono } = await import('../backend/node_modules/hono');
const { homeLoansRouter } = await import('../backend/src/routes/home-loans');
const { adminRouter } = await import('../backend/src/routes/admin');
const app = new Hono();
app.route('/api/home-loans', homeLoansRouter);
app.route('/api/admin', adminRouter);
app.all('/api/*', c => c.json({success:false,message:'This operation is disabled in the local preview.'},403));
const seed = {name:'Preview Customer',phoneNumber:'9000000000',email:'preview@example.test',occupation:'Self employed',qualification:'Graduate',annualIncome:'300000',pincode:'500001',dateOfBirth:{day:'1',month:'1',year:'1990'},createdAt:'2026-10-06T00:00:00.000Z'};
const customerToken = () => {
 const data = Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:'+919000000000',exp:Math.floor(Date.now()/1000)+86400})).toString('base64url');
 return data+'.'+createHmac('sha256',process.env.AUTH_TOKEN_SECRET!).update(data).digest('base64url');
};
app.get('/__preview',c=>c.html(`<!doctype html><meta charset="utf-8"><title>LOCAL Paisa Mart preview</title><h1>Local preview only</h1><p>Isolated sample database. External API connections are blocked. No production data.</p><p>Use mobile number 9000000000 when submitting a sample application.</p><p><a href="/">Login design</a> · <a href="/(tabs)">Customer home</a> · <a href="/home-loans-details">Home Loan form</a> · <a href="/home-loan-applications">Application status</a> · <a href="/admin">Admin portal</a></p><p>Admin: admin@paisamart.com / preview-only</p><p>Other product pages are available through normal navigation. OTP, payments and external services are disabled.</p><script>localStorage.setItem('user-profile-storage',JSON.stringify({state:{profile:${JSON.stringify(seed)}},version:0}));localStorage.setItem('paisa_mart_auth_token',${JSON.stringify(customerToken())});</script>`));
app.get('*',async c=>{
 const pathname=decodeURIComponent(new URL(c.req.url).pathname);
 let file=resolve(web,'.'+pathname);
 if(!file.startsWith(web+sep)) file=join(web,'index.html');
 if(!existsSync(file) || !extname(file)) file=join(web,'index.html');
 const content=Bun.file(file);
 return new Response(content,{headers:{'Content-Type':content.type}});
});
Bun.serve({hostname:'127.0.0.1',port,fetch:async req=>{
 const response=await app.fetch(req);
 response.headers.set('Cache-Control','no-store');
 response.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'none'; form-action 'self'");
 return response;
}});
console.log(`LOCAL preview: http://127.0.0.1:${port}/__preview`);
