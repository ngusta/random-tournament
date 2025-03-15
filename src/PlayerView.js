import React, {useEffect, useState, useRef} from 'react';
import {useParams} from 'react-router-dom';
import './PlayerView.css';
import {getTournament, savePlayer, getPlayer} from './api.js';
import ls from 'local-storage';
import Court from "./Court";

const PlayerView = () => {

    const {tournamentId} = useParams();
    const [tournament, setTournament] = useState(null);
    const [currentRoundIndex, setCurrentRoundIndex] = useState(null);
    const [nextRoundIndex, setNextRoundIndex] = useState(null);
    const [player, setPlayer] = useState(ls.get("player") || "");
    const [allPlayerRounds, setAllPlayerRounds] = useState(null);
    const [playerName, setPlayerName] = useState(null);
    const [error, setError] = useState(null);
    const [updateServer, setUpdateServer] = useState(false);
    const [debounceTimer, setDebounceTimer] = useState(null)

    const tournamentRef = useRef(tournament);
    const playerRef = useRef(player);

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    //Load tournament & player + set up focus/visility listeners on load
    useEffect(() => {
        updateTournament();

        const handleVisibilityChange = debounce(() => {
            if (document.visibilityState === 'visible') {
                updateTournament();
            }
        }, 200);

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('resume', handleVisibilityChange);
        window.addEventListener('focus', handleVisibilityChange);
        window.addEventListener('pageshow', handleVisibilityChange);
        window.addEventListener('online', handleVisibilityChange);
        window.addEventListener('popstate', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('resume', handleVisibilityChange);
            window.removeEventListener('focus', handleVisibilityChange);
            window.removeEventListener('pageshow', handleVisibilityChange);
            window.removeEventListener('online', handleVisibilityChange);
            window.removeEventListener('popstate', handleVisibilityChange);
        };
        // eslint-disable-next-line
    }, []);

    const updateTournament = async () => {
        const tournament = await getTournament(tournamentId);
        if (tournament === null || tournament.rounds === null) {
            setError("Nothing to be found here yet. Are you early? Did you use the correct link/QR code?");
            return;
        }
        setTournament(tournament);
        tournamentRef.current = tournament;
        if (tournament.isLatestRoundStarted) {
            setCurrentRoundIndex(tournament.presentationRoundIndex > -1 ? tournament.presentationRoundIndex : null);
            setNextRoundIndex(null);
        } else {
            setCurrentRoundIndex(tournament.presentationRoundIndex > 0 ? tournament.presentationRoundIndex - 1 : null);
            setNextRoundIndex(tournament.presentationRoundIndex > -1 ? tournament.presentationRoundIndex : null);
        }
        updatePlayerData();
    }
    const updatePlayerData = async () => {
        if (playerRef.current !== "" && tournamentRef.current && tournamentRef.current.rounds) {
            const playerRounds = {};
            const cloudPlayer = await getPlayer(tournamentId, playerRef.current)
            const rounds = tournamentRef.current.rounds;
            for (let r = 0; r < rounds.length; r++) {
                let foundInRound = false;
                for (let c = 0; c < rounds[r].length && !foundInRound; c++) {
                    for (let t = 0; t < rounds[r][c].length && !foundInRound; t++) {
                        for (let p = 0; p < rounds[r][c][t].length && !foundInRound; p++) {
                            if (rounds[r][c][t][p] === playerRef.current) {
                                playerRounds[r] = {
                                    'courtIndex': c,
                                    'courtPlayers': rounds[r][c],
                                    'result': cloudPlayer && cloudPlayer[r] ? cloudPlayer[r].result : null
                                }
                                foundInRound = true;
                            }
                        }
                    }
                }
            }
            setAllPlayerRounds(playerRounds);
            setPlayerName((cloudPlayer && cloudPlayer.displayName) ? cloudPlayer.displayName : "");
        }
    };

    useEffect(() => {
        if (updateServer) {
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            const timer = setTimeout(() => {
                savePlayer(tournamentId, player, allPlayerRounds);
            }, 1000);
            setDebounceTimer(timer);
        }
        setUpdateServer(false);
        // eslint-disable-next-line
    }, [updateServer]);

    const handlePlayerChange = (e) => {
        const value = e.target.value;
        if (value === "") {
            setPlayer("");
            playerRef.current = "";
            ls.set("player", "");
        } else {
            const number = parseInt(value, 10);
            setPlayer(number);
            playerRef.current = number;
            ls.set("player", number);
            console.log("Selected player: " + number);
        }
        updatePlayerData();
    };

    const toggleResult = (roundIndex) => {
        let nextResult = null;
        switch (allPlayerRounds[roundIndex].result) {
            case null:
                nextResult = "W";
                break;
            case "W":
                nextResult = "L";
                break;
            case "L":
                nextResult = null;
                break;
            default:
                throw new Error("Result should only be null, W, L - something's wrong.");
        }
        setAllPlayerRounds((prevValue) => ({
            ...prevValue,
            [roundIndex]: {
                ...prevValue[roundIndex],
                result: nextResult
            }
        }));
        setUpdateServer(true);
    }

    const noCourtMessage = player === "" ? "Enter your player number above." : (allPlayerRounds && !allPlayerRounds[currentRoundIndex] && !allPlayerRounds[nextRoundIndex] ? "You are not playing this round." : null);

    function getCourtName(courtIndex) {
        const court = parseInt(courtIndex, 10);
        if (tournament.showTenCourts && tournament.courtsToUse && tournament.courtsToUse[court]) {
            return tournament.courtsToUse[court];
        }
        return court + 1;
    }

    return (
        <div id="playerView">
            {error && <p id="error">{error}</p>}
            {!error &&
                <>
                    <div id="playerInputRow">
                        <input
                            id="playerInput"
                            type="number"
                            min="0"
                            max="1000"
                            value={player}
                            onChange={handlePlayerChange}
                            placeholder="Your Number"
                        />
                        <a href="#playerResults">Report results</a>
                    </div>
                    <p id="playerIdRow">
                        <span className={`player color${player % 10}`}>{player}</span>
                        <span className="playerName">{playerName}</span>
                    </p>
                    {allPlayerRounds && allPlayerRounds[nextRoundIndex] &&
                        <>
                            <p className="roundInfo">Your next round is on <span
                                className="courtInfo">Court {getCourtName(allPlayerRounds[nextRoundIndex].courtIndex)}</span>
                            </p>
                            <Court teams={allPlayerRounds[nextRoundIndex].courtPlayers}
                                   key={allPlayerRounds[nextRoundIndex].courtIndex}
                                   courtNumber={allPlayerRounds[nextRoundIndex].courtIndex + 1}
                                   courtClass="courtSize3"/>
                        </>
                    }
                    {allPlayerRounds && allPlayerRounds[currentRoundIndex] && !allPlayerRounds[nextRoundIndex] &&
                        <>
                            <p className="roundInfo">Your current round is on <span
                                className="courtInfo">Court {getCourtName(allPlayerRounds[currentRoundIndex].courtIndex)}</span>
                            </p>
                            <Court teams={allPlayerRounds[currentRoundIndex].courtPlayers}
                                   key={allPlayerRounds[currentRoundIndex].courtIndex}
                                   courtNumber={allPlayerRounds[currentRoundIndex].courtIndex + 1}
                                   courtClass="courtSize3"/>
                        </>
                    }
                    {noCourtMessage !== null &&
                        <p>
                            {noCourtMessage}
                        </p>
                    }

                    {allPlayerRounds && (
                        <>
                            <h2 id="playerResults">Player results</h2>
                            <p id="explanation">Click the <span className="circle neutral">?</span> next to the round until
                                you get <span className="circle win">W</span> for Win
                                or <span className="circle lose">L</span> if you lost.</p>
                            <ul id="allRounds">
                                {Object.entries(allPlayerRounds)
                                    .sort(([roundIndexA], [roundIndexB]) => parseInt(roundIndexB) - parseInt(roundIndexA))
                                    .map(([roundIndex, {courtIndex, courtPlayers, result}]) => (
                                        <li key={roundIndex}>
                                            <div onClick={() => toggleResult(roundIndex)}
                                                 className={`circle ${result === null ? "neutral" : (result === "W" ? "win" : "lose")}`}>{result === null ? "?" : (result === "W" ? "W" : "L")}</div>
                                            <strong>Round {parseInt(roundIndex, 10) + 1}:&nbsp;</strong>
                                            {tournament.paradiseMode ? courtPlayers.map(team => team.join(", ")).join(", ") : courtPlayers.map(team => team.join(" & ")).join(" vs ")}
                                            &nbsp;on
                                            Court {getCourtName(courtIndex)} {currentRoundIndex === parseInt(roundIndex) ? " (current)" : (nextRoundIndex === parseInt(roundIndex) ? " (next)" : "")}
                                        </li>
                                    ))}
                            </ul>
                        </>
                    )}
                </>}
        </div>
    );
};

export default PlayerView;
