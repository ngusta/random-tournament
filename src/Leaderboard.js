import React, { useEffect, useState } from "react";
import "./Leaderboard.css";
import { useParams } from 'react-router-dom';
import ls from "local-storage";
import logo from './img/2025/BT-logga-med-vit-kant.webp';
import { getPlayers, getTournament } from "./api";
import { TOURNAMENT_TYPES } from "./App";
import { getStandings } from "./SwissTournament";

const Leaderboard = () => {
    const { tournamentId } = useParams();
    const [leaderboard, setLeaderboard] = useState([]);
    const [tournament, setTournament] = useState(null);
    const [noOnLeaderboard, setNoOnLeaderBoard] = useState(ls.get("noOnLeaderboard") || 20);
    const [tournamentType, setTournamentType] = useState(ls.get("tournamentType") || TOURNAMENT_TYPES.RANDOM);

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
        setTournamentType(tournament.tournamentType);
        const players = await getPlayers(tournamentId);

        switch (tournament.tournamentType) {
            case TOURNAMENT_TYPES.SWISS:
                const swissTournament = Object.values(tournament.swissTournaments)[0];
                setLeaderboard(getStandings(swissTournament).map(team => ({
                    id: team.id,
                    displayName: team.id,
                    primaryScore: team.score,
                    secondaryScore: team.buchholz
                })));
                break;
            default:
                setLeaderboard(players.map(player => ({
                    id: player.playerId,
                    displayName: player.displayName ? player.displayName : player.name,
                    primaryScore: Object.entries(player).filter(([key, value]) => !isNaN(key) && value.result === "W").length,
                    secondaryScore: Object.entries(player).filter(([key]) => !isNaN(key)).length
                })));
        }
    }

    useEffect(() => {
        if (tournamentId) {
            return;
        }
        const interval = setInterval(() => {
            
            switch (tournamentType) {
                case TOURNAMENT_TYPES.SWISS:
                    //TODO: Handle multiple tournaments
                    const swissTournament = Object.values(ls.get("swissTournaments"))[0];
                    setLeaderboard(getStandings(swissTournament).map(team => ({
                        id: team.id,
                        displayName: team.id,
                        primaryScore: team.score,
                        secondaryScore: team.buchholz
                    })));
                    break;
                default:
                    const playerStats = ls.get("playerStats");
                    setLeaderboard(Object.values(playerStats).filter(player => player !== null).map(player => ({
                        id: player.id,
                        displayName: player.displayName ? player.displayName : player.name,
                        primaryScore: player.wins,
                        secondaryScore: player.playedMatches
                    })));
            }
            setNoOnLeaderBoard(ls.get("noOnLeaderboard") || 20);
        }, 1000);

        return () => clearInterval(interval);
    }, [tournamentId]);

    const sortedLeaderboard = Object.values(leaderboard)
        .filter((p) => p !== null && p.secondaryScore >= 1)
        .sort((a, b) => (b.primaryScore !== a.primaryScore ? b.primaryScore - a.primaryScore : b.secondaryScore - a.secondaryScore))
        .slice(0, noOnLeaderboard);

    let rank = 1;
    let previousPrimaryScore = null;

    const generateTableRows = (participants, startRank) => {
        return participants.map((player, index) => {
            if (previousPrimaryScore !== null && player.primaryScore !== previousPrimaryScore) {
                rank = startRank + index;
            }

            previousPrimaryScore = player.primaryScore;

            return (
                <tr key={player.id || startRank + index}>
                    <td className="numeric">{rank}</td>
                    <td>{player.displayName || player.id}</td>
                    <td className="numeric">{player.secondaryScore}</td>
                    <td className="numeric">{player.primaryScore}</td>
                </tr>
            );
        });
    };

    const getPrimaryScoreHeader = () => {
        switch (tournamentType) {
            case TOURNAMENT_TYPES.SWISS:
                return "Wins";
            default:
                return "Wins";
        }
    }

    const getSecondaryScoreHeader = () => {
        switch (tournamentType) {
            case TOURNAMENT_TYPES.SWISS:
                return "Opponents' score";
            default:
                return "Rounds";
        }
    }

    const tables = [];
    for (let i = 0; i < sortedLeaderboard.length; i += 20) {
        const tableRows = generateTableRows(sortedLeaderboard.slice(i, i + 20), i + 1);
        tables.push(
            <table key={i}>
                <thead>
                    <tr>
                        <th title="Rank">Rank</th>
                        <th title="Name">Name</th>
                        <th title={getSecondaryScoreHeader()}>{getSecondaryScoreHeader()}</th>
                        <th title={getPrimaryScoreHeader()}>{getPrimaryScoreHeader()}</th>
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
                {tournamentId && !tournament && <p id="error">Nothing to be found here yet. Are you early? Are you using the correct link?</p>}
                <div className="leaderboard-tables">{tables}</div>
            </div>
        </div>
    );
};

export default Leaderboard;
