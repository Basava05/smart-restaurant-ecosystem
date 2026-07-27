const fs = require('fs');
const path = 'd:/Smart_Restaurant_Ecosystem/client/src/data/restaurantData.js';
let content = fs.readFileSync(path, 'utf8');

const weathers = ['Rainy', 'Sunny', 'Cloudy', 'Clear', 'Cool Evening'];
const kitchenStatuses = ['Normal', 'Busy', 'Preparing', 'Accepting Orders'];

let index = 0;
content = content.replace(/description: (.*?),/g, (match, p1) => {
  // Use index to make them pseudo-random but stable
  const aiScore = 85 + (index % 12);
  const weather = weathers[index % weathers.length];
  const distance = ((index % 5) + 1.2).toFixed(1);
  const kitchen = kitchenStatuses[index % kitchenStatuses.length];
  const isReservation = (index % 2) === 0;
  index++;
  
  return `${match}
    aiMatchScore: ${aiScore},
    weatherPick: '${weather}',
    distance: ${distance},
    liveKitchenStatus: '${kitchen}',
    paymentSupported: true,
    reservationAvailable: ${isReservation},`;
});

fs.writeFileSync(path, content);
console.log('Updated restaurantData.js with mock AI values');
