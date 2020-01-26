import React from 'react';
import {Link} from 'react-router-dom';
import ls from 'local-storage'
import deleteIcon from './img/delete.png';
import GoogleSheets from './GoogleSheets';
import Timer from './Timer.js';
import Round from './Round.js';

class Settings extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedNoRoundMessage: ls.get("selectedNoRoundMessage") || "goodGameEn",
            customMessage: ls.get("customMessage") || "",
            showRoundName: ls.get("showRoundName") || false,
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

    handleSubmit = (e) => {
        this.props.onSubmit();
        e.preventDefault();
    };

    onPlayerCheckbox = (e) => {
        if (this.state.editGender) {
            const importedPlayers = Object.assign({}, this.props.importedPlayers);
            const player = Number(e.target.name) + 1;
            if (player in importedPlayers) {
                if (Round.isMan(importedPlayers, player)) {
                    importedPlayers[player].gender = "W";
                } else {
                    importedPlayers[player].gender = "M";
                }
            } else {
                importedPlayers[player] = {name: "", gender: "W"};
            }
            this.props.setImportedPlayers(importedPlayers);
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

    render() {
        const players = this.props.players.map((playing, index) =>
            <label key={index}
                   className={`player color${(index + 1) % 10} ${playing ? '' : 'checked'} digits${(index + 1).toString().length} ${(index) % 30 === 0 ? 'clearLeft' : ''} gender${Round.getGender(this.props.importedPlayers, index + 1)}`}>
                {index + 1}
                <input type="checkbox" name={index} checked={playing} onChange={this.onPlayerCheckbox}/>
            </label>
        );
        const useCourtsOptions = [];
        for (let court = 1; court <= 8; court++) {
            useCourtsOptions.push(
                <label key={court}>
                    {court}
                    <input type="checkbox" name={court} checked={this.props.courtsToUse.indexOf(court) > -1}
                           onChange={this.props.onCourtsToUseChange}/>
                </label>
            );
        }
        return (
            <div>
                <React.Fragment>
                    <form>
                        <div className="col1">
                            <fieldset className="googleImport">
                                <legend>Import player data</legend>
                                <GoogleSheets setImportedPlayers={this.props.setImportedPlayers}/>
                            </fieldset>
                            <fieldset className="tournamentSettings">
                                <legend>Tournament settings</legend>
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
                                <label>
                                    <span>Number of teams per court</span>
                                    <input type="text" name="teamsPerCourt"
                                           value={this.props.teamsPerCourt === 0 ? "" : this.props.teamsPerCourt}
                                           onChange={this.handleChange}/>
                                    <button onClick={e => this.removeTeamPerCourt(e)}>-</button>
                                    <button onClick={e => this.addTeamPerCourt(e)}>+</button>
                                </label>

                                <label>
                                    <span>Let all players play every round</span>
                                    <input type="checkbox" name="useAllPlayers" checked={this.props.useAllPlayers}
                                           onChange={this.handleChange}/>
                                </label>
                                {!this.props.useAllPlayers &&
                                <label>
                                    <span>Number of players per team</span>
                                    <input type="text" name="playersPerTeam"
                                           value={this.props.playersPerTeam === 0 ? "" : this.props.playersPerTeam}
                                           onChange={this.handleChange}/>
                                    <button onClick={e => this.removePlayerPerTeam(e)}>-</button>
                                    <button onClick={e => this.addPlayerPerTeam(e)}>+</button>
                                </label>
                                }
                                <div className="players">
                                    <span>Players</span>
                                    <span>
										<label>Edit gender
											<input type="checkbox" name="editGender" checked={this.state.editGender}
                                                   onChange={this.onEditGenderChange}/>
										</label>
                                    </span>
                                    {players}
                                </div>

                                <button className="createNewRound" onClick={this.handleSubmit}>Create new round</button>
                                <button className="clearData" onClick=
                                    {e => {
                                        e.preventDefault();
                                        window.confirm("Are you sure you want to delete all data about the tournament?") &&
                                        this.props.onResetState()
                                    }
                                    }>
                                    <img alt="Clear data" src={deleteIcon}/>Clear data
                                </button>
                            </fieldset>
                        </div>
                        <div className="col2">
                            <fieldset>
                                <legend>Time</legend>
                                <Timer lastRoundCreationDate={this.props.lastRoundCreationDate}/>
                            </fieldset>
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
                                    <label className="showEigthCourts">
                                        <span>Show 8 courts</span>
                                        <input type="checkbox" name="showEigthCourts"
                                               checked={this.props.showEigthCourts} onChange={this.handleChange}/>
                                    </label>
                                    {this.props.showEigthCourts &&
                                    <div className="showEigthCourts">
                                        <label>Courts to use for the tournament</label>
                                        {useCourtsOptions}
                                        <label>
                                            <span>Hide unused courts</span>
                                            <input type="checkbox" name="hideUnusedCourts"
                                                   checked={this.props.hideUnusedCourts} onChange={this.handleChange}/>
                                        </label>
                                    </div>
                                    }
                                </div>
                                <Link to="/presentation" target="_blank">Open presentation</Link>
                            </fieldset>
                        </div>
                    </form>
                </React.Fragment>
            </div>
        )
    }
}

export default Settings;
