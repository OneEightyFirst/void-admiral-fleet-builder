import fs from 'fs';

try {
  const data = JSON.parse(fs.readFileSync('test-cyborgs-only.json', 'utf8'));
  console.log('✅ Cyborgs-only JSON parsing successful');
  console.log('Cyborgs keys:', Object.keys(data.Cyborgs || {}));
  console.log('Has factionRefits:', !!data.Cyborgs?.factionRefits);
  if (data.Cyborgs?.factionRefits) {
    console.log('Capital refits:', data.Cyborgs.factionRefits.capitalShipRefits?.length);
    console.log('Squadron refits:', data.Cyborgs.factionRefits.squadronRefits?.length);
  }
} catch(e) {
  console.error('❌ Error:', e.message);
  console.log('Error at line:', e.lineNumber || 'unknown');
}
