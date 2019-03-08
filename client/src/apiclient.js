import axios from 'axios';

export const ApiClient = axios.create({
  baseURL: 'http://'+process.env.REACT_APP_SERVER_IP,
  timeout: 1000,
  headers: {}
});