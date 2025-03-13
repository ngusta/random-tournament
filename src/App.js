import React from 'react';
import './App.css';
import Settings from './Settings';
import Round from './Round';
import ls from 'local-storage';
import loadingSpinner from './img/loading-spinner.svg';
import {deleteTournament, saveTournament, getPlayers, getPlayer, savePlayer, savePlayers} from './api.js';

class App extends React.Component {
    constructor(props) {
        super(props);

        if (ls.get("tournamentId") === null) {
            const uniqueId = (Date.now().toString(36).substring(2) + Math.random().toString(36).substring(2, 2)).toUpperCase();
            ls.set("tournamentId", uniqueId);
        }

        this.state = {
            noCourts: ls.get("noCourts") || 10,
            teamsPerCourt: ls.get("teamsPerCourt") || 2,
            playersPerTeam: ls.get("playersPerTeam") || 2,
            availablePlayers: ls.get("availablePlayers") || new Array(16).fill(true),
            useAllPlayers: ls.get("useAllPlayers") === null ? false : ls.get("useAllPlayers"),
            errors: ls.get("errors") || [],
            rounds: ls.get("rounds") || [],
            presentationRoundIndex: ls.get("presentationRoundIndex") || -1,
            autoPresentNewRound: ls.get("autoPresentNewRound") || true,
            showTenCourts: ls.get("showTenCourts") || false,
            hideUnusedCourts: ls.get("hideUnusedCourts") || false,
            courtsToUse: ls.get("courtsToUse") || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            importedPlayers: ls.get("importedPlayers") || [],
            lastRoundCreationDate: ls.get("lastRoundCreationDate") || null,
            secondLastRoundCreationDate: ls.get("secondLastRoundCreationDate") || null,
            showLoadingSpinner: false,
            showExampleRound: ls.get("showExampleRound") === null ? true : ls.get("showExampleRound"),
            paradiseMode: ls.get("paradiseMode") === null ? false : ls.get("paradiseMode"),
            paradisePlayersPerCourt: ls.get("paradisePlayersPerCourt") === null ? 5 : ls.get("paradisePlayersPerCourt"),
            playerStats: ls.get("playerStats") === null ? null : ls.get("playerStats"),
            playerViewEnabled: ls.get("playerViewEnabled") === null ? false : ls.get("playerViewEnabled"),
            updateStatsIntervalId: ls.get("playerViewEnabled") ? setInterval(this.updatePlayerStats, 5000) : null
        };
        setTimeout(() => {
            clearInterval(this.state.updateStatsIntervalId);
            console.log("Player stats updating stopped, reload to continue.");
        }, 5 * 60 * 60 * 1000);
        ls.set("updatePresentation", true);
    }

    onSettingChange = (name, value) => {
        if (name === "noPlayers") {
            if (value > 500) {
                throw new Error("Cannot handle more than 500 players. Was " + value);
            }
            const commonNoPlayers = Math.min(Number(value), this.state.availablePlayers.length);
            let newAvailablePlayers = this.state.availablePlayers.slice(0, commonNoPlayers);
            if (value > this.state.availablePlayers.length) {
                const newElements = new Array(value - this.state.availablePlayers.length).fill(true);
                newAvailablePlayers = [...newAvailablePlayers, ...newElements];
            }
            this.setState({availablePlayers: newAvailablePlayers});
            ls.set("availablePlayers", newAvailablePlayers);
        } else {
            this.setState({[name]: value});
            ls.set(name, value);
        }
        switch (name) {
            case "playerViewEnabled":
                if (ls.get("playerViewEnabled")) {
                    this.saveTournamentInCloud();
                    this.savePlayerDataToCloud(this.state.importedPlayers);
                    const intervalId = setInterval(this.updatePlayerStats, 5000);
                    this.setState({updateStatsIntervalId: intervalId});
                    setTimeout(() => {
                        clearInterval(intervalId);
                        console.log("Player stats updating stopped, reload to resume.");
                    }, 5 * 60 * 60 * 1000);
                } else {
                    clearInterval(this.state.updateStatsIntervalId);
                }
                break;
            case "showTenCourts":
            case "hideUnusedCourts":
                ls.set("courtsToUse", this.state.courtsToUse);
                ls.set("updatePresentation", true);
                break;
            default:
        }
    };

    onPlayersChange = (newAvailablePlayers) => {
        this.setState({availablePlayers: newAvailablePlayers});
        ls.set("availablePlayers", newAvailablePlayers);
    };

    onCourtsToUseChange = (e) => {
        const courtsToUseCopy = [...this.state.courtsToUse];
        const courtName = Number(e.target.name);
        if (e.target.checked && courtsToUseCopy.indexOf(e.target.name) === -1) {
            courtsToUseCopy.push(courtName);
        } else if (!e.target.checked && courtsToUseCopy.indexOf(courtName) > -1) {
            courtsToUseCopy.splice(courtsToUseCopy.indexOf(courtName), 1);
        }
        courtsToUseCopy.sort((a, b) => a - b);
        this.setState({courtsToUse: courtsToUseCopy});
        ls.set("courtsToUse", courtsToUseCopy);
        ls.set("updatePresentation", true);
    };

    onDeleteRound = (roundIndex) => {
        const roundsCopy = [...this.state.rounds];
        const lastPlayerInRounds = ls.get("lastPlayerInRounds") ? ls.get("lastPlayerInRounds") : [];
        roundsCopy.splice(roundIndex, 1);
        lastPlayerInRounds.splice(roundIndex, 1);
        let pressIndex = this.state.presentationRoundIndex;
        if (pressIndex >= roundsCopy.length) {
            pressIndex = pressIndex >= 0 ? pressIndex - 1 : -1;
        }
        this.setState({rounds: roundsCopy, presentationRoundIndex: pressIndex});
        ls.set("lastPlayerInRounds", lastPlayerInRounds);
        ls.set("updatePresentation", true);
        ls.set("rounds", roundsCopy);
        ls.set("presentationRoundIndex", pressIndex);

        ls.set("playerStats", {});
        roundsCopy.forEach(round => Round.updatePlayerStats(round));
        this.saveTournamentInCloud();
    };

    onShowOnPresentation = (roundIndex) => {
        if (this.state.presentationRoundIndex === roundIndex) {
            roundIndex = -1;
        }
        this.setState({presentationRoundIndex: roundIndex});
        ls.set("presentationRoundIndex", roundIndex);
        this.saveTournamentInCloud();
    };

    onResetState = () => {
        const tournamentId = ls.get("tournamentId");
        ls.clear();
        deleteTournament(tournamentId)
            .then((response) => {
                window.location.reload()
            });
    };

    onAutoPresentNewRoundChange = (value) => {
        this.setState({autoPresentNewRound: value});
    };

    onShowExampleRoundChange = (e) => {
        this.setState({showExampleRound: e.target.checked});
        ls.set("showExampleRound", e.target.checked)
    };

    onStartRound = () => {
        const created = Date.now();
        this.setState({secondLastRoundCreationDate: this.state.lastRoundCreationDate});
        ls.set("secondLastRoundCreationDate", this.state.lastRoundCreationDate);
        this.setState({lastRoundCreationDate: created});
        ls.set("lastRoundCreationDate", created);
        this.saveTournamentInCloud();
    }

    onParadiseModeChange = (e) => {
        this.setState({paradiseMode: e.target.checked});
        ls.set("paradiseMode", e.target.checked);
    };

    showLoadingSpinner = (show) => {
        this.setState({showLoadingSpinner: show});
    }

    draw = async () => {
        this.setState({errors: [], showLoadingSpinner: true});

        setTimeout(async () => {
            try {
                ls.set("errors", []);

                const round = await this.createRound();
                if (round) {
                    const newRounds = [...this.state.rounds, round];
                    let pressIndex = this.state.presentationRoundIndex;

                    if (this.state.autoPresentNewRound) {
                        pressIndex = newRounds.length - 1;
                    }

                    this.setState({
                        rounds: newRounds,
                        presentationRoundIndex: pressIndex
                    });

                    ls.set("rounds", newRounds);
                    ls.set("presentationRoundIndex", pressIndex);
                    ls.set("isLatestRoundStarted", false);

                    await this.saveTournamentInCloud();
                }
            } catch (error) {
                console.error("Error creating round:", error);
                this.setState({errors: [error.message]});
            } finally {
                this.setState({showLoadingSpinner: false});
            }
        }, 100);
    };

    async createRound() {
        return Round.createRound(
            this.getAllAvailablePlayers(),
            this.state.noCourts,
            this.state.teamsPerCourt,
            this.state.playersPerTeam,
            this.state.useAllPlayers,
            this.logError,
            false,
            this.state.rounds,
            this.state.importedPlayers,
            this.state.paradiseMode,
            this.state.paradisePlayersPerCourt
        );
    }

    createDryRound() {
        return Round.createRound(
            this.getAllAvailablePlayers(),
            this.state.noCourts,
            this.state.teamsPerCourt,
            this.state.playersPerTeam,
            this.state.useAllPlayers,
            (error) => {
            },
            true,
            this.state.rounds,
            this.state.importedPlayers,
            this.state.paradiseMode,
            this.state.paradisePlayersPerCourt
        );
    }

    getAllAvailablePlayers() {
        let allAvailablePlayers = [];
        this.state.availablePlayers.forEach((checked, index) => {
            if (checked) {
                allAvailablePlayers.push(index + 1);
            }
        });
        return allAvailablePlayers;
    }

    logError = (message) => {
        const newErrors = [...this.state.errors, message];
        this.setState({errors: newErrors});
        ls.set("errors", newErrors);
    };

    saveTournamentInCloud = () => {
        if (ls.get("playerViewEnabled")) {
            let data = {};
            data.rounds = ls.get("rounds");
            data.presentationRoundIndex = ls.get("presentationRoundIndex");
            data.isLatestRoundStarted = ls.get("isLatestRoundStarted");
            data.showTenCourts = ls.get("showTenCourts");
            data.courtsToUse = ls.get("courtsToUse");
            data.paradiseMode = ls.get("paradiseMode");
            data.paradisePlayersPerCourt = ls.get("paradisePlayersPerCourt");
            saveTournament(ls.get("tournamentId"), data);
        }
    };

    setImportedPlayers = (importedPlayers) => {
        this.setState({importedPlayers: importedPlayers});
        ls.set("importedPlayers", importedPlayers);
        const playerStats = ls.get("playerStats") || [];
        const newAvailablePlayers  = this.state.availablePlayers;
        Object.keys(importedPlayers).forEach(player => {
            if (!playerStats[player]) {
                playerStats[player] = App.emptyPlayerStats(player);
            }
            playerStats[player].name = importedPlayers[player].name;
            playerStats[player].wins = importedPlayers[player].wins;
            playerStats[player].losses = importedPlayers[player].losses;
            newAvailablePlayers[player] = importedPlayers[player].active;
        });
        this.setState({availablePlayers: newAvailablePlayers});
        if (this.state.playerViewEnabled) {
            this.savePlayerDataToCloud(importedPlayers, playerStats);
        }
        ls.set("playerStats", playerStats);
        ls.set("updatePresentation", true);
    };

    savePlayerDataToCloud(importedPlayers) {
        const playerWithNames = Object.values(importedPlayers).map(player => ({
            playerId: player.id,
            name: player.name
        }));
        savePlayers(ls.get("tournamentId"), playerWithNames);
    }

    updatePlayerStats = async () => {
        if (this.state.showLoadingSpinner) {
            //Skip updating while round creation ongoing
            return;
        }
        let playerStats = ls.get("playerStats");
        if (playerStats) {
            const cloudPlayerRounds = await getPlayers(ls.get("tournamentId"));

            if (cloudPlayerRounds) {
                cloudPlayerRounds.forEach(cloudPlayer => {
                    if (!playerStats[cloudPlayer.playerId]) {
                        playerStats[cloudPlayer.playerId] = App.emptyPlayerStats(cloudPlayer.playerId);
                    }
                    const statsPlayer = playerStats[cloudPlayer.playerId];
                    statsPlayer.wins = 0;
                    statsPlayer.losses = 0;
                    statsPlayer.results = {};

                    Object.keys(cloudPlayer).forEach(round => {
                        switch (cloudPlayer[round].result) { //This ignores playerId, tournamentId
                            case "W":
                                statsPlayer.wins++;
                                statsPlayer.results[round] = "W";
                                break;
                            case "L":
                                statsPlayer.losses++;
                                statsPlayer.results[round] = "L";
                                break;
                            default:
                                break;
                        }
                    });
                });
            }
        }

        ls.set("playerStats", playerStats);
        this.setState({playerStats: playerStats});
        console.log('Player stats updated successfully');
    }

    togglePlayerResult = async (playerId, round) => {
        const player = await getPlayer(ls.get("tournamentId"), playerId);

        const lastResult = player && player[round] ? player[round].result : null;
        const allResults = ["W", "L", null];
        const newResult = allResults[(allResults.indexOf(lastResult) + 1) % allResults.length];

        const newPlayer = player ? {
            ...player,
            [round]: {
                ...player[round],
                result: newResult
            }
        } : {[round]: {result: newResult}};

        await savePlayer(ls.get("tournamentId"), playerId, newPlayer);
        this.updatePlayerStats();
    }

    static getWins(importedPlayers, player) {
        if (importedPlayers && importedPlayers[player] && importedPlayers[player].wins) {
            return importedPlayers[player].wins;
        }
        return 0;
    }

    static getLosses(importedPlayers, player) {
        if (importedPlayers && importedPlayers[player] && importedPlayers[player].losses) {
            return importedPlayers[player].losses;
        }
        return 0;
    }

    static emptyPlayerStats(player) {
        return {
            id: player,
            partners: [],
            opponents: [],
            courts: [],
            playedMatches: 0,
            mixedMatches: 0,
            mixedTeams: 0,
            paradiseMixedDiff: 0,
            name: "Player " + player,
            wins: 0,
            losses: 0,
            results: {}
        }
    }

    render() {
        let dryRunRound;
        const dryRunRoundDraw = this.createDryRound();
        if (dryRunRoundDraw) {
            dryRunRound = <Round
                courts={dryRunRoundDraw}
                roundName="Example round"
                courtClass="courtSize3"
                className="dryRun"
                showTenCourts={this.state.showTenCourts}
                courtsToUse={this.state.courtsToUse}
                importedPlayers={this.state.importedPlayers}/>;
        }

        const rounds = [];
        for (let index = this.state.rounds.length - 1; index >= 0; index--) {
            rounds.push(
                <Round courts={this.state.rounds[index]}
                       key={index}
                       roundName={`Round ${index + 1}`}
                       roundIndex={index}
                       onDeleteRound={this.onDeleteRound}
                       onShowOnPresentation={this.onShowOnPresentation}
                       isShown={this.state.presentationRoundIndex === index}
                       courtClass="courtSize1"
                       showTenCourts={this.state.showTenCourts}
                       courtsToUse={this.state.courtsToUse}
                       importedPlayers={this.state.importedPlayers}
                       playerStats={this.state.playerStats}
                       onPlayerClick={this.togglePlayerResult}/>
            );
        }

        const errors = this.state.errors.map((message, index) =>
            <li className="error" key={index}>{message}</li>
        );

        return (
            <div id="app">
                <div id="config">
                    <Settings noCourts={this.state.noCourts}
                              teamsPerCourt={this.state.teamsPerCourt}
                              playersPerTeam={this.state.playersPerTeam}
                              useAllPlayers={this.state.useAllPlayers}
                              players={this.state.availablePlayers}
                              onSettingChange={this.onSettingChange}
                              onPlayersChange={this.onPlayersChange}
                              onSubmit={this.draw}
                              onResetState={this.onResetState}
                              autoPesentNewRound={this.state.autoPresentNewRound}
                              onAutoPresentNewRoundChange={this.onAutoPresentNewRoundChange}
                              showTenCourts={this.state.showTenCourts}
                              hideUnusedCourts={this.state.hideUnusedCourts}
                              courtsToUse={this.state.courtsToUse}
                              onCourtsToUseChange={this.onCourtsToUseChange}
                              setImportedPlayers={this.setImportedPlayers}
                              importedPlayers={this.state.importedPlayers}
                              lastRoundCreationDate={this.state.lastRoundCreationDate}
                              secondLastRoundCreationDate={this.state.secondLastRoundCreationDate}
                              showExampleRound={this.state.showExampleRound}
                              onShowExampleRoundChange={this.onShowExampleRoundChange}
                              onStartRound={this.onStartRound}
                              paradiseMode={this.state.paradiseMode}
                              onParadiseModeChange={this.onParadiseModeChange}
                              paradisePlayersPerCourt={this.state.paradisePlayersPerCourt}
                              playerViewEnabled={this.state.playerViewEnabled}
                              tournamentId={ls.get("tournamentId")}
                              playerStats={this.state.playerStats}
                              showLoadingSpinner={this.showLoadingSpinner}
                    />
                    <ul className="clear">
                        {errors}
                    </ul>
                </div>

                <div>
                    {this.state.showExampleRound && dryRunRound}
                    {!dryRunRound &&
                        <p className="exampleRoundError">The example run couldn't be generated. Check your input values
                            or
                            try generate the round for more detailed errors.</p>}
                    {rounds}
                </div>

                {this.state.showLoadingSpinner &&
                    <div className="loadingSpinner">
                        <img alt="Loading spinner" src={loadingSpinner}/>
                    </div>
                }

            </div>
        );
    }
}

export default App;
