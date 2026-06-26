const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'locales');
['vi', 'en'].forEach(lang => {
  const file = path.join(srcDir, `${lang}.json`);
  if (!fs.existsSync(file)) return;
  
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const admin = data.admin || {};
  const dashboard = data.dashboard || {};
  delete data.admin;
  delete data.dashboard;
  const common = data; // what's left

  const langDir = path.join(srcDir, lang);
  if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });

  fs.writeFileSync(path.join(langDir, 'admin.json'), JSON.stringify(admin, null, 2));
  fs.writeFileSync(path.join(langDir, 'dashboard.json'), JSON.stringify(dashboard, null, 2));
  fs.writeFileSync(path.join(langDir, 'common.json'), JSON.stringify(common, null, 2));
  
  // delete the old file
  fs.unlinkSync(file);
});
console.log("i18n splitting done.");
