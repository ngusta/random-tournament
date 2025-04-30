import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTournaments } from './api';
import './TournamentGroup.css';

const TournamentGroup = () => {
    const { groupId } = useParams();
    const [tournaments, setTournaments] = useState([]);

    useEffect(() => {
        const fetchTournaments = async () => {
            const allTournaments = await getTournaments();
            console.log(allTournaments);
            console.log(groupId);
            const filtered = allTournaments.filter(tournament => tournament.groupId === groupId);
            setTournaments(filtered);
        };
        fetchTournaments();
    }, [groupId]);

    return (
        <div id="tournamentGroup">
            <div className="tournament-container">
                <h2>Choose your tournament</h2>
                <ul>
                    {tournaments.map(tournament => (
                        <li key={tournament["tournament-id"]}>
                            <Link to={`/playerview/${tournament["tournament-id"]}`} className="tournament-link">
                                {tournament.tournamentName || 'Unnamed Tournament'}
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default TournamentGroup;
