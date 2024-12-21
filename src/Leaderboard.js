import React from 'react';
import './Leaderboard.css';
import ls from 'local-storage'

class Leaderboard extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            playerStats: ls.get("playerStats") || []
        }
        setInterval(this.checkUpdate, 100);
    }

    checkUpdate = () => {
        if (ls.get("updatePresentation")) {
            ls.set("updatePresentation", false);
            this.setState({
                playerStats: ls.get("playerStats")
            });
        }
    }

    render() {
        const players = this.state.playerStats || [];
        const sortedPlayers = Object.values(players).filter(p => p !== null).sort((a, b) => {
            if (a.wins !== b.wins) {
                return b.wins - a.wins;
            }
            return a.losses - b.losses;
        });

        const playerTableRows = sortedPlayers.slice(0, 10).map((player, index) =>
            <tr key={index}>
                <td>{index+1}</td>
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
}

export default Leaderboard;