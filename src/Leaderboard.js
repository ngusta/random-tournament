import React, { useEffect, useState } from "react";
import "./Leaderboard.css";
import { useParams } from 'react-router-dom';
import ls from "local-storage";
import logo from './img/2025/BT-logga-med-vit-kant.webp';
import { getPlayers, getTournament } from "./api";

const Leaderboard = () => {
    const { tournamentId } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [noOnLeaderboard, setNoOnLeaderBoard] = useState(ls.get("noOnLeaderboard") || 20);

    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    useEffect(() => {
        if (tournamentId == null) {
            return;
        }
        updateLeaderboardFromServer();

        const handleVisibilityChange = debounce(() => {
            if (document.visibilityState === 'visible') {
                updateLeaderboardFromServer();
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

    const updateLeaderboardFromServer = async () => {
        const tournament = await getTournament(tournamentId);
        if (!tournament) {
            return;
        }
        setTournament(tournament);
        setNoOnLeaderBoard(tournament.noOnLeaderboard);
        const players = await getPlayers(tournamentId);
        setLeaderboard(players.map(player => ({
            id: player.playerId,
            displayName: player.displayName ? player.displayName : player.name,
            wins: Object.entries(player).filter(([key, value]) => !isNaN(key) && value.result === "W").length,
            playedMatches: Object.entries(player).filter(([key]) => !isNaN(key)).length
        })));
    }

    useEffect(() => {
        if (tournamentId) {
            return;
        }
        const interval = setInterval(() => {
            const playerStats = ls.get("playerStats");
            setLeaderboard(Object.values(playerStats).filter(player => player !== null).map(player => ({
                id: player.id,
                displayName: player.displayName ? player.displayName : player.name,
                wins: player.wins,
                playedMatches: player.playedMatches
            })));
            setNoOnLeaderBoard(ls.get("noOnLeaderboard") || 20);
        }, 1000);

        return () => clearInterval(interval);
    }, [tournamentId]);

    const sortedPlayers = Object.values(leaderboard)
        .filter((p) => p !== null && p.playedMatches >= 1)
        .sort((a, b) => (b.wins !== a.wins ? b.wins - a.wins : b.playedMatches - a.playedMatches))
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
            <img src={logo} alt="Tournament Logo" className="logo" />
            <div>
                <h1>Leaderboard</h1>
                {tournamentId && !tournament && <p id="error">Nothing to be found here yet. Are you early? Are you using the right link?</p>}
                <div className="leaderboard-tables">{tables}</div>
            </div>
        </div>
    );
};

export default Leaderboard;
