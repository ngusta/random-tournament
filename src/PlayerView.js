import React, {useEffect, useState} from 'react';
import {useParams} from 'react-router-dom';
import './PlayerView.css';
import {getTournament} from './api.js';
import ls from 'local-storage';
import Court from "./Court";

const PlayerView = () => {

        const {tournamentId} = useParams();

        const [tournament, setTournament] = useState(null);
        const [currentRoundIndex, setCurrentRoundIndex] = useState(null);
        const [nextRoundIndex, setNextRoundIndex] = useState(null);
        const [player, setPlayer] = useState(ls.get("player") || "");
        const [allPlayerRounds, setAllPlayerRounds] = useState(ls.get("allPlayerRounds") ? ls.get("allPlayerRounds") : null);
        const [error, setError] = useState(null);

        useEffect(() => {
            getTournament(tournamentId)
                .then(tournament => {
                    if (tournament === null) {
                        setError("Nothing to be found here yet. Are you early? Did you use the correct link/QR code?");
                    }
                    setTournament(tournament);
                    if (tournament.isLatestRoundStarted) {
                        setCurrentRoundIndex(tournament.presentationRoundIndex > -1 ? tournament.presentationRoundIndex : null);
                        setNextRoundIndex(null);
                    } else {
                        setCurrentRoundIndex(tournament.presentationRoundIndex > 0 ? tournament.presentationRoundIndex - 1 : null);
                        setNextRoundIndex(tournament.presentationRoundIndex > -1 ? tournament.presentationRoundIndex : null);
                    }
                });
        }, [tournamentId]);

        useEffect(() => {
            if (player !== "" && tournament) {
                const playerRounds = {};
                for (let r = 0; r < tournament.rounds.length; r++) {
                    let foundInRound = false;
                    for (let c = 0; c < tournament.rounds[r].length && !foundInRound; c++) {
                        for (let t = 0; t < tournament.rounds[r][c].length && !foundInRound; t++) {
                            for (let p = 0; p < tournament.rounds[r][c][t].length && !foundInRound; p++) {
                                if (tournament.rounds[r][c][t][p] === player) {
                                    playerRounds[r] = {
                                        'courtIndex': c,
                                        'courtPlayers': tournament.rounds[r][c],
                                        'result': ls.get("allPlayerRounds") && ls.get("allPlayerRounds")[r] ? ls.get("allPlayerRounds")[r].result : null
                                    }
                                    foundInRound = true;
                                }
                            }
                        }
                    }
                }
                setAllPlayerRounds(playerRounds);
                console.log("Player courts: " + JSON.stringify(playerRounds));

            }
        }, [tournament, player]);

        useEffect(() => {
            ls.set("allPlayerRounds", allPlayerRounds);
        }, [allPlayerRounds]);

        const handlePlayerChange = (e) => {
            const value = e.target.value;
            if (value === "") {
                setPlayer("");
                ls.set("player", "");
            } else {
                const number = parseInt(value, 10);
                setPlayer(number);
                ls.set("player", number);
                console.log("Selected player: " + number);
            }
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
        }

        const noCourtMessage = player === "" ? "Enter your player number above." : (allPlayerRounds && !allPlayerRounds[currentRoundIndex] && !allPlayerRounds[nextRoundIndex] ? "You are not playing this round, or your player number doesn't exist." : null);

        return (
            <div id="playerView">
                {error && <p id="error">{error}</p>}
                {!error &&
                    <>
                        <input
                            id="playerInput"
                            type="number"
                            min="0"
                            max="1000"
                            value={player}
                            onChange={handlePlayerChange}
                            placeholder="Enter your player number"
                        />
                        {allPlayerRounds && allPlayerRounds[nextRoundIndex] &&
                            <>
                                <p className="roundInfo">Your next round is on <span
                                    className="courtInfo">Court {allPlayerRounds[nextRoundIndex].courtIndex + 1}</span></p>
                                <Court teams={allPlayerRounds[nextRoundIndex].courtPlayers}
                                       key={allPlayerRounds[nextRoundIndex].courtIndex}
                                       courtNumber={allPlayerRounds[nextRoundIndex].courtIndex + 1}
                                       courtClass="courtSize3"/>
                            </>
                        }
                        {allPlayerRounds && allPlayerRounds[currentRoundIndex] &&
                            <>
                                <p className="roundInfo">Your current round is on <span
                                    className="courtInfo">Court {allPlayerRounds[currentRoundIndex].courtIndex + 1}</span>
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
                                <h2>All rounds</h2>
                                <ul id="allRounds">
                                    {Object.entries(allPlayerRounds)
                                        .sort(([roundIndexA], [roundIndexB]) => parseInt(roundIndexB) - parseInt(roundIndexA))
                                        .map(([roundIndex, {courtIndex, courtPlayers, result}]) => (
                                            <li key={roundIndex}>
                                                <div onClick={() => toggleResult(roundIndex)} className={`circle ${result === null ? "neutral" : (result === "W" ? "win" : "lose")}`}>{result === null ? "?" : (result === "W" ? "W" : "L")}</div>
                                                <strong>Round {parseInt(roundIndex, 10) + 1}:&nbsp;</strong>
                                                {courtPlayers.map(team => team.join(" & ")).join(" vs ")}
                                                &nbsp;on
                                                Court {courtIndex + 1} {currentRoundIndex === parseInt(roundIndex) ? " (current)" : (nextRoundIndex === parseInt(roundIndex) ? " (next)" : "")}
                                            </li>
                                        ))}
                                </ul>
                            </>
                        )}
                    </>}
            </div>
        )
            ;
    }
;

export default PlayerView;
