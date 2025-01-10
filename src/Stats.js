import React from 'react';
import Collapsible from 'react-collapsible';

class Stats extends React.Component {

    constructor(props) {
        super(props);
        this.state = {};
    }

    render() {
        const playerStats = this.props.playerStats ? this.props.playerStats : {};
        const importedPlayers = this.props.importedPlayers;
        const players = this.props.players.map((playing, index) =>
            <tr key={index}>
                <td>{index + 1}</td>
                <td>{importedPlayers[index + 1] && importedPlayers[index + 1].name}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].wins + playerStats[index + 1].losses + playerStats[index + 1].draws}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].wins}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].losses}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].draws}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].playedMatches}</td>
                <td>{playerStats[index + 1] && new Set(playerStats[index + 1].partners).size}</td>
                <td>{playerStats[index + 1] && new Set(playerStats[index + 1].opponents).size}</td>
                <td>{playerStats[index + 1] && new Set(playerStats[index + 1].opponents.concat(playerStats[index + 1].partners)).size}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].mixedMatches}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].mixedTeams}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].paradiseMixedDiff}</td>
                <td>{playerStats[index + 1] && playerStats[index + 1].results && JSON.stringify(playerStats[index + 1].results)}</td>
            </tr>
        );
        return (
            <Collapsible trigger="Player stats &#9660;" triggerWhenOpen="Player stats &#9650;" classParentString="col"
                         triggerClassName="playerStatsTrigger" triggerOpenedClassName="playerStatsTrigger">
                <table>
                    <thead>
                    <tr>
                        <th title="Player number">P</th>
                        <th title="Player name">Name</th>
                        <th title="Total matches">M</th>
                        <th title="Wins">W</th>
                        <th title="Losses">L</th>
                        <th title="Draws">D</th>
                        <th title="Matches played">m</th>
                        <th title="Number of different partners">p</th>
                        <th title="Number of different opponents">o</th>
                        <th title="Number of different partners and opponents">p+o</th>
                        <th title="Number of played mixed matches">mm</th>
                        <th title="Number of matches played in a mixed team">mt</th>
                        <th title="Total gender diff on court (Paradise)">gd</th>
                        <th>Results</th>
                    </tr>
                    </thead>
                    <tbody>
                    {players}
                    </tbody>
                </table>
            </Collapsible>
        )
    }
}

export default Stats;