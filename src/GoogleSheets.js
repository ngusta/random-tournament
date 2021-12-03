import React, {Component} from 'react';
import {gapi, loadAuth2} from 'gapi-script'
import ls from 'local-storage'

class GoogleSheets extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedIn: false,
            gapiReady: false,
            sheetId: ls.get("sheetId") || "1e4C8ArBqc5_hhWdpio-v9lWMpjdWn1mrpz0d_HS4LDg",
            sheetRange: ls.get("sheetRange") || "'Lista turnering med kille / tjej'!A2:D",
            playerData: []
        }
    }

    async componentDidMount() {
        let auth2 = await loadAuth2(gapi, '299101852059-l3umlu4h53eu1olrmtiivh440uj3g4as.apps.googleusercontent.com', 'https://www.googleapis.com/auth/spreadsheets.readonly');
        if (auth2.isSignedIn.get()) {
            gapi.load('client', () => {
                gapi.client.load('sheets', 'v4', () => {
                    this.setState({gapiReady: true});
                });
            });
            this.setState({loggedIn: true});
        } else {
            this.attachSignin(document.getElementById('loginButton'), auth2);
        }
    }

    async componentDidUpdate() {
        if (!this.state.loggedIn) {
            let auth2 = await loadAuth2(gapi, '299101852059-l3umlu4h53eu1olrmtiivh440uj3g4as.apps.googleusercontent.com', '');
            this.attachSignin(document.getElementById('loginButton'), auth2);
        }
        if (this.state.loggedIn && !this.state.gapiReady) {
            gapi.load('client', () => {
                gapi.client.load('sheets', 'v4', () => {
                    this.setState({gapiReady: true});
                });
            });
        }
    }

    attachSignin(element, auth2) {
        auth2.attachClickHandler(element, {},
            () => {
                this.setState({loggedIn: true});
            }, (error) => {
                console.log(JSON.stringify(error))
            });
    }

    signOut = (e) => {
        e.preventDefault();
        let auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(() => {
            this.setState({loggedIn: false, gapiReady: false});
            console.log('User signed out.');
        });
    };

    importData = (e) => {
        e.preventDefault();
        if (this.state.gapiReady) {
            gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: this.state.sheetId,
                range: this.state.sheetRange,
            }).then((response) => {
                var range = response.result;
                if (range.values.length > 0) {
                    const playerData = [];
                    range.values.forEach((player) => {
                        console.log(player);
                        if (player.length === 4 && player[1].length > 0) {
                            playerData.push(player);
                        }
                    });
                    this.setState({playerData: playerData});
                    const importedPlayers = {};
                    playerData.forEach(player => {
                        let gender;
                        switch (player[3]) {
                            case "Tjej":
                                gender = "W";
                                break;
                            default:
                                gender = "M";
                        }

                        importedPlayers[player[0]] = {name: player[1] + " " + player[2], gender: gender};
                    });
                    this.props.setImportedPlayers(importedPlayers);
                } else {
                    console.log('No data found.');
                }
            }, function (response) {
                console.log('Error: ' + response.result.error.message);
            });
        }
    };

    setSheetId = (e) => {
        this.setState({sheetId: e.target.value});
        ls.set("sheetId", e.target.value);
    };

    setSheetRange = (e) => {
        this.setState({sheetRange: e.target.value});
        ls.set("sheetRange", e.target.value);
    };

    render() {
        const players = [];
        this.state.playerData.forEach((player) => {
            players.push(
                <tr key={player[0]}>
                    <td>{player[0]}</td>
                    <td>{player[1] + " " + player[2]}</td>
                    <td>{player[3]}</td>
                </tr>);
        });
        return (
            <div>
                {!this.state.loggedIn && <button id="loginButton" onClick={e => e.preventDefault()}>Log in</button>}
                {this.state.loggedIn && <button onClick={this.signOut}>Log out</button>}<br/>
                <label>
                    <span>Google sheet id:</span>
                    <input type="text" value={this.state.sheetId} onChange={this.setSheetId}/>
                    <span className="labelDetails">https://docs.google.com/spreadsheets/d/<span
                        className="highlight">1e4C8ArBqc5_hhWdpio-v9lWMpjdWn1mrpz0d_HS4LDg</span>/edit#gid=1073790956</span>
                </label>
                <label>
                    <span>Player range:</span>
                    <input type="text" value={this.state.sheetRange} onChange={this.setSheetRange}/>
                    <span className="labelDetails">Sheet with four columns in this order: Player number, First name, Last name, Gender</span>
                </label>
                {this.state.gapiReady && <button onClick={this.importData}>Import data</button>}
                {
                    false && players.length > 0 &&
                    <table>
                        <thead>
                        <tr>
                            <th>Number</th>
                            <th>Name</th>
                            <th>Gender</th>
                        </tr>
                        </thead>
                        <tbody>
                        {players}
                        </tbody>
                    </table>
                }
            </div>

        );
    }
}

export default GoogleSheets;