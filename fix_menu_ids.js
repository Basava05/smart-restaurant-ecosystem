const fs = require('fs');
const path = require('path');

const clientDataPath = path.join(__dirname, 'client', 'src', 'data', 'restaurantData.js');
const serverDataPath = path.join(__dirname, 'server', 'seedData.js');

let content = fs.readFileSync(clientDataPath, 'utf8');

// Replace all short IDs with 24-char hex strings
// Format is usually _id: 'mtr-1'
let counter = 1;
content = content.replace(/_id:\s*'([a-z0-9-]+)'/g, (match, p1) => {
  // If it's already a 24-char hex string, leave it (restaurants have these now)
  if (p1.length === 24 && /^[0-9a-f]{24}$/.test(p1)) {
    return match;
  }
  const newId = '00000000000000000000' + counter.toString(16).padStart(4, '0');
  counter++;
  return `_id: '${newId}'`;
});

// Write to both places
fs.writeFileSync(clientDataPath, content);
fs.writeFileSync(serverDataPath, content);

console.log('Fixed menu item IDs and synced seedData.js');
