import React from 'react';
import Court from './Court';
import ls from 'local-storage';

class Round extends React.Component {
	
	static createRound(allAvailablePlayers, noCourts, teamsPerCourt, playersPerTeam, useAllPlayers, onError, dryRun, earlierRounds) {
		let players = [...allAvailablePlayers];
		if (!useAllPlayers) {
			players.splice(noCourts*teamsPerCourt*playersPerTeam);
		}
		
		const error = Round.validateInput(players, noCourts, teamsPerCourt, playersPerTeam);
		if (error) {
			onError(error);
			return;
		}
		
		let bestRound = [];
		let bestPoints = Number.MAX_SAFE_INTEGER;
		let worstPoints = 0;
		let diff10 = 0;
		let diff50 = 0;
		let diff100 = 0;
		let diff300 = 0;
		let diff500 = 0;
		const noTries = dryRun ? 1 : 200;
		for (let i = 0; i < noTries; i++) {
			if (!dryRun) {
				Round.shuffle(players);
			}
					
			const round = [];
			let nextPlayer = 0;
			nextPlayer = Round.addTwoTeamsOfTwoPlayers(nextPlayer, noCourts, players, round);
			nextPlayer = Round.addExtraTeams(nextPlayer, noCourts, teamsPerCourt, players, round);
			Round.addExtraPlayersInTeams(nextPlayer, noCourts, teamsPerCourt, players, round);
			
			const points = dryRun ? 0 : Round.evaulateRound(round);
			if (points < bestPoints) {
				bestPoints = points;
				bestRound = round;
			}
			if (points > worstPoints) {
				worstPoints = points;
			}
			if (i === 9) {
				diff10 = bestPoints;
			}
			if (i === 49) {
				diff50 = bestPoints;
			}
			if (i === 99) {
				diff100 = bestPoints;
			}
			if (i === 299) {
				diff300 = bestPoints;
			}
			if (i === 399) {
				diff500 = bestPoints;
			}
		}
		!dryRun && console.log("Diff 10, 50, 100, 300, 500, 1000: " + diff10 + ", " + diff50 + ", " + diff100 + ", " + diff300 + ", " + diff500 + ", " + bestPoints);
		if (!dryRun) {
			Round.updatePlayerStats(bestRound);
		}
		
		return bestRound;
	}
	
	static shuffle(a) {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}
	
	static validateInput(players, noCourts, teamsPerCourt, playersPerTeam) {
		if (players.length < 4) {	
			return "noPlayers - Min: 4, Was: " + players.length;
		}
		
		if (noCourts < 1 || noCourts > 20) {
			return "noCourts - Min: 1, Max: 20, Was: " + noCourts;
		}
		
		if (teamsPerCourt < 2 || teamsPerCourt > 4) {
			return "teamsPerCourt - Min: 2, Max: 4, Was: " + teamsPerCourt;
		}
			
		if (playersPerTeam < 2 || playersPerTeam > 6) {
			return "playersPerTeam - Min: 2, Max: 10, Was: " + playersPerTeam;
		}
		return;
	}
	
	static addTwoTeamsOfTwoPlayers(nextPlayer, noCourts, players, round) {
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
		return nextPlayer;
	}
	
	static addExtraTeams(nextPlayer, noCourts, teamsPerCourt, players, round) {
		if (teamsPerCourt > 2 && (nextPlayer + 1) < players.length) {
			let court = 0;
			while ((nextPlayer + 1) < players.length && round[court].length < teamsPerCourt) {
				const team = players.slice(nextPlayer, nextPlayer+2);
				round[court].push(team)
				nextPlayer += 2
				court = (court + 1) % noCourts;
			}
		}
		return nextPlayer;
	}
	
	static addExtraPlayersInTeams(nextPlayer, noCourts, teamsPerCourt, players, round) {
		let court = 0;
		let team = 0;
		for (let p = nextPlayer; p < players.length; p++) {
			round[court][team] = [...round[court][team], players[p]];
			
			if (team === teamsPerCourt - 1 || round[court].length === team + 1) {
				team = 0;
				court = (court + 1) % Math.min(noCourts, round.length);
			} else {
				team++;
			}
		}
	}
	
	static evaulateRound(round) {
		const playerStats = ls.get("playerStats") || {};
		let points = 0;
		for (let c = 0; c < round.length; c++) {
			for (let t = 0; t < round[c].length; t++) {
				for (let p = 0; p < round[c][t].length; p++) {
					const player = round[c][t][p];
					//console.log("eval player: " + player);
					//console.log(playerStats[player]);
					if (playerStats[player]) {
						const partners = Round.partners(round, c, t, p);
						//console.log("Partners: " + partners);
						const opponents = Round.opponents(round, c, t);
						//console.log("Opponents: " + opponents);
						//console.log("Points0: " + points);
						partners.forEach((partner) => points += 4*Round.countOccurences(partner, playerStats[player].partners));
						//console.log("Points1: " + points);
						partners.forEach((partner) => points += 1*Round.countOccurences(partner, playerStats[player].opponents));
						//console.log("Points2: " + points);
						opponents.forEach((opponent) => points += 1*Round.countOccurences(opponent, playerStats[player].partners));
						//console.log("Points3: " + points);
						opponents.forEach((opponent) => points += 1*Round.countOccurences(opponent, playerStats[player].opponents));
						//console.log("Points4: " + points);
					}
				}
			}
		}
		return points;
	}
	
	static countOccurences(item, list) {
		const index = list.indexOf(item);
		if (index === -1) {
			return 0;
		}
		return list.lastIndexOf(item) - list.indexOf(item) + 1;
	}
	
	static partners(round, c, t, p) {
		const team = [...round[c][t]];
		team.splice(p, 1);
		return team;
	}
	
	static opponents(round, c, t) {
		const opponentsTeams = Array.from({length: round[c].length}, (v,k) => k);
		opponentsTeams.splice(t, 1);
		let opponents = [];
		opponentsTeams.forEach((opponentsTeam) => {opponents = [...opponents, ...round[c][opponentsTeam]]});
		return opponents
	}
	
	static updatePlayerStats(round) {
		const playerStats = ls.get("playerStats") || {};
		for (let c = 0; c < round.length; c++) {
			for (let t = 0; t < round[c].length; t++) {
				for (let p = 0; p < round[c][t].length; p++) {
					const player = round[c][t][p];
					if (!playerStats[player]) {
						playerStats[player] = {partners: [], opponents: []};
					}
					const newPartners = Round.partners(round, c, t, p);
					playerStats[player].partners = [...playerStats[player].partners, ...newPartners].sort();
					
					const newOpponents = Round.opponents(round, c, t);
					playerStats[player].opponents = [...playerStats[player].opponents, ...newOpponents].sort();
				}
			}
		}
		console.log("eval 1");
		console.log(playerStats[1]);
		ls.set("playerStats", playerStats);
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