import React, { useState, useEffect } from 'react';
import './Leaderboard.css';
import ls from 'local-storage';

const Leaderboard = () => {
    const [playerStats, setPlayerStats] = useState(ls.get("playerStats") || []);

    useEffect(() => {
        const checkUpdate = () => {
            if (ls.get("updatePresentation")) {
                ls.set("updatePresentation", false);
                setPlayerStats(ls.get("playerStats"));
            }
        };

        const interval = setInterval(checkUpdate, 100);

        // Clean up the interval when the component is unmounted
        return () => clearInterval(interval);
    }, []);

    const sortedPlayers = Object.values(playerStats).filter(p => p !== null).sort((a, b) => {
        if (a.wins !== b.wins) {
            return b.wins - a.wins;
        }
        return a.losses - b.losses;
    });

    const playerTableRows = sortedPlayers.slice(0, 10).map((player, index) =>
        <tr key={index}>
            <td>{index + 1}</td>
            <td>{player.name}</td>
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
                        <th title="Position"></th>
                        <th title="Player name">Name</th>
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