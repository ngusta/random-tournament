import React from 'react';
import {Route, BrowserRouter as Router} from 'react-router-dom';
import './index.css';
import App from './App';
import Presentation from './Presentation';
import Leaderboard from './Leaderboard';
import * as serviceWorker from './serviceWorker';
import { createRoot } from 'react-dom/client';

const routing = (
    <Router>
        <div>
            <Route exact path="/" component={App}/>
            <Route path="/presentation" component={Presentation}/>
            <Route path="/leaderboard" component={Leaderboard}/>
        </div>
    </Router>
);

const container = document.getElementById('root');
const root = createRoot(container);
root.render(routing);


// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

