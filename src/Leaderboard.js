import React, {useState, useEffect} from 'react';
import './Leaderboard.css';
import ls from 'local-storage';
import {getPlayer} from './api.js';

const Leaderboard = () => {
    const tournamentId = ls.get("tournamentId");

    const [playerStats, setPlayerStats] = useState(ls.get("playerStats"));

    useEffect(() => {
        const checkUpdate = () => {
            if (ls.get("updatePresentation")) {
                ls.set("updatePresentation", false);
                //setPlayerStats(ls.get("playerStats"));
            }
        };
        const interval = setInterval(checkUpdate, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let playerStats = ls.get("playerStats");
        if (playerStats) {
            const updatePlayerStats = async () => {
                // Loop over entries of playerStats object
                for (const [player, stats] of Object.entries(playerStats)) {
                    // Wait for the result of getPlayer for the current player
                    const cloudPlayerRounds = await getPlayer(tournamentId, player);

                    if (cloudPlayerRounds) {
                        stats.wins = 0;
                        stats.losses = 0;

                        // Loop through rounds and calculate wins and losses
                        Object.values(cloudPlayerRounds).forEach(round => {
                            switch (round.result) {
                                case "W":
                                    stats.wins++;
                                    break;
                                case "L":
                                    stats.losses++;
                                    break;
                                default:
                                    break;
                            }
                        });
                    }
                }

                setPlayerStats(playerStats);
                console.log('Player stats updated successfully');
            };

            updatePlayerStats();
        }
    }, [tournamentId]);

    const sortedPlayers = Object.values(playerStats).filter(p => p !== null).sort((a, b) => {
        if (a.wins !== b.wins) {
            return b.wins - a.wins;
        }
        return a.losses - b.losses;
    });

    const playerTableRows = sortedPlayers.slice(0, 10).map((player, index) =>
        <tr key={index}>
            <td>{index + 1}</td>
            <td>{player.name ? player.name : player.id}</td>
            <td>{player.wins + player.losses}</td>
            <td>{player.wins}</td>
            <td>{player.losses}</td>
        </tr>
    );

    return (
        <div id="leaderboard">
            <div>
                <h1>Leaderboard</h1>
                <table>
                    <thead>
                    <tr>
                        <th title="Position">Pos</th>
                        <th title="Name">Name</th>
                        <th title="Matches">Matches</th>
                        <th title="Wins">Wins</th>
                        <th title="Losses">Losses</th>
                    </tr>
                    </thead>
                    <tbody>
                    {playerTableRows}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Leaderboard;