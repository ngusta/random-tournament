import React, { useEffect, useState } from "react";
import "./Leaderboard.css";
import ls from "local-storage";

const Leaderboard = () => {
    const [playerStats, setPlayerStats] = useState(ls.get("playerStats") || {});
    const [noOnLeaderboard, setNoOnLeaderBoard] = useState(ls.get("noOnLeaderboard") || 20);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlayerStats(ls.get("playerStats") || {});
            setNoOnLeaderBoard(ls.get("noOnLeaderboard") || 20);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const sortedPlayers = Object.values(playerStats)
        .filter((p) => p !== null && p.wins > 0)
        .sort((a, b) => (b.wins !== a.wins ? b.wins - a.wins : a.losses - b.losses))
        .slice(0, noOnLeaderboard);

    let rank = 1;
    let previousWins = null;

    const generateTableRows = (players, startRank) => {
        return players.map((player, index) => {
            if (previousWins !== null && player.wins !== previousWins) {
                rank = startRank + index;
            }

            previousWins = player.wins;

            return (
                <tr key={player.id || startRank + index}>
                    <td className="numeric">{rank}</td>
                    <td>{player.displayName || player.id}</td>
                    <td className="numeric">{player.playedMatches}</td>
                    <td className="numeric">{player.wins}</td>
                </tr>
            );
        });
    };

    const tables = [];
    for (let i = 0; i < sortedPlayers.length; i += 20) {
        const tableRows = generateTableRows(sortedPlayers.slice(i, i + 20), i + 1);
        tables.push(
            <table key={i}>
                <thead>
                <tr>
                    <th title="Rank">Rank</th>
                    <th title="Name">Name</th>
                    <th title="Rounds">Rounds</th>
                    <th title="Wins">Wins</th>
                </tr>
                </thead>
                <tbody>{tableRows}</tbody>
            </table>
        );
    }

    return (
        <div id="leaderboard">
            <div>
                <h1>Leaderboard</h1>
                <div className="leaderboard-tables">{tables}</div>
            </div>
        </div>
    );
};

export default Leaderboard;
