const fs = require('fs');
const path = require('path');

const out = path.resolve(process.cwd(), 'jurid-standalone.html');
const css = `html,body{margin:0;padding:0;height:100%;overflow:hidden}
body{background:#f6f2ea;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
input,button{font:inherit}
.tcard,.login-card,.bg{will-change:transform}
.hero,.login,.skip,.tcard{position:fixed}
.tcard{pointer-events:none}
.login{cursor:default}
.input,btn-primary{display:block;width:100%;box-sizing:border-box}
.input{-webkit-appearance:none;appearance:none}
`;

const html = `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Juris — Standalone Preview</title>
<style>${css}</style>
</head>
<body>
<noscript>
  <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;background:#f6f2ea;color:#16202f">
    Enable JavaScript to enter the Chambers.
  </div>
</noscript>
<div id="root"></div>
<script>/* standalone preview app injected below */</script>
</body>
</html>`;

fs.writeFileSync(out, html);
console.log('wrote', out, 'bytes=', Buffer.byteLength(html, 'utf8'));
console.log('exitCode=0');
