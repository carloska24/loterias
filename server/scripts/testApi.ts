import axios from 'axios';
const BASE_URL = 'https://loteriascaixa-api.herokuapp.com/api';

async function main() {
  const response = await axios.get(`${BASE_URL}/megasena/1`);
  console.log(response.data);
}
main();
