import fs from 'fs';

const data = JSON.parse(fs.readFileSync('public/data/factions.json', 'utf8'));
console.log('Cyborgs keys:', Object.keys(data.Cyborgs || {}));
console.log('Cyborgs factionRefits exists:', !!data.Cyborgs?.factionRefits);

if (data.Cyborgs?.factionRefits) {
  console.log('✅ Capital refits:', data.Cyborgs.factionRefits.capitalShipRefits?.map(r => r.name));
  console.log('✅ Squadron refits:', data.Cyborgs.factionRefits.squadronRefits?.map(r => r.name));
} else {
  console.log('❌ Still no factionRefits found');
}
