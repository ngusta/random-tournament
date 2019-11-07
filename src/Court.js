import React from 'react';
import './Court.css';

class Court extends React.Component {
	render() {
		
		const teamRows = [];
		this.props.teams.forEach((team, teamIndex) => {
			const noPlayersRow1 = team.length === 6 ? 3 : 2;
			const noPlayersRow2 = team.length - noPlayersRow1;
			
			const noOfPlayersToFitClass = Math.max(noPlayersRow1, noPlayersRow2);
			const oneRowClass = noPlayersRow2 === 0 ? " oneRow" : "";
			let playersInRow = team.slice(0, noPlayersRow1).map((player) =>
				<div className={`player fit${noOfPlayersToFitClass} color${player % 10}`} key={player}>
					{player}
				</div>
			);
			teamRows.push(
				<div className={`team t${teamIndex} row0${oneRowClass}`} key={`${teamIndex} row0`}>
					{playersInRow}
				</div>
			);
			playersInRow = team.slice(noPlayersRow1, team.length).map((player, playerIndex) =>
				<div className={`player fit${noOfPlayersToFitClass} color${player % 10}`} key={player}>
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
				<h1 className="courtName">Bana {this.props.courtNumber}</h1>
				{teamRows}
			</div>
		)
	}
}

export default Court;