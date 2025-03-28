import React from 'react';
import './Court.css';
import Round from './Round.js';

class Court extends React.Component {

    playerCssClasses = (player, noOfPlayersToFitClass) => {
        let classes = `player fit${noOfPlayersToFitClass} color${player % 10} digits${player ? player.toString().length : 0}`;
        classes += " gender" + Round.getGender(this.props.importedPlayers, player);
        if (this.props.playerStats && this.props.playerStats[player] && this.props.playerStats[player].results && this.props.playerStats[player].results[this.props.round]) {
            classes += " " + this.props.playerStats[player].results[this.props.round];
        }
        if (this.props.onPlayerClick) {
            classes += " clickable";
        }
        return classes
    }

    render() {
        const teamRows = [];
        this.props.teams.forEach((team, teamIndex) => {
            let noPlayersRow1 = 2;
            if (team.length > 3) {
                noPlayersRow1 = Math.floor(team.length / 2);
            }
            const noPlayersRow2 = team.length - noPlayersRow1;
            const noOfPlayersToFitClass = Math.max(noPlayersRow1, noPlayersRow2);
            const oneRowClass = noPlayersRow2 === 0 ? " oneRow" : "";
            let playersInRow = team.slice(0, noPlayersRow1).map((player) =>
                <div onClick={() => this.props.onPlayerClick && this.props.onPlayerClick(player, this.props.round)}
                    className={this.playerCssClasses(player, noOfPlayersToFitClass)}
                    key={player}>
                    {player}
                </div>
            );
            teamRows.push(
                <div className={`team t${teamIndex} row0${oneRowClass}`} key={`${teamIndex} row0`}>
                    {playersInRow}
                </div>
            );
            playersInRow = team.slice(noPlayersRow1, team.length).map((player) =>
                <div onClick={() => this.props.onPlayerClick && this.props.onPlayerClick(player, this.props.round)}
                    className={this.playerCssClasses(player, noOfPlayersToFitClass)}
                    key={player}>
                    {player}
                </div>
            );
            teamRows.push(
                <div className={`team t${teamIndex} row1`} key={`${teamIndex} row1`}>
                    {playersInRow}
                </div>
            );
        });
        return (
            <div className={`court ${this.props.courtClass}`}>
                <h1 className="courtName">{this.props.courtNumber}</h1>
                {teamRows}
            </div>
        )
    }
}

export default Court;