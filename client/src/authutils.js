import Cookies from 'js-cookie';

export const getAccessToken = () => {
  return Cookies.get('access_token');
};

export const isAuthenticated = () => {
  return getAccessToken() !== undefined;
};

export const getAuthenticatedUserID = () => {
  return Cookies.get('user_id');
};

export const getAuthenticatedUsername = () => {
  return Cookies.get('username');
};
