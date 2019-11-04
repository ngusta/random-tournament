import React from 'react';
import Court from './Court';

class Round extends React.Component {
	
	static createRound(allAvailablePlayers, noCourts, teamsPerCourt, playersPerTeam, useAllPlayers, onError, dryRun) {
		const round = [];
		let players = [...allAvailablePlayers];
		if (!useAllPlayers) {
			players.splice(noCourts*teamsPerCourt*playersPerTeam);
		}
		
		if (!dryRun) {
			Round.shuffle(players);
		}
		
		if (players.length < 4) {
			onError("noPlayers - Min: 4, Was: " + players.length);
			return;
		}
		
		if (noCourts <= 0 && noCourts > 20) {
			onError("noCourts - Min: 0, Max: 20, Was: " + noCourts);
			return;
		}
		
		if (teamsPerCourt < 2 && teamsPerCourt > 4) {
			onError("teamsPerCourt - Min: 2, Max: 4, Was: " + teamsPerCourt);
			return;
		}
		
		if (playersPerTeam < 2 && playersPerTeam > 6) {
			onError("playersPerTeam - Min: 2, Max: 10, Was: " + playersPerTeam);
			return;
		}
		
		//Add 2 teams with 2 players to all courts
		let nextPlayer = 0;
		for (let c = 0; c < noCourts; c++) {
			const court = []
			if (nextPlayer + 3 < players.length) {
				for (let t = 0; t < 2; t++) {
					const team = players.slice(nextPlayer, nextPlayer+2);
					court.push(team)
					nextPlayer += 2
				}
				round.push(court)
			}
		}
		
		//Add teams according to playersPerTeam
		if (teamsPerCourt > 2 && (nextPlayer + 1) < players.length) {
			let court = 0;
			while ((nextPlayer + 1) < players.length && round[court].length < teamsPerCourt) {
				const team = players.slice(nextPlayer, nextPlayer+2);
				round[court].push(team)
				nextPlayer += 2
				court = (court + 1) % noCourts;
			}
		}
		
		//Add players to teams according to playersPerTeam
		let court = 0;
		let team = 0;
		for (let p = nextPlayer; p < players.length; p++) {
			console.log(round.length);
			console.log("Court: " + court);
			console.log("Team: " + team);
			round[court][team] = [...round[court][team], players[p]];
			
			if (team === teamsPerCourt - 1 || round[court].length === team + 1) {
				team = 0;
				court = (court + 1) % Math.min(noCourts, round.length);
			} else {
				team++;
			}
		}
		return round;
	}
	
	static shuffle(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
	
	onDeleteRound = (e) => {
		this.props.onDeleteRound(this.props.roundIndex);
		e.preventDefault();
	}
	
	render() {
		const courts = this.props.courts.map((team, index) =>
			<Court teams={team} key={index} courtNumber={index+1} />
		);
	
		return (
			<div className="round">
				<h1>{this.props.roundName}</h1>
				{
					this.props.onDeleteRound && 
					<button className="delete-round-button" onClick =
						{e =>
							window.confirm("Are you sure you want to delete this round?") &&
							this.onDeleteRound(e)
						}> 
						Delete round
					</button>
				}
				{courts}
			</div>
		);
	}
}

export default Round;