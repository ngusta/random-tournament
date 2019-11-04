import React from 'react';
import './App.css';
import Settings from './Settings';
import Round from './Round';
import ls from 'local-storage'

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			noCourts: ls.get("noCourts") || 3,
			teamsPerCourt: ls.get("teamsPerCourt") || 2,
			playersPerTeam: ls.get("playersPerTeam") || 2,
			availablePlayers: ls.get("availablePlayers") || new Array(13).fill(true),
			useAllPlayers: ls.get("useAllPlayers") === null ? true : ls.get("useAllPlayers"),
			errors: ls.get("errors") || [],
			rounds: ls.get("rounds") || []
		}
		console.log("nu då?:" + this.state.availablePlayers.length);
	}
	
	onSettingChange = (name, value) => {
		if (name === "noPlayers") {
			if (value > 500) {
				return;
			}
			const commonNoPlayers = Math.min(Number(value), this.state.availablePlayers.length);
			let newAvailablePlayers = this.state.availablePlayers.slice(0, commonNoPlayers);
			if (value > this.state.availablePlayers.length) {
				const newElements = new Array(value - this.state.availablePlayers.length).fill(true);
				newAvailablePlayers = [...newAvailablePlayers, ...newElements];
			}
			this.setState({availablePlayers: newAvailablePlayers});
			ls.set("availablePlayers", newAvailablePlayers);
		} else {
			this.setState({[name]: value});
			ls.set(name, value);
		}
	}
	
	onPlayersChange = (newAvailablePlayers) => {
		this.setState({availablePlayers: newAvailablePlayers});
		ls.set("availablePlayers", newAvailablePlayers);
	}
	
	onDeleteRound = (roundIndex) => {
		const roundsCopy = [...this.state.rounds];
		roundsCopy.splice(roundIndex, 1);
		this.setState({rounds: roundsCopy});
		ls.set("rounds", roundsCopy);
	}
	
	onResetState = () => {
		ls.clear();
		this.setState({
			noCourts: 3,
			teamsPerCourt: 2,
			playersPerTeam: 2,
			availablePlayers: new Array(13).fill(true),
			useAllPlayers: true,
			errors: [],
			rounds: []
		});
	}
	
	draw = () => {
		this.setState({errors: []}, () => {
			ls.set("errors", []);
			const round = this.createRound();
			if (round) {
				const newRounds = [round, ...this.state.rounds]
				this.setState({rounds: newRounds});
				ls.set("rounds", newRounds);
			}
		});
	}
	
	createRound(dryRun = false) {
		return Round.createRound(
			this.getAllAvailablePlayers(),
			this.state.noCourts, 
			this.state.teamsPerCourt, 
			this.state.playersPerTeam,
			this.state.useAllPlayers,
			dryRun ? (error) => {} : this.logError,
			dryRun);
	}
	
	getAllAvailablePlayers() {
		let allAvailablePlayers = [];
		this.state.availablePlayers.forEach((checked, index) => {
			if (checked) {
				allAvailablePlayers.push(index + 1);
			}
		});
		return allAvailablePlayers;
	}
	
	logError = (message) => {
		const newErrors = [...this.state.errors, message];
		this.setState({errors: newErrors});
		ls.set("errors", newErrors);
	}
	
	render() {
		let dryRunRound;
		const dryRunRoundDraw = this.createRound(true);
		if (dryRunRoundDraw) {
			dryRunRound = <Round courts={dryRunRoundDraw} roundName="Example round" />;
		}
		const rounds = this.state.rounds.map((round, index) =>
			<Round courts={round} 
				key={index} 
				roundName={`Round ${this.state.rounds.length-index}`}
				roundIndex={index}
				onDeleteRound={this.onDeleteRound} />
		);
		const errors = this.state.errors.map((message, index) =>
			<li className="error" key={index}>{message}</li>
		);
		
		return (
			<div>
				<Settings noCourts={this.state.noCourts} 
					teamsPerCourt={this.state.teamsPerCourt} 
					playersPerTeam={this.state.playersPerTeam}
					useAllPlayers={this.state.useAllPlayers}
					players={this.state.availablePlayers}
					onSettingChange={this.onSettingChange}
					onPlayersChange={this.onPlayersChange}
					onSubmit={this.draw}
					onResetState={this.onResetState} />
				<ul>
					{errors}
				</ul>
				{dryRunRound}
				{!dryRunRound && <p>The example run couldn't be generated. Check your input values or try generate the round for more detailed errors.</p>}
				{rounds}
			</div>
		);
	}
}

export default App;
