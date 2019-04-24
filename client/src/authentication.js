import React, { createContext, useContext, useReducer, useState, useEffect } from 'react';
import Api from './apiclient';
import Cookies from 'js-cookie';
import {
  isAuthenticated
} from './authutils';

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export const authenticate = async (creds) => {
  try {
    const response = await Api.request('post','/login',creds);
    const res = response.data;
    const tokens = res.response;
    const expires_in = tokens.expires_in_secs * 1000 - ONE_HOUR_IN_MS;
    const expiration = new Date(new Date().getTime() + expires_in);

    Cookies.set('access_token', tokens.token, {expires: expiration});
    Cookies.set('user_id', res.response.user_id, {expires: expiration});
    Cookies.set('username', res.response.username, {expires: expiration});
    return res;
  }
  catch(err) {
    throw err;
  }
};

export const register = async (creds) => {
  try {
    const response = await Api.request('post','/users',creds);
    const res = response.data;
    const tokens = res.response;
    const expires_in = tokens.expires_in_secs * 1000 - ONE_HOUR_IN_MS;
    const expiration = new Date(new Date().getTime() + expires_in);

    Cookies.set('access_token', tokens.token, {expires: expiration});
    Cookies.set('user_id', res.response.user_id, {expires: expiration});
    Cookies.set('username', res.response.username, {expires: expiration});
    return res;
  }
  catch(err) {
    throw err;
  }
};

export const unauthenticate = () => {
  Cookies.remove('access_token');
};

const initialRegState = {
  loading: false,
  success: false
};
const regStateReducer = (state, action) => {
  switch(action) {
    case 'submit':
      return {
        loading: true,
        success: false
      }
    case 'success':
      return {
        loading: false,
        success: true
      }
    case 'error':
    case 'initial':
      return initialRegState;
    default:
      return state;
  }
};
const initialAuthState = {
  loading: false,
  success: false
};
const authStateReducer = (state, action) => {
  switch (action) {
    case 'loading':
      return {
        loading: true,
        success: false
      };
    case 'success':
      return {
        loading: false,
        success: true
      };
    case 'error':
    case 'initial':
      return initialAuthState;
    default:
      return state;
  }
};
const initialAuthAction = {
  action: null,
  credentials: null
};
const authActionReducer = (state, action) => {
  switch (action.type) {
    case 'register':
    case 'login':
      return {
        action: action.type,
        credentials: action.credentials
      };
    case 'logout':
      return {
        action: action.type
      };
    default:
      return state;
  }
};

export const AuthCtx = createContext(null);

export const useAuthCtx = () => useContext(AuthCtx);

export default function Authenticator({children}) {
  const [regState, regStateDispatch] = useReducer(regStateReducer,initialRegState);
  const [authState, authStateDispatch] = useReducer(authStateReducer,initialAuthState);
  const [authAction, authActionDispatch] = useReducer(authActionReducer,initialAuthAction);
  const [isLoggedIn, setIsLoggedIn] = useState(isAuthenticated());
  const [errorState, setErrorState] = useState({});

  let doAction = async () => {
    let response;
    switch(authAction.action) {
      case 'register':
        regStateDispatch('loading');
        try {
          response = await register(authAction.credentials);
          if(response.error) {
            regStateDispatch('error');
            setErrorState({message:response.error});
          }
          else {
            regStateDispatch('success');
            setErrorState({});
            setIsLoggedIn(true);
          }
        }
        catch(err) {
          let msg = '';
          // got response from server
          if(err.response) {
            const { status } = err.response;
            if (status === 400) {
              let {error} = err.response.data;
              if(error['not unique']) {
                error['not unique'].forEach((tag) => {
                  err[tag+'Error'] = true;
                  err[tag+'ErrorMsg'] = 'Must be unique';
                });
              }
              else msg = err.error;
            }
            else if (status >= 500 && status < 600) {
              msg = `Server error ${status}, please contact the admins`;
            }
            else {
              msg = `Sorry, unknown error ${status}`;
            }
          }
          // request sent but no response
          else if(err.request) {
            msg = err.message;
          }
          // catch all
          else {
            msg = 'Sorry, unknown error';
          }
          console.log('auth',err);
          regStateDispatch('error');
          setErrorState({...err,message:msg});
        }
        break;
      case 'login':
        authStateDispatch('loading');
        try {
          response = await authenticate(authAction.credentials);
          if(response.error) {
            authStateDispatch('error');
            setErrorState({message:response.error});
          }
          else {
            authStateDispatch('success');
            setErrorState({});
            setIsLoggedIn(true);
          }
        }
        catch(err) {
          let msg = '';
          // got response from server
          if(err.response) {
            const { status } = err.response;
            if(status === 401) {
              msg = 'Invalid login';
            }
            else if (status >= 500 && status < 600) {
              msg = `Server error ${status}, please contact the admins`;
            }
            else {
              msg = `Sorry, unknown error ${status}`;
            }
          }
          // request sent but no response
          else if(err.request) {
            msg = err.message;
          }
          // catch all
          else {
            msg = 'Sorry, unknown error';
          }
          console.log('auth',err);
          authStateDispatch('error');
          setErrorState({...err,message:msg});
        }
        break;
      case 'logout':
        console.log('auth logging out');
        unauthenticate();
        authStateDispatch('initial');
        regStateDispatch('initial');
        setIsLoggedIn(false);
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    doAction();
  }, [authAction]);

  return (
    <AuthCtx.Provider value={[isLoggedIn, authActionDispatch, errorState, authState, regState]}>
      {children}
    </AuthCtx.Provider>
  )
}
