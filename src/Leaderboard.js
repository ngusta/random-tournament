import React, {useEffect, useState} from 'react';
import './Leaderboard.css';
import ls from 'local-storage';

const Leaderboard = () => {
    const [playerStats, setPlayerStats] = useState(ls.get("playerStats"));

    useEffect(() => {
        const interval = setInterval(() => {
            setPlayerStats(ls.get("playerStats"));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const sortedPlayers = playerStats ? Object.values(playerStats).filter(p => p !== null).sort((a, b) => {
        if (a.wins !== b.wins) {
            return b.wins - a.wins;
        }
        return a.losses - b.losses;
    }) : [];

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