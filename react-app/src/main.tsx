import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient }    from './apollo';
import { AuthProvider }    from './AuthContext';
import { ProfileProvider } from './ProfileContext';
import App        from './App';
import Home       from './pages/Home';
import Phases     from './pages/Phases';
import MatchList  from './pages/MatchList';
import MatchDetail from './pages/MatchDetail';
import Bets       from './pages/Bets';
import Favorites  from './pages/Favorites';
import Teams      from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Profile    from './pages/Profile';
import './styles.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Élément #root introuvable dans le DOM');

createRoot(rootEl).render(
  <StrictMode>
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ProfileProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<App />}>
                <Route index                    element={<Home />} />
                <Route path="phases"            element={<Phases />} />
                <Route path="matches/:phase"    element={<MatchList />} />
                <Route path="match/:id"         element={<MatchDetail />} />
                <Route path="paris"             element={<Bets />} />
                <Route path="favoris"           element={<Favorites />} />
                <Route path="equipes"           element={<Teams />} />
                <Route path="equipe/:name"      element={<TeamDetail />} />
                <Route path="profil"            element={<Profile />} />
              </Route>
            </Routes>
          </HashRouter>
        </ProfileProvider>
      </AuthProvider>
    </ApolloProvider>
  </StrictMode>
);
