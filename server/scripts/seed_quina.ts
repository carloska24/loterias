import { importHistoricalData } from '../src/services/loteriasApi';

async function main() {
  console.log('Iniciando seed QUINA...');

  try {
    // Quina: 80 números total, 5 sorteados
    await importHistoricalData('quina', 'Quina', 80, 5);
    console.log('Quina finalizada.');
  } catch (e) {
    console.error('Erro Quina:', e);
  }

  console.log('Seed Quina completo.');
}

main();
