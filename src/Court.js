import React from 'react';
import './Court.css';

class Court extends React.Component {
	render() {
		const players = this.props.teams.map((team, teamIndex) =>
			team.map((player, playerIndex) =>
				<div className={`circle tot${team.length} t${teamIndex} p${playerIndex} color${Math.floor(player/10)}`} key={teamIndex + "" + playerIndex}>
					{player}
				</div>
			));
		return (
			<div className="court">
				{players}
				<h1 className="courtName">Bana {this.props.courtNumber}</h1>
			</div>
		)
	}
}

export default Court;