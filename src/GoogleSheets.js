import React, {Component} from 'react';
import {gapi, loadAuth2} from 'gapi-script'
import ls from 'local-storage'

class GoogleSheets extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loggedIn: false,
            gapiReady: false,
            sheetId: ls.get("sheetId") || "1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I",
            sheetRange: ls.get("sheetRange") || "'test'!A2:G",
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
                        if ((player.length === 4 || player.length === 7) && player[1].length > 0) {
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
                        if (player.length === 4) {
                            importedPlayers[player[0]] = {name: player[1] + " " + player[2], gender: gender,
                                wins: 0, losses: 0, draws: 0};
                        } else {
                            importedPlayers[player[0]] = {name: player[1] + " " + player[2], gender: gender,
                                wins: Number(player[4]), losses: Number(player[5]), draws: Number(player[6])};
                        }
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
        return (
            <div>
                {!this.state.loggedIn && <button id="loginButton" onClick={e => e.preventDefault()}>Log in</button>}
                {this.state.loggedIn && <button onClick={this.signOut}>Log out</button>}<br/>
                <label>
                    <span>Google sheet id:</span>
                    <input type="text" value={this.state.sheetId} onChange={this.setSheetId}/>
                    <span className="labelDetails">https://docs.google.com/spreadsheets/d/<span
                        className="highlight">1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I</span>/edit#gid=0</span>
                </label>
                <label>
                    <span>Player range:</span>
                    <input type="text" value={this.state.sheetRange} onChange={this.setSheetRange}/>
                    <span className="labelDetails">Sheet with seven columns in this order: Player number, First name, Last name, Gender, Wins, Losses, Draws</span>
                </label>
                {this.state.gapiReady && <button onClick={this.importData}>Import data</button>}
            </div>
        );
    }
}

export default GoogleSheets;