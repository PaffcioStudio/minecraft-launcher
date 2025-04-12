import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Accounts from './components/Accounts';
import Settings from './components/Settings';
import Instances from './components/Instances';
import Versions from './components/Versions';
import './index.css';

const App = () => {
    return (
        <Router>
            <div className="app">
                <nav>
                    <ul>
                        <li><a href="/">Instancje</a></li>
                        <li><a href="/accounts">Konta</a></li>
                        <li><a href="/versions">Wersje</a></li>
                        <li><a href="/settings">Ustawienia</a></li>
                    </ul>
                </nav>
                <Switch>
                    <Route exact path="/" component={Instances} />
                    <Route path="/accounts" component={Accounts} />
                    <Route path="/versions" component={Versions} />
                    <Route path="/settings" component={Settings} />
                </Switch>
            </div>
        </Router>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));