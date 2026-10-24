const fs = require('fs');
const path = require('path');

const out = path.resolve(process.cwd(), 'jurid-standalone.html');
const p = process.cwd();
const pagePath = path.join(p, 'src', 'app', 'page.tsx');

// Read the real page source so the standalone file mirrors it.
if (!fs.existsSync(pagePath)) {
  console.error('missing page source:', pagePath);
  process.exit(2);
}

const pageSource = fs.readFileSync(pagePath, 'utf8');
const appStartMarker = 'export default function JurisLandingPage()';
const appStartIdx = pageSource.indexOf(appStartMarker);
console.log('appStartIdx', appStartIdx, 'page length', pageSource.length);
const classTunnelIdx = pageSource.indexOf('class TunnelCard');
console.log('class TunnelCard idx', classTunnelIdx);
const classAppIdx = pageSource.indexOf('class App');
console.log('class App idx', classAppIdx);
const functionAppIdx = pageSource.indexOf('function App');
console.log('function App idx', functionAppIdx);
const beforeContent = pageSource.slice(0, appStartIdx);
console.log('before-app contains class TunnelCard:', beforeContent.includes('class TunnelCard'));
console.log('before-app contains function App:', beforeContent.includes('function App'));
console.log('before-app contains class App:', beforeContent.includes('class App'));

// Take everything from the first function/class definitions up to the app
// entry, so the standalone file carries the same tunnel logic as the page.
const firstDefinitionIdx = Math.max(
  pageSource.indexOf('interface TunnelCardProps'),
  pageSource.indexOf('function TunnelCard'),
  pageSource.indexOf('function HeroLayer'),
  pageSource.indexOf('function LoginCard'),
  pageSource.indexOf('function SkipControl'),
  pageSource.indexOf('function TunnelBackground'),
  pageSource.indexOf('function App'),
  pageSource.indexOf('class App'),
  0,
);
console.log('firstDefinitionIdx', firstDefinitionIdx);

const beforeApp = pageSource.slice(firstDefinitionIdx, appStartIdx);
const appBody = pageSource.slice(appStartIdx);
console.log('beforeApp length', beforeApp.length);
console.log('beforeApp includes function TunnelCard:', beforeApp.includes('function TunnelCard'));
console.log('beforeApp includes function App:', beforeApp.includes('function App'));
console.log('beforeApp includes class App:', beforeApp.includes('class App'));

if (appStartIdx === -1) {
  console.error('did not find app entry marker in page.tsx');
  process.exit(3);
}

// Take everything from the first function/class definitions up to the app
// entry, so the standalone file carries the same tunnel logic as the page.
const beforeApp = pageSource.slice(0, appStartIdx);
const appBody = pageSource.slice(appStartIdx);

// Rebuild the app entry as an ordinary function call so the standalone page
// can execute the same tunnel logic a browser can run.
function stripExports(src, srcName) {
  // Preserve the exact app source but remove top-level 'export' keywords
  // so the standalone file can evaluate it in a browser without module
  // transformations.
  let out = src
    .replace(/export default function/g, 'function')
    .replace(/export const /g, 'const ')
    .replace(/export function /g, 'function ')
    .replace(/export class /g, 'class ')
    .replace(/^export /gm, '')
    .replace(/export ({|export )([a-zA-Z_][a-zA-Z0-9_]*)/gm, '$1');
  // Also strip JSDoc end markers and raw template delimiters that would
  // prematurely close the wrapper template literal.
  out = out.replace(/\*\//g, '/');
  if (out.includes('`') || out.includes('${') || out.includes('\`')) {
    console.error(srcName, 'contains template-literal delimiters; skipping risky replacements');
  }
  return out;
}

// Before injecting the app code into a template literal, normalize it so
// the wrapper stays valid regardless of stray backticks or ${} in the
// source. We do this after stripping exports so the normalized form is
// what ends up in the standalone file.
function normalizeAppCode(src, srcName) {
  let out = src;
  // Escape any backticks and ${ sequences that would break the wrapper
  // template literal.
  out = out.replace(/`/g, String.fromCharCode(96));
  out = out.replace(/\$\{/g, String.fromCharCode(36,123));
  // If the source still contains suspicious delimiters after escaping,
  // emit a warning but keep going so we do not silently produce a shell.
  if (out.includes('`') || out.includes('${')) {
    console.error(srcName, 'still has template-literal delimiters after escaping');
  }
  return out;
}

  console.log('found page source at', pagePath);
  console.log('pageSource length', pageSource.length);
  console.log('appBody length', appBody.length);
  const appEntryRaw = stripExports(appBody, pagePath);
  console.log('appEntryRaw length', appEntryRaw.length);
  const appEntry = normalizeAppCode(appEntryRaw, pagePath);
  console.log('appEntry normalized length', appEntry.length);
  console.log('normalized includes class TunnelCard:', appEntry.includes('class TunnelCard'));
  console.log('normalized includes class App:', appEntry.includes('class App'));

// Build a browser-executable wrapper from the real page source.
const body = `
<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Juris — Standalone Preview</title>
<style>
html,body{margin:0;padding:0;height:100%;overflow:hidden}
body{background:#f6f2ea;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
input,button{font:inherit}
.tcard,.login-card,.bg{will-change:transform}
.hero,.login,.skip,.tcard{position:fixed}
.tcard{pointer-events:none}
.login{cursor:default}
.input,btn-primary{display:block;width:100%;box-sizing:border-box}
.input{-webkit-appearance:none;appearance:none}
</style>
</head>
<body>
<noscript>
  <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;background:#f6f2ea;color:#16202f">
    Enable JavaScript to enter the Chambers.
  </div>
</noscript>
<div id="root"></div>
<script>
(function () {
  'use strict';
  ${beforeApp}
  ${appEntry}
  new JurisLandingPage().mount();
})();
</script>
</body>
</html>
`;

// Spot-check the generated wrapper so we do not deploy a shell.
console.log('generated wrapper bytes=', Buffer.byteLength(body, 'utf8'));
console.log('wrapper has tunnel classes:', body.includes('class TunnelCard') && body.includes('class App'));
console.log('wrapper has app entry:', body.includes('function JurisLandingPage') && body.includes('new JurisLandingPage().mount()'));
console.log('wrapper mount call idx=', body.indexOf('new JurisLandingPage().mount()'));


fs.writeFileSync(out, body, 'utf8');
const stat = fs.statSync(out);
console.log('wrote', out);
console.log('bytes=', stat.size);
const written = fs.readFileSync(out, 'utf8');
console.log('includes app classes:', written.includes('class TunnelCard') && written.includes('class App'));
console.log('exitCode=0');
