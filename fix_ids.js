const fs = require('fs');
let c = fs.readFileSync('client/src/data/restaurantData.js', 'utf8');
let n = 1;
c = c.replace(/_id: 'blr-[^']+'/g, () => {
    const id = n.toString(16).padStart(24, '0');
    n++;
    return `_id: '${id}'`;
});
fs.writeFileSync('client/src/data/restaurantData.js', c);
console.log('Fixed IDs');
