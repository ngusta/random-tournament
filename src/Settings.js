import React from 'react';
import {Link} from 'react-router-dom';
import ls from 'local-storage'
import deleteIcon from './img/delete.png';
import GoogleSheets from './GoogleSheets';
import Timer from './Timer.js';
import Round from './Round.js';
import Stats from "./Stats";
import './Settings.css';
import {QRCodeCanvas} from 'qrcode.react';

class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedNoRoundMessage: ls.get("selectedNoRoundMessage") || "goodGameEn",
            customMessage: ls.get("customMessage") || "",
            showRoundName: ls.get("showRoundName") || false,
            showNowPlaying: ls.get("showNowPlaying") || false,
            editGender: false
        };
        if (!ls.get("selectedNoRoundMessage")) {
            ls.set("noRoundMessage", "Good game!");
        }
    }

    handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
        this.props.onSettingChange(e.target.name, value);
    };

    onEditGenderChange = (e) => {
        this.setState({editGender: e.target.checked});
    };

    addPlayer = (e) => {
        e.preventDefault();
        this.props.onSettingChange("noPlayers", this.props.players.length + 1);
    };

    removePlayer = (e) => {
        e.preventDefault();
        this.props.onSettingChange("noPlayers", this.props.players.length - 1);
    };

    addCourt = (e) => {
        e.preventDefault();
        this.props.onSettingChange("noCourts", this.props.noCourts + 1);
    };

    removeCourt = (e) => {
        e.preventDefault();
        this.props.onSettingChange("noCourts", this.props.noCourts - 1);
    };

    addTeamPerCourt = (e) => {
        e.preventDefault();
        this.props.onSettingChange("teamsPerCourt", this.props.teamsPerCourt + 1);
    };

    removeTeamPerCourt = (e) => {
        e.preventDefault();
        this.props.onSettingChange("teamsPerCourt", this.props.teamsPerCourt - 1);
    };

    addPlayerPerTeam = (e) => {
        e.preventDefault();
        this.props.onSettingChange("playersPerTeam", this.props.playersPerTeam + 1);
    };

    removePlayerPerTeam = (e) => {
        e.preventDefault();
        this.props.onSettingChange("playersPerTeam", this.props.playersPerTeam - 1);
    };

    addParadisePlayersPerCourt = (e) => {
        e.preventDefault();
        this.props.onSettingChange("paradisePlayersPerCourt", this.props.paradisePlayersPerCourt + 1);
    };

    removeParadisePlayersPerCourt = (e) => {
        e.preventDefault();
        this.props.onSettingChange("paradisePlayersPerCourt", this.props.paradisePlayersPerCourt - 1);
    };

    addParadisePlayersPerRound = (e) => {
        e.preventDefault();
        this.props.onSettingChange("paradisePlayersPerRound", this.props.paradisePlayersPerRound + 1);
    };

    removeParadisePlayersPerRound = (e) => {
        e.preventDefault();
        this.props.onSettingChange("paradisePlayersPerRound", this.props.paradisePlayersPerRound - 1);
    };

    addLeaderboardPlayer = (e) => {
        e.preventDefault();
        this.props.onSettingChange("noOnLeaderboard", this.props.noOnLeaderboard + 1);
    };

    removeLeaderboardPlayer = (e) => {
        e.preventDefault();
        this.props.onSettingChange("noOnLeaderboard", this.props.noOnLeaderboard - 1);
    };

    handleSubmit = (e) => {
        this.props.onSubmit();
        e.preventDefault();
    };

    onPlayerCheckbox = (e) => {
        if (this.state.editGender) {
            const importedPlayers = Object.assign({}, this.props.importedPlayers);
            const playerId = String(Number(e.target.name) + 1);
            const newGender = playerId in importedPlayers ? (Round.isMan(importedPlayers, playerId) ? "W" : "M") : "W";
            this.props.updateGender(playerId, newGender);
        } else {
            const playersCopy = [...this.props.players];
            playersCopy[e.target.name] = e.target.checked;
            this.props.onPlayersChange(playersCopy);
        }
    };

    onNoRoundMessageChange = (e) => {
        if (e.target.name === "customNoRoundMessage") {
            this.setState({customMessage: e.target.value});
            if (this.state.selectedNoRoundMessage === "custom") {
                ls.set("noRoundMessage", e.target.value);
                ls.set("updatePresentation", true);
            }
        } else {
            this.setState({selectedNoRoundMessage: e.target.name});
            let noRoundMessage = "";
            switch (e.target.name) {
                case "goodGameEn":
                    noRoundMessage = "Good game!";
                    break;
                case "goodGameSv":
                    noRoundMessage = "Bra spelat!";
                    break;
                case "custom":
                    noRoundMessage = this.state.customMessage;
                    break;
                case "noMessage":
                default:
                    noRoundMessage = "";

            }
            ls.set("noRoundMessage", noRoundMessage);
            ls.set("updatePresentation", true);
        }
    };

    onAutoPresentNewRoundChange = (e) => {
        this.props.onAutoPresentNewRoundChange(e.target.checked);
    };

    onShowRoundName = (e) => {
        this.setState({showRoundName: e.target.checked});
        ls.set("showRoundName", e.target.checked);
        ls.set("updatePresentation", true);
    };

    onShowNowPlaying = (e) => {
        this.setState({showNowPlaying: e.target.checked});
        ls.set("showNowPlaying", e.target.checked);
        ls.set("updatePresentation", true);
    };

    render() {
        const players = this.props.players.map((playing, index) =>
            <label key={index}
                   className={`player color${(index + 1) % 10} ${playing ? '' : 'checked'} digits${(index + 1).toString().length} ${(index) % 30 === 0 ? 'clearLeft' : ''} gender${Round.getGender(this.props.importedPlayers, index + 1)}`}>
                {index + 1}
                <input type="checkbox" name={index} checked={playing} onChange={this.onPlayerCheckbox}/>
            </label>
        );
        const numberOfActivePlayers = this.props.players.filter(playing => playing).length;
        const useCourtsOptions = [];
        for (let court = 1; court <= 60; court++) {
            useCourtsOptions.push(
                <label key={court} style={{marginRight: '10px'}}>
                    <input type="checkbox" name={court} checked={this.props.courtsToUse.indexOf(court) > -1}
                           onChange={this.props.onCourtsToUseChange}/>
                    {court}
                </label>
            );
        }

        const baseUrl = `${window.location.protocol}//${window.location.host}`;

        return (
            <div>
                <React.Fragment>
                    <form>
                        <div className="col">
                            <fieldset className="googleImport">
                                <legend>Import player data</legend>
                                <GoogleSheets setImportedPlayers={this.props.setImportedPlayers}
                                              updateImportedPlayers={this.props.updateImportedPlayers}
                                              showLoadingSpinner={this.props.showLoadingSpinner}
                                              importNextRound={this.props.importNextRound}/>
                            </fieldset>
                            <fieldset className="tournamentSettings">
                                <legend>Tournament settings</legend>
                                <label>
                                    <span>Paradise Mode</span>
                                    <input type="checkbox" name="paradiseMode" checked={this.props.paradiseMode}
                                           onChange={this.props.onParadiseModeChange}/>
                                </label>
                                <label>
                                    <span>Number of players</span>
                                    <input type="text" name="noPlayers"
                                           value={this.props.players.length === 0 ? "" : this.props.players.length}
                                           onChange={this.handleChange}/>
                                    <button onClick={e => this.removePlayer(e)}>-</button>
                                    <button onClick={e => this.addPlayer(e)}>+</button>
                                </label>
                                <label>
                                    <span>Number of courts</span>
                                    <input type="text" name="noCourts"
                                           value={this.props.noCourts === 0 ? "" : this.props.noCourts}
                                           onChange={this.handleChange}/>
                                    <button onClick={e => this.removeCourt(e)}>-</button>
                                    <button onClick={e => this.addCourt(e)}>+</button>
                                </label>
                                {!this.props.paradiseMode &&
                                    <label>
                                        <span>Number of teams per court</span>
                                        <input type="text" name="teamsPerCourt"
                                               value={this.props.teamsPerCourt === 0 ? "" : this.props.teamsPerCourt}
                                               onChange={this.handleChange}/>
                                        <button onClick={e => this.removeTeamPerCourt(e)}>-</button>
                                        <button onClick={e => this.addTeamPerCourt(e)}>+</button>
                                    </label>
                                }
                                <label>
                                    <span>Let all players play every round</span>
                                    <input type="checkbox" name="useAllPlayers" checked={this.props.useAllPlayers}
                                           onChange={this.handleChange}/>
                                </label>
                                {!this.props.useAllPlayers && !this.props.paradiseMode &&
                                    <label>
                                        <span>Number of players per team</span>
                                        <input type="text" name="playersPerTeam"
                                               value={this.props.playersPerTeam === 0 ? "" : this.props.playersPerTeam}
                                               onChange={this.handleChange}/>
                                        <button onClick={e => this.removePlayerPerTeam(e)}>-</button>
                                        <button onClick={e => this.addPlayerPerTeam(e)}>+</button>
                                    </label>
                                }

                                {!this.props.useAllPlayers && this.props.paradiseMode &&
                                    <>
                                        <label>
                                            <span>Max number of players per round</span>
                                            <input type="text" name="paradisePlayersPerRound"
                                                   value={this.props.paradisePlayersPerRound === 0 ? "" : this.props.paradisePlayersPerRound}
                                                   onChange={this.handleChange}/>
                                            <button onClick={e => this.removeParadisePlayersPerRound(e)}>-</button>
                                            <button onClick={e => this.addParadisePlayersPerRound(e)}>+</button>
                                        </label>
                                        <label>
                                            <span>Max number of players per court</span>
                                            <input type="text" name="paradisePlayersPerCourt"
                                                   value={this.props.paradisePlayersPerCourt === 0 ? "" : this.props.paradisePlayersPerCourt}
                                                   onChange={this.handleChange}/>
                                            <button onClick={e => this.removeParadisePlayersPerCourt(e)}>-</button>
                                            <button onClick={e => this.addParadisePlayersPerCourt(e)}>+</button>
                                        </label>
                                    </>
                                }
                                <div className="players">
                                    <span>Players ({numberOfActivePlayers} currently active)</span>
                                    <span>
										<label className="clearLeft">Edit gender
											<input type="checkbox" name="editGender" checked={this.state.editGender}
                                                   onChange={this.onEditGenderChange}/>
										</label>
                                    </span>
                                    {players}
                                </div>

                                <button className="createNewRound" onClick={this.handleSubmit}>Create new round</button>
                                <button className="createNewRound" onClick=
                                    {e => {
                                        e.preventDefault();
                                        ls.set("isLatestRoundStarted", true);
                                        ls.set("updatePresentation", true);
                                        this.props.onStartRound();
                                    }}>
                                    Start latest round
                                </button>
                                <button className="clearData" onClick=
                                    {e => {
                                        e.preventDefault();
                                        window.confirm("Are you sure you want to delete all data about the tournament?") &&
                                        this.props.onResetState()
                                    }}>
                                    <img alt="Clear data" src={deleteIcon}/>Clear data
                                </button>
                            </fieldset>
                        </div>
                        <div className="col">
                            <fieldset className="presentationSettings">
                                <legend>Presentation settings</legend>
                                <label>
                                    <span>Automatically present new round on creation</span>
                                    <input type="checkbox" checked={this.props.autoPesentNewRound}
                                           onChange={this.onAutoPresentNewRoundChange}/>
                                </label>
                                <label>
                                    <span>Show round name</span>
                                    <input type="checkbox" checked={this.state.showRoundName}
                                           onChange={this.onShowRoundName}/>
                                </label>
                                <label>
                                    <span>Show the "now playing" round</span>
                                    <input type="checkbox" checked={this.state.showNowPlaying}
                                           onChange={this.onShowNowPlaying}/>
                                </label>
                                <div className="noRoundMessageSetting">
                                    <span>Show message when no round is presented</span>
                                    <label>
                                        <input type="radio" name="goodGameEn"
                                               checked={this.state.selectedNoRoundMessage === "goodGameEn"}
                                               onChange={this.onNoRoundMessageChange}/>
                                        Good game!
                                    </label>
                                    <label>
                                        <input type="radio" name="goodGameSv"
                                               checked={this.state.selectedNoRoundMessage === "goodGameSv"}
                                               onChange={this.onNoRoundMessageChange}/>
                                        Bra spelat!
                                    </label>
                                    <label>
                                        <input type="radio" name="custom"
                                               checked={this.state.selectedNoRoundMessage === "custom"}
                                               onChange={this.onNoRoundMessageChange}/>
                                        <input type="text" name="customNoRoundMessage" value={this.state.customMessage}
                                               onChange={this.onNoRoundMessageChange}/>
                                    </label>
                                    <label>
                                        <input type="radio" name="noMessage"
                                               checked={this.state.selectedNoRoundMessage === "noMessage"}
                                               onChange={this.onNoRoundMessageChange}/>
                                        No message
                                    </label>
                                </div>
                                <div className="courtsToUse">
                                    {/*
                                    <label className="showTenCourts">
                                        <span>Show 10 courts</span>
                                        <input type="checkbox" name="showTenCourts"
                                               checked={this.props.showTenCourts} onChange={this.handleChange}/>
                                    </label>
                                    */}
                                    {/*this.props.showTenCourts &&*/
                                        <div className="courtsToUse">
                                            <label>Courts to use for the tournament</label>
                                            <br/>
                                            {this.props.courtsToUse.length < this.props.noCourts && 
                                            <p className="error-message">Error: Number of courts to use is less than the number of courts in the tournament. Select at least {this.props.noCourts} courts.</p>}
                                            {useCourtsOptions}
                                            <br/>
                                            {/*
                                            <label>
                                                <span>Hide unused courts</span>
                                                <input type="checkbox" name="hideUnusedCourts"
                                                       checked={this.props.hideUnusedCourts}
                                                       onChange={this.handleChange}/>
                                            </label>
                                            */}
                                        </div>
                                    }
                                </div>

                                <label>
                                    <span>Number of players on leaderboard</span>
                                    <input type="text" name="noOnLeaderboard"
                                           value={this.props.noOnLeaderboard}
                                           onChange={this.handleChange}/>
                                    <button onClick={e => this.removeLeaderboardPlayer(e)}>-</button>
                                    <button onClick={e => this.addLeaderboardPlayer(e)}>+</button>
                                </label>
                                <Link to="/presentation" target="_blank">Open Presentation</Link><br/>
                                <Link to="/leaderboard" target="_blank">Open Leaderboard (Local)</Link><br/>
                                <Link to={`/leaderboard/${this.props.tournamentId}`} target="_blank">Open Leaderboard (Public)</Link>
                            </fieldset>
                            <fieldset className="playerViewSettings">
                                <legend>Player View Settings</legend>
                                <label>
                                    <span>Enable Player View</span>
                                    <input
                                        type="checkbox"
                                        checked={this.props.playerViewEnabled}
                                        name="playerViewEnabled"
                                        onChange={this.handleChange}
                                    />

                                </label>
                                {this.props.playerViewEnabled &&
                                    <>
                                        <span>Tournament id: {this.props.tournamentId}</span><br/>
                                        <Link to={`/playerView/${this.props.tournamentId}`} target="_blank">Open
                                            PlayerView</Link> or scan this<br/>
                                        <QRCodeCanvas value={`${baseUrl}/playerView/${this.props.tournamentId}`}
                                                      size={100}/><br/>

                                        <Link to={`/playerViewPrint/${this.props.tournamentId}`} target="_blank">Printable
                                            Version</Link>
                                    </>
                                }
                            </fieldset>
                            <fieldset className="timeSettings">
                                <legend>Time</legend>
                                <Timer lastRoundCreationDate={this.props.lastRoundCreationDate}
                                       secondLastRoundCreationDate={this.props.secondLastRoundCreationDate}/>
                            </fieldset>
                        </div>

                        <Stats
                            players={this.props.players}
                            importedPlayers={this.props.importedPlayers}
                            playerStats={this.props.playerStats}
                        />
                    </form>
                </React.Fragment>
            </div>
        )
    }
}

export default Settings;
