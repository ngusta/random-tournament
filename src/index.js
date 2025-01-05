import React from 'react';
import {Route, Routes, BrowserRouter as Router} from 'react-router-dom';
import './index.css';
import App from './App';
import Presentation from './Presentation';
import Leaderboard from './Leaderboard';
import PlayerView from './PlayerView';
import * as serviceWorker from './serviceWorker';
import {createRoot} from 'react-dom/client';

const routing = (
    <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
    }}>
        <Routes>
            <Route exact path="/" element={<App/>}/>
            <Route path="/presentation" element={<Presentation/>}/>
            <Route path="/leaderboard" element={<Leaderboard/>}/>
            <Route path="/playerview/:tournamentId" element={<PlayerView/>}/>
        </Routes>
    </Router>
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(routing);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

