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

    let rank = 1;
    let previousWins = null;

    const playerTableRows = sortedPlayers.slice(0, 20).map((player, index) => {
        if (previousWins !== null && player.wins !== previousWins) {
            rank = index + 1;
        }

        previousWins = player.wins;

        return (
            <tr key={player.id || index}>
                <td className="numeric">{rank}</td>
                <td>{player.name ? player.name : player.id}</td>
                <td className="numeric">{player.wins + player.losses}</td>
                <td className="numeric">{player.wins}</td>
            </tr>
        );
    });
    const playerTableRows2 = sortedPlayers.slice(20, 40).map((player, index) => {
        if (previousWins !== null && player.wins !== previousWins) {
            rank = 20 + index + 1;
        }

        previousWins = player.wins;

        return (
            <tr key={player.id || index}>
                <td className="numeric">{rank}</td>
                <td>{player.name ? player.name : player.id}</td>
                <td className="numeric">{player.wins + player.losses}</td>
                <td className="numeric">{player.wins}</td>
            </tr>
        );
    });

    return (
        <div id="leaderboard">
            <div>
                <h1>Leaderboard</h1>
                <div className="leaderboard-tables">
                <table>
                    <thead>
                    <tr>
                        <th title="Rank">Rank</th>
                        <th title="Name">Name</th>
                        <th title="Rounds">Rounds</th>
                        <th title="Wins">Wins</th>
                    </tr>
                    </thead>
                    <tbody>
                    {playerTableRows}
                    </tbody>
                </table>
                <table>
                    <thead>
                    <tr>
                        <th title="Rank">Rank</th>
                        <th title="Name">Name</th>
                        <th title="Rounds">Rounds</th>
                        <th title="Wins">Wins</th>
                    </tr>
                    </thead>
                    <tbody>
                    {playerTableRows2}
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    );
}

export default Leaderboard;