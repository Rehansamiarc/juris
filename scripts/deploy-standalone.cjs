const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const htmlPath = path.resolve(process.cwd(), 'jurid-standalone.html');
const scriptPath = path.resolve(process.cwd(), 'scripts', 'write-standalone.cjs');

try {
  const existed = fs.existsSync(htmlPath);
  execSync('node ' + JSON.stringify(scriptPath), { stdio: 'inherit' });
  if (!fs.existsSync(htmlPath)) {
    console.error('script ran but html file did not appear at', htmlPath);
    process.exit(2);
  }
  const roundTrip = fs.readFileSync(htmlPath);
  if (roundTrip.length < 1000) {
    console.error('generated html too small:', htmlPath, 'bytes=', roundTrip.length);
    process.exit(3);
  }
  if (!existed && fs.existsSync(htmlPath)) {
    console.log('first deployment: created', htmlPath);
  } else {
    console.log('updated', htmlPath);
  }
  const stat = fs.statSync(htmlPath);
  console.log('size bytes=', stat.size);
  console.log('first 160 chars=', JSON.stringify(fs.readFileSync(htmlPath, 'utf8').slice(0, 160)));
} catch (err) {
  console.error('deployment failed:', err && err.message ? err.message : err);
  process.exit(err && err.status ? err.status : 1);
}
