import React from 'react';
import './App.css';
import Settings from './Settings';
import Round from './Round';
import ls from 'local-storage';
import loadingSpinner from './img/loading-spinner.svg';
import logo from './img/2025/BT-logga-med-vit-kant.webp';
import { deleteTournament, saveTournament, getPlayers, getPlayer, savePlayer, savePlayers, createPlayers } from './api.js';
import { ToastContainer, toast } from "react-toastify";
import { createSwissTournament, createSwissRound, registerSwissResults } from './SwissTournament';
import 'react-toastify/dist/ReactToastify.css';

export const TOURNAMENT_TYPES = {
    RANDOM: 'random',
    PREDEFINED: 'predefined',
    SWISS: 'swiss'
};

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
            hideUnusedCourts: ls.get("hideUnusedCourts") || true,
            courtsToUse: ls.get("courtsToUse") || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            importedPlayers: ls.get("importedPlayers") || {},
            lastRoundCreationDate: ls.get("lastRoundCreationDate") || null,
            secondLastRoundCreationDate: ls.get("secondLastRoundCreationDate") || null,
            showLoadingSpinner: false,
            paradiseMode: ls.get("paradiseMode") === null ? false : ls.get("paradiseMode"),
            paradisePlayersPerCourt: ls.get("paradisePlayersPerCourt") === null ? 5 : ls.get("paradisePlayersPerCourt"),
            paradisePlayersPerRound: ls.get("paradisePlayersPerRound") === null ? 16 : ls.get("paradisePlayersPerRound"),
            playerStats: ls.get("playerStats") === null ? null : ls.get("playerStats"),
            playerViewEnabled: ls.get("playerViewEnabled") === null ? false : ls.get("playerViewEnabled"),
            updateStatsIntervalId: ls.get("playerViewEnabled") ? setInterval(this.updatePlayerStats, 5000) : null,
            noOnLeaderboard: ls.get("noOnLeaderboard") === null ? 20 : ls.get("noOnLeaderboard"),
            playerInstructions: ls.get("playerInstructions") || "",
            groupId: ls.get("groupId") || "",
            tournamentName: ls.get("tournamentName") || "",
            swissTournaments: ls.get("swissTournaments") || {},
            tournamentType: ls.get("tournamentType") || TOURNAMENT_TYPES.RANDOM,
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
            this.setState({ availablePlayers: newAvailablePlayers });
            ls.set("availablePlayers", newAvailablePlayers);
        } else {
            this.setState({ [name]: value });
            ls.set(name, value);
        }
        switch (name) {
            case "playerViewEnabled":
                if (ls.get("playerViewEnabled")) {
                    this.saveTournamentInCloud();
                    this.createPlayersInCloud();
                    const intervalId = setInterval(this.updatePlayerStats, 5000);
                    this.setState({ updateStatsIntervalId: intervalId });
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
            case "noOnLeaderboard":
            case "playerInstructions":
            case "groupId":
            case "tournamentName":
                this.saveTournamentInCloud();
                break;
            default:
        }
    };

    onPlayerActiveChange = async (playerId, active) => {
        const newAvailablePlayers = [...this.state.availablePlayers];
        newAvailablePlayers[playerId - 1] = active;
        this.setState({ availablePlayers: newAvailablePlayers });
        ls.set("availablePlayers", newAvailablePlayers);
        if (this.state.playerViewEnabled) {
            const response = await savePlayer(ls.get("tournamentId"), playerId, { active: active, version: this.state.playerStats[playerId] ? this.state.playerStats[playerId].version : 1 });
            if (response.status === 200) {
                toast.success("Player active state saved.");
            } else if (response.status === 409) {
                toast.error("Sync error. Try again.");
            } else {
                toast.error("Error saving the player active state.");
            }

            await this.updatePlayerStats();
        }
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
        this.setState({ courtsToUse: courtsToUseCopy });
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
        this.setState({ rounds: roundsCopy, presentationRoundIndex: pressIndex });
        ls.set("lastPlayerInRounds", lastPlayerInRounds);
        ls.set("updatePresentation", true);
        ls.set("rounds", roundsCopy);
        ls.set("presentationRoundIndex", pressIndex);

        ls.set("playerStats", []);
        roundsCopy.forEach(round => Round.updatePlayerStats(round));
        this.saveTournamentInCloud();
    };

    onShowOnPresentation = (roundIndex) => {
        if (this.state.presentationRoundIndex === roundIndex) {
            roundIndex = -1;
        }
        this.setState({ presentationRoundIndex: roundIndex });
        ls.set("presentationRoundIndex", roundIndex);
        this.saveTournamentInCloud();
    };

    onResetState = () => {
        const tournamentId = ls.get("tournamentId");
        ls.clear();
        this.showLoadingSpinner(true);
        deleteTournament(tournamentId)
            .then((response) => {
                window.location.reload()
            });
    };

    onAutoPresentNewRoundChange = (value) => {
        this.setState({ autoPresentNewRound: value });
    };

    onStartRound = () => {
        const created = Date.now();
        this.setState({ secondLastRoundCreationDate: this.state.lastRoundCreationDate });
        ls.set("secondLastRoundCreationDate", this.state.lastRoundCreationDate);
        this.setState({ lastRoundCreationDate: created });
        ls.set("lastRoundCreationDate", created);
        this.saveTournamentInCloud();
    }

    onParadiseModeChange = (e) => {
        this.setState({ paradiseMode: e.target.checked });
        ls.set("paradiseMode", e.target.checked);
    };

    onTournamentTypeChange = (e) => {
        this.setState({ tournamentType: e.target.value });
        ls.set("tournamentType", e.target.value);
    };

    showLoadingSpinner = (show) => {
        this.setState({ showLoadingSpinner: show });
    }

    draw = async (predefinedRound) => {
        this.setState({ errors: [], showLoadingSpinner: true });

        setTimeout(async () => {
            try {
                ls.set("errors", []);

                const round = predefinedRound ? await this.createPredefinedRound(predefinedRound) : await this.createRound();
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
                toast.error("Error creating round: " + error);
                this.setState({ errors: [error.message] });
            } finally {
                toast.success("Round created successfully");
                this.setState({ showLoadingSpinner: false });
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
            (error) => {
            },
            false,
            this.state.rounds,
            this.state.importedPlayers,
            this.state.paradiseMode,
            this.state.paradisePlayersPerCourt,
            this.state.paradisePlayersPerRound,
            false
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
            this.state.paradisePlayersPerCourt,
            this.state.paradisePlayersPerRound,
            false
        );
    }

    async createPredefinedRound(predefinedRound) {
        const courts = [...new Set(predefinedRound.map(row => row[0]))];
        const round = courts.map(court =>
            predefinedRound
                .filter(row => row[0] === court)
                .map(row => row.slice(1))
                .flat()
        )
            .filter(row => row.length > 0)
        this.setState({ courtsToUse: courts, noCourts: courts.length });
        ls.set("courtsToUse", courts);
        ls.set("noCourts", courts.length);
        return Round.createPredefinedRound(
            round,
            this.state.importedPlayers
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
        this.setState({ errors: newErrors });
        ls.set("errors", newErrors);
    };

    saveTournamentInCloud = () => {
        if (ls.get("playerViewEnabled")) {
            let data = {};
            data.rounds = ls.get("rounds") || this.state.rounds;
            data.presentationRoundIndex = ls.get("presentationRoundIndex") || this.state.presentationRoundIndex;
            data.isLatestRoundStarted = ls.get("isLatestRoundStarted") || this.state.isLatestRoundStarted;
            data.courtsToUse = ls.get("courtsToUse") || this.state.courtsToUse;
            data.paradiseMode = ls.get("paradiseMode") || this.state.paradiseMode;
            data.paradisePlayersPerCourt = ls.get("paradisePlayersPerCourt") || this.state.paradisePlayersPerCourt;
            data.noOnLeaderboard = ls.get("noOnLeaderboard") || this.state.noOnLeaderboard;
            data.playerInstructions = ls.get("playerInstructions") || this.state.playerInstructions;
            data.groupId = ls.get("groupId") || this.state.groupId;
            data.tournamentName = ls.get("tournamentName") || this.state.tournamentName;
            data.tournamentType = ls.get("tournamentType") || this.state.tournamentType;
            data.swissTournaments = ls.get("swissTournaments") || this.state.swissTournaments;
            saveTournament(ls.get("tournamentId"), data);
        }
    };

    setImportedPlayers = async (importedPlayerData) => {
        console.log("importedPlayerData:", importedPlayerData);
        ls.set("importInProgress", true);
        this.showLoadingSpinner(true);
        const importedPlayers = {};
        const playerStats = ls.get("playerStats") || [];
        const newAvailablePlayers = [...this.state.availablePlayers];
        Object.keys(importedPlayerData).forEach(index => {
            const playerNumber = importedPlayerData[index].playerId;
            const playerIndex = playerNumber - 1;
            if (!playerStats[playerNumber]) {
                playerStats[playerNumber] = App.emptyPlayerStats(playerNumber);
            }
            playerStats[playerNumber].name = importedPlayerData[index].name;
            playerStats[playerNumber].displayName = importedPlayerData[index].displayName;
            playerStats[playerNumber].gender = importedPlayerData[index].gender;

            newAvailablePlayers[playerIndex] = importedPlayerData[index].active;
            importedPlayers[playerNumber] = importedPlayerData[index];
        });
        this.setState({ importedPlayers: importedPlayers });
        ls.set("importedPlayers", importedPlayers);
        this.setState({ playerStats: playerStats });
        ls.set("playerStats", playerStats);
        this.setState({ availablePlayers: newAvailablePlayers });
        ls.set("availablePlayers", newAvailablePlayers);
        if (ls.get("playerViewEnabled")) {
            await this.savePlayerDataToCloud();
        }
        ls.set("updatePresentation", true);
        ls.set("importInProgress", false);
        this.showLoadingSpinner(false);
    };

    updateGender = (playerNumber, newGender) => {
        const newImportedPlayers = Object.assign({}, this.state.importedPlayers);
        if (newImportedPlayers[playerNumber]) {
            newImportedPlayers[playerNumber].gender = newGender;
        } else {
            newImportedPlayers[playerNumber] = {
                active: null,
                playerId: playerNumber,
                name: null,
                displayName: null,
                gender: newGender,
            };
        }
        this.setState({ importedPlayers: newImportedPlayers });
        ls.set("importedPlayers", newImportedPlayers);
    }

    updateImportedPlayers = async (importedPlayers) => {
        ls.set("importInProgress", true);
        this.showLoadingSpinner(true);
        const newImportedPlayers = Object.assign({}, this.state.importedPlayers);
        const playerStats = ls.get("playerStats") || [];
        Object.keys(importedPlayers).forEach(index => {
            const playerNumber = importedPlayers[index].id;
            if (!playerStats[playerNumber]) {
                playerStats[playerNumber] = App.emptyPlayerStats(playerNumber);
            }
            playerStats[playerNumber].displayName = importedPlayers[index].displayName;
            newImportedPlayers[playerNumber].displayName = importedPlayers[index].displayName;

            playerStats[playerNumber].name = importedPlayers[index].name;
            newImportedPlayers[playerNumber].name = importedPlayers[index].name;

            playerStats[playerNumber].gender = importedPlayers[index].gender;
            newImportedPlayers[playerNumber].gender = importedPlayers[index].gender;
        });
        this.setState({ importedPlayers: newImportedPlayers });
        ls.set("importedPlayers", newImportedPlayers);
        this.setState({ playerStats: playerStats });
        ls.set("playerStats", playerStats);
        if (this.state.playerViewEnabled) {
            await this.savePlayerDataToCloud();
        }
        ls.set("updatePresentation", true);
        ls.set("importInProgress", false);
        this.showLoadingSpinner(false);
    }

    importNextRound = (importedRound) => {
        this.activateAllPlayers();
        this.draw(importedRound);
    }

    activateAllPlayers = async () => {
        //Activate all players in case they will be needed 
        if (this.state.availablePlayers.length >= 500) {
            return;
        }
        const players = Array.from({ length: 500 }, (_, i) => ({
            active: true,
            playerId: String(i + 1),
            name: "Player " + (i + 1),
            displayName: "Player " + (i + 1),
            gender: "M",
        }));
        await this.setImportedPlayers(players);
    }

    createPlayersInCloud = async () => {
        if (!ls.get("playerStats")) {
            const playerStats = [];
            ls.get("availablePlayers").forEach((active, index) => {
                const playerId = index + 1;
                playerStats[playerId] = App.emptyPlayerStats(playerId);
                playerStats[playerId].active = active;
            });
            ls.set("playerStats", playerStats);
        }
        const playersWithData = [];
        const lenPlayerStats = ls.get("availablePlayers").length + 1;

        for (let playerId = 1; playerId < lenPlayerStats; playerId++) {
            const player = ls.get("playerStats")[playerId] ? ls.get("playerStats")[playerId] : App.emptyPlayerStats(playerId);
            playersWithData.push({
                active: ls.get("availablePlayers")[playerId - 1],
                playerId: String(playerId),
                name: player.name,
                displayName: player.displayName,
                gender: player.gender,
                version: 1
            });
        }
        const response = await createPlayers(ls.get("tournamentId"), playersWithData);

        if (response.status === 201) {
            toast.success("Import completed and player data saved in the cloud.");
        } else if (response.status === 409) {
            toast.error("Player save sync error. Try import again.");
        } else {
            toast.error("Error saving the imported state.");
        }
    }

    async savePlayerDataToCloud() {
        const playersWithData = [];
        for (let playerId = 1; playerId < ls.get("playerStats").length; playerId++) {
            const player = ls.get("playerStats")[playerId];
            playersWithData.push({
                active: ls.get("availablePlayers")[playerId - 1],
                playerId: String(playerId),
                name: player.name,
                displayName: player.displayName,
                gender: player.gender,
                version: player.version
            });
        }
        const response = await savePlayers(ls.get("tournamentId"), playersWithData);
        await this.updatePlayerStats();

        if (response.status === 200) {
            toast.success("Player data saved in the cloud.");
        } else if (response.status === 409) {
            toast.error("Player save sync error. Try import again.");
        } else {
            toast.error("Error saving the imported state.");
        }
    }

    updatePlayerStats = async () => {
        if (this.state.showLoadingSpinner || !this.state.playerViewEnabled) {
            //Skip updating while e.g. import or round creation ongoing
            return;
        }
        const newAvailablePlayers = [...this.state.availablePlayers];
        let playerStats = ls.get("playerStats");
        if (playerStats) {
            const cloudPlayerRounds = await getPlayers(ls.get("tournamentId"));

            if (cloudPlayerRounds) {
                cloudPlayerRounds.forEach(cloudPlayer => {
                    newAvailablePlayers[cloudPlayer.playerId - 1] = cloudPlayer.active;
                    if (!playerStats[cloudPlayer.playerId]) {
                        playerStats[cloudPlayer.playerId] = App.emptyPlayerStats(cloudPlayer.playerId);
                    }
                    const statsPlayer = playerStats[cloudPlayer.playerId];
                    statsPlayer.wins = 0;
                    statsPlayer.losses = 0;
                    statsPlayer.results = {};
                    statsPlayer.version = cloudPlayer.version;
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

        if (this.state.showLoadingSpinner) {
            //Skip updating while e.g. import or round creation ongoing
            return;
        }
        ls.set("playerStats", playerStats);
        this.setState({ playerStats: playerStats });
        ls.set("availablePlayers", newAvailablePlayers);
        this.setState({ availablePlayers: newAvailablePlayers });
        console.log('Player stats updated successfully');
    }

    togglePlayerResult = async (playerId, round) => {
        if (!this.state.playerViewEnabled) {
            toast.error("Player view is disabled. Please enable it to change the result.");
            return;
        }
        const player = await getPlayer(ls.get("tournamentId"), playerId);

        const lastResult = player && player[round] ? player[round].result : null;
        const allResults = ["W", "L", null];
        const newResult = allResults[(allResults.indexOf(lastResult) + 1) % allResults.length];

        await this.updatePlayerResults(playerId, round, newResult);

        if (this.state.tournamentType === TOURNAMENT_TYPES.SWISS) {
            let teamMates, playersOnCourt;
            if (this.state.rounds[round]) {
                this.state.rounds[round].forEach((court, _) => {
                    court.forEach((team, _) => {
                        team.forEach((p, _) => {
                            if (p === playerId) {
                                teamMates = team;
                                playersOnCourt = court.flat().filter(p => p !== playerId);
                            }
                        });
                    });
                });
            }

            const opponentsResult = newResult === "W" ? "L" : (newResult === "L" ? "W" : null);

            for (const courtPlayer of playersOnCourt) {
                await this.updatePlayerResults(courtPlayer, round, teamMates.includes(courtPlayer) ? newResult : opponentsResult);
            }
        }

        this.updatePlayerStats();
    }

    updatePlayerResults = async (playerId, round, result) => {
        getPlayer(ls.get("tournamentId"), playerId).then(player => {
            const newPlayer = player ? {
                ...player,
                [round]: { ...player[round], result: result }
            } : { [round]: { result: result } };
            savePlayer(ls.get("tournamentId"), playerId, newPlayer);
        });
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
            displayName: "Player " + player,
            wins: 0,
            losses: 0,
            results: {},
            version: 1
        }
    }

    createSwissTournament = async (id, teams, courts) => {
        this.showLoadingSpinner(true);
        this.activateAllPlayers();
        let swissTournament = createSwissTournament(id, teams, courts);
        this.saveSwissTournament(swissTournament);
        this.onSettingChange("playerViewEnabled", true);
        this.showLoadingSpinner(false);
    }

    saveSwissTournament = (swissTournament) => {
        const newSwissTournaments = ls.get("swissTournaments") || {};
        newSwissTournaments[swissTournament.id] = swissTournament;
        this.setState({ swissTournaments: newSwissTournaments });
        ls.set("swissTournaments", newSwissTournaments);
        console.log("Saved Swiss tournaments", ls.get("swissTournaments"));
    }

    onCreateSwissRound = async () => {
        this.showLoadingSpinner(true);
        //TODO: Handle multiple tournaments
        const swissTournament = Object.values(this.state.swissTournaments)[0];

        // Only require the second-last round to be fully reported
        const roundsCount = swissTournament.pairings.length;
        if (roundsCount > 1) {
            const secondLastIndex = roundsCount - 2;
            const ok = await this.updateSwissResults(swissTournament, secondLastIndex);
            if (!ok) {
                this.showLoadingSpinner(false);
                return;
            }
        }
        createSwissRound(swissTournament);

        const nextRoundIndex = this.state.rounds.length;

        let courtIndex = 0;
        const matches = swissTournament.pairings[swissTournament.pairings.length - 1]
            .filter(pairing => !pairing.bye)
            .map(pairing => {
                pairing.courtIndex = courtIndex;
                pairing.roundIndex = nextRoundIndex + Math.floor(courtIndex / swissTournament.courts.length);
                const court = swissTournament.courts[courtIndex++ % swissTournament.courts.length][0];
                return [court, ...swissTournament.teams[pairing.home].players, ...swissTournament.teams[pairing.away].players];
            });
        this.saveSwissTournament(swissTournament);

        for (let i = 0; i < matches.length / swissTournament.courts.length; i++) {
            const round = matches.slice(i * swissTournament.courts.length, (i + 1) * swissTournament.courts.length);
            this.draw(round);

            // Add sleep to prevent race condition in draw
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    updateSwissResults = async (swissTournament, roundIndexToCheck = null) => {
        const indexToCheck = (roundIndexToCheck === null) ? (swissTournament.pairings.length - 1) : roundIndexToCheck;
        const pairingsToEvaluate = swissTournament.pairings[indexToCheck];
        if (!pairingsToEvaluate) {
            toast.error("No such round to update results for.");
            return false;
        }
        const players = await getPlayers(ls.get("tournamentId"))

        const playersDict = {};
        players.forEach(player => {
            playersDict[player.playerId] = player;
        });

        let allPairingsReported = true;
        const results = pairingsToEvaluate.map(pairing => {
            const result = playersDict[swissTournament.teams[pairing.home].players[0]][pairing.roundIndex]
                ? playersDict[swissTournament.teams[pairing.home].players[0]][pairing.roundIndex].result
                : null;
            if (!result) {
                allPairingsReported = false;
            }
            const homeTeamScore = result === "W" ? 1 : 0;
            return {
                home: pairing.home,
                away: pairing.away,
                scoreHome: homeTeamScore,
                scoreAway: 1 - homeTeamScore
            };
        });
        if (allPairingsReported) {
            registerSwissResults(swissTournament, results);
            this.saveSwissTournament(swissTournament);
            return true;
        } else {
            toast.error("Report all results for Round " + (indexToCheck + 1) + ", then try again.");
            return false;
        }
    }

    onUpdateSwissResults = () => {
        //TODO: Handle multiple tournaments
        const swissTournament = Object.values(this.state.swissTournaments)[0];
        this.updateSwissResults(swissTournament);
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
                importedPlayers={this.state.importedPlayers} />;
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
                    onPlayerClick={this.togglePlayerResult} />
            );
        }

        const errors = this.state.errors.map((message, index) =>
            <li className="error" key={index}>{message}</li>
        );

        return (
            <div id="app">
                <ToastContainer />
                <img src={logo} alt="Tournament Logo" className="logo" />
                <div id="config">
                    <Settings noCourts={this.state.noCourts}
                        teamsPerCourt={this.state.teamsPerCourt}
                        playersPerTeam={this.state.playersPerTeam}
                        useAllPlayers={this.state.useAllPlayers}
                        players={this.state.availablePlayers}
                        onSettingChange={this.onSettingChange}
                        onPlayerActiveChange={this.onPlayerActiveChange}
                        onSubmit={this.draw}
                        onResetState={this.onResetState}
                        autoPesentNewRound={this.state.autoPresentNewRound}
                        onAutoPresentNewRoundChange={this.onAutoPresentNewRoundChange}
                        showTenCourts={this.state.showTenCourts}
                        hideUnusedCourts={this.state.hideUnusedCourts}
                        courtsToUse={this.state.courtsToUse}
                        onCourtsToUseChange={this.onCourtsToUseChange}
                        setImportedPlayers={this.setImportedPlayers}
                        updateImportedPlayers={this.updateImportedPlayers}
                        importedPlayers={this.state.importedPlayers}
                        updateGender={this.updateGender}
                        lastRoundCreationDate={this.state.lastRoundCreationDate}
                        secondLastRoundCreationDate={this.state.secondLastRoundCreationDate}
                        onStartRound={this.onStartRound}
                        paradiseMode={this.state.paradiseMode}
                        onParadiseModeChange={this.onParadiseModeChange}
                        paradisePlayersPerCourt={this.state.paradisePlayersPerCourt}
                        paradisePlayersPerRound={this.state.paradisePlayersPerRound}
                        playerViewEnabled={this.state.playerViewEnabled}
                        tournamentId={ls.get("tournamentId")}
                        playerStats={this.state.playerStats}
                        showLoadingSpinner={this.showLoadingSpinner}
                        importNextRound={this.importNextRound}
                        noOnLeaderboard={this.state.noOnLeaderboard}
                        playerInstructions={this.state.playerInstructions}
                        groupId={this.state.groupId}
                        tournamentName={this.state.tournamentName}
                        swissTournaments={this.state.swissTournaments}
                        createSwissTournament={this.createSwissTournament}
                        tournamentType={this.state.tournamentType}
                        onTournamentTypeChange={this.onTournamentTypeChange}
                        onCreateSwissRound={this.onCreateSwissRound}
                        onUpdateSwissResults={this.onUpdateSwissResults}
                    />
                    <ul className="clear">
                        {errors}
                    </ul>
                </div>

                <div>
                    {dryRunRound}
                    {!dryRunRound &&
                        <p className="exampleRoundError">The example run couldn't be generated. Check your input values
                            or
                            try generate the round for more detailed errors.</p>}
                    {rounds}
                </div>

                {this.state.showLoadingSpinner &&
                    <div className="loadingSpinner">
                        <img alt="Loading spinner" src={loadingSpinner} />
                    </div>
                }

            </div>
        );
    }
}

export default App;
