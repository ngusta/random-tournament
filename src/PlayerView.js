import React, {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import './PlayerView.css';
import {getTournament} from './api.js';
import ls from 'local-storage';
import Court from "./Court";

const PlayerView = () => {

        const {tournamentId} = useParams();

        const [tournament, setTournament] = useState(null);
        const [currentRound, setCurrentRound] = useState(null);
        const [nextRound, setNextRound] = useState(null);
        const [player, setPlayer] = useState(ls.get("player") || "");
        const [currentPlayerCourt, setCurrentPlayerCourt] = useState(null);
        const [nextPlayerCourt, setNextPlayerCourt] = useState(null);


        useEffect(() => {
            getTournament(tournamentId)
                .then(tournament => {
                    setTournament(tournament);
                    if (tournament.isLatestRoundStarted) {
                        setCurrentRound(tournament.presentationRoundIndex > -1 ? tournament.rounds[tournament.presentationRoundIndex] : null);
                        setNextRound(null);
                    } else {
                        setCurrentRound(tournament.presentationRoundIndex > 0 ? tournament.rounds[tournament.presentationRoundIndex - 1] : null);
                        setNextRound(tournament.presentationRoundIndex > -1 ? tournament.rounds[tournament.presentationRoundIndex] : null);
                    }
                });
        }, [tournamentId]);

        useEffect(() => {
            const findCourtOfSelectedPlayer = (round) => {
                for (let c = 0; c < round.length; c++) {
                    for (let t = 0; t < round[c].length; t++) {
                        for (let p = 0; p < round[c][t].length; p++) {
                            if (round[c][t][p] === player) {
                                return c;
                            }
                        }
                    }
                }
                return null;
            };

            if (player !== "" && tournament) {
                console.log("Round showing: " + tournament.presentationRoundIndex);
                setCurrentPlayerCourt(currentRound ? findCourtOfSelectedPlayer(currentRound) : null);
                setNextPlayerCourt(nextRound ? findCourtOfSelectedPlayer(nextRound) : null);
            }
        }, [tournament, player, currentRound, nextRound]);

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

        const noCourtMessage = player === "" ? "Enter your player number above." : (tournament && currentPlayerCourt === null && nextPlayerCourt === null ? "You are not playing this round, or your player number doesn't exist." : null);

        return (
            <div id="playerView">
                <input
                    id="playerInput"
                    type="number"
                    min="0"
                    max="1000"
                    value={player}
                    onChange={handlePlayerChange}
                    placeholder="Enter your player number"
                />

                {nextPlayerCourt !== null &&
                    <>
                        <p className="roundInfo">Your next round is on <span
                            className="courtInfo">Court {nextPlayerCourt + 1}</span></p>
                        <Court teams={nextRound[nextPlayerCourt]} key={nextPlayerCourt} courtNumber={nextPlayerCourt + 1}
                               courtClass="courtSize4"/>
                    </>
                }
                {currentPlayerCourt !== null &&
                    <>
                        <p className="roundInfo">Your current round is on <span
                            className="courtInfo">Court {currentPlayerCourt + 1}</span></p>
                        <Court teams={currentRound[currentPlayerCourt]} key={currentPlayerCourt}
                               courtNumber={currentPlayerCourt + 1}
                               courtClass="courtSize4"/>
                    </>
                }
                {noCourtMessage !== null &&
                    <p>
                        {noCourtMessage}
                    </p>
                }
            </div>
        );
    }
;

export default PlayerView;
