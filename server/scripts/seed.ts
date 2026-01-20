import { importHistoricalData } from '../src/services/loteriasApi';

async function main() {
  console.log('Iniciando seed...');

  try {
    await importHistoricalData('megasena', 'Mega-Sena', 60, 6);
    console.log('Mega-Sena finalizada.');
  } catch (e) {
    console.error('Erro Mega-Sena:', e);
  }

  try {
    await importHistoricalData('lotofacil', 'Lotofácil', 25, 15);
    console.log('Lotofácil finalizada.');
  } catch (e) {
    console.error('Erro Lotofácil:', e);
  }

  try {
    await importHistoricalData('lotomania', 'Lotomania', 100, 20);
    console.log('Lotomania finalizada.');
  } catch (e) {
    console.error('Erro Lotomania:', e);
  }

  try {
    await importHistoricalData('quina', 'Quina', 80, 5);
    console.log('Quina finalizada.');
  } catch (e) {
    console.error('Erro Quina:', e);
  }

  console.log('Seed completo.');
}

main();
