import React from 'react';
import Layout from './pages/layout';
import Theming from './theming';
import Authenticator from './authentication';

export default function App() {
  return (
    <Theming initialTheme={'dark'}>
      <Authenticator>
        <Layout/>
      </Authenticator>
    </Theming>
  );
}
