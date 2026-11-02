import { useState } from 'react';
import AuthScreen from './components/AuthScreen.jsx';
import Dashboard from './components/Dashboard.jsx';
import { getActiveUser, setActiveUser } from './lib/storage.js';

export default function App() {
  const [user, setUser] = useState(getActiveUser);

  function signIn(account) {
    setActiveUser(account);
    setUser(account);
  }

  function signOut() {
    setActiveUser(null);
    setUser(null);
  }

  return user ? (
    <Dashboard key={user.email} user={user} onLogout={signOut} />
  ) : (
    <AuthScreen onSignIn={signIn} />
  );
}
