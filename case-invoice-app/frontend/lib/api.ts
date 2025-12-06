import axios from 'axios';

// Configura o Axios para bater sempre no seu Backend NestJS
export const api = axios.create({
  baseURL: 'http://localhost:3000',
});