import { importHistoricalData } from '../src/services/loteriasApi.js';

async function main() {
  console.log('Testing import (Lotofacil, Quina, Lotomania)...');
  try {
    await Promise.all([
      importHistoricalData('lotofacil', 'Lotofácil', 25, 15),
      importHistoricalData('lotomania', 'Lotomania', 100, 20),
      importHistoricalData('quina', 'Quina', 80, 5),
    ]);
    console.log('Todas as loterias foram importadas com sucesso.');
  } catch (e) {
    console.error('Error:', e);
  }
}

main().then(() => process.exit(0));
