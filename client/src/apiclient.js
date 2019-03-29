import axios from 'axios';

// export const ApiClient = axios.create({
//   baseURL: 'http://'+process.env.REACT_APP_SERVER_IP,
//   timeout: 10000,
//   headers: {}
// });

class Api {
  constructor(
      server_ip = process.env.REACT_APP_SERVER_IP,
      secure = false,
      timeout = process.env.REACT_APP_SERVER_TIMEOUT || 10000
    ) {
    let schema = secure ? 'https://' : 'http://';
    this.client = axios.create({
      baseURL: `${schema}${server_ip}`,
      timeout: timeout,
      headers: {}
    });
  }

  makeRequester(type) {
    return (URN, data, config) => this.request(type, URN, data, config);
  }

  request(type, URN, data, config) {
    switch(type) {
      case 'request':
      case 'getUri':
        return this.client[type](config);
      case 'get':
      case 'delete':
      case 'head':
      case 'options':
        return this.client[type](URN,{...config, data: data});
      case 'post':
      case 'put':
      case 'patch':
        return this.client[type](URN,data,config);
      default:
        return this.client[type](URN,data,config);
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

  async getData(route, query, filters, sorters, start=0, limit=10) {
    return this.request('get',`/${route}?q=${query}&b=${start}&l=${limit}`, {filters, sorters});
  }
}

export default (new Api());
