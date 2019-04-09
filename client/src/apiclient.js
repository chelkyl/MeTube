import axios from 'axios';
import { getAccessToken } from './authutils';

// export const ApiClient = axios.create({
//   baseURL: 'http://'+process.env.REACT_APP_SERVER_IP,
//   timeout: 10000,
//   headers: {}
// });

class Api {
  constructor(
      server_ip = process.env.REACT_APP_SERVER_IP,
      secure = false,
      timeout = process.env.REACT_APP_SERVER_TIMEOUT || 10000,
      headers = {}
    ) {
    let schema = secure ? 'https://' : 'http://';
    let baseURL = `${schema}${server_ip}`;
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout,
      headers
    });
  }

  makeRequester(type) {
    return (URN, data, config) => this.request(type, URN, data, config);
  }

  request(type, URN, data = {}, config = {}, useAuth = false) {
    if(useAuth) {
      let auth = {username: getAccessToken()};
      config['auth'] = auth;
    }
    switch(type) {
      case 'request':
      case 'getUri':
        return this.client[type](config);
      case 'get':
      case 'delete':
      case 'head':
      case 'options':
        return this.client[type](URN,{...config, params: data});
      case 'post':
      case 'put':
      case 'patch':
        return this.client[type](URN,data,config);
      default:
        return this.client.request({
          url: URN,
          method: type,
          params: data,
          data: data,
          ...config
        });
    }
    /*let source = axios.CancelToken.source();
    let token = source.token;
    let cancel = source.cancel;
    const reqCfg = {
      cancelToken: token,
      ...config
    };
    return {
      request: this.client[type](URN, {filters, data}, reqCfg),
      token,
      cancel
    };*/
  }

  async getData(route, query=null, filters=[], sorters=[], start=0, limit=10, useAuth = false) {
    let extras = `b=${start}&l=${limit}`;
    if(query !== null) extras += `&q=${query}`;
    return this.request('get',`/${route}?${extras}`, {filters, sorters}, {}, useAuth);
  }
}

export default (new Api());
