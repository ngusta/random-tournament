import React from 'react';
import './App.css';
import Settings from './Settings';
import Round from './Round';
import ls from 'local-storage'

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			noCourts: ls.get("noCourts") || 8,
			teamsPerCourt: ls.get("teamsPerCourt") || 2,
			playersPerTeam: ls.get("playersPerTeam") || 2,
			availablePlayers: ls.get("availablePlayers") || new Array(99).fill(true),
			useAllPlayers: ls.get("useAllPlayers") === null ? false : ls.get("useAllPlayers"),
			errors: ls.get("errors") || [],
			rounds: ls.get("rounds") || [],
			presentationRoundIndex: ls.get("presentationRoundIndex") || -1,
			autoPresentNewRound: ls.get("autoPresentNewRound") || true,
			showEigthCourts: ls.get("showEigthCourts") || false,
			courtsToUse: ls.get("courtsToUse") || [1,2,3,4,5,6,7,8],
			importedPlayers: ls.get("importedPlayers") || [],
			lastRoundCreationDate: ls.get("lastRoundCreationDate") || null
		};
		ls.set("updatePresentation", true);
	}

	onSettingChange = (name, value) => {
		if (name === "noPlayers") {
			if (value > 300) {
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
			if (name === "showEigthCourts") {
				ls.set("courtsToUse", this.state.courtsToUse);
				ls.set("updatePresentation", true);
			}
		}
	};
	
	onPlayersChange = (newAvailablePlayers) => {
		this.setState({availablePlayers: newAvailablePlayers});
		ls.set("availablePlayers", newAvailablePlayers);
	};
	
	onCourtsToUseChange = (e) => {
		const courtsToUseCopy = [...this.state.courtsToUse];
		const courtName = Number(e.target.name);
		if (e.target.checked && courtsToUseCopy.indexOf(e.target.name) === -1) {
			courtsToUseCopy.push(courtName);
		} else if (!e.target.checked && courtsToUseCopy.indexOf(courtName) > -1) {
			courtsToUseCopy.splice(courtsToUseCopy.indexOf(courtName), 1);
		}
		this.setState({courtsToUse: courtsToUseCopy});
		ls.set("courtsToUse", courtsToUseCopy);
		ls.set("updatePresentation", true);
	};
	
	onDeleteRound = (roundIndex) => {
		const roundsCopy = [...this.state.rounds];
		roundsCopy.splice(roundIndex, 1);
		let pressIndex = this.state.presentationRoundIndex;
		if (pressIndex >= roundsCopy.length) {
			pressIndex = pressIndex >= 0 ? pressIndex - 1 : -1;
		}
		this.setState({rounds: roundsCopy, presentationRoundIndex: pressIndex});
		ls.set("updatePresentation", true);
		ls.set("rounds", roundsCopy);
		ls.set("presentationRoundIndex", pressIndex);
		
		ls.set("playerStats", {});
		roundsCopy.forEach(round => Round.updatePlayerStats(round));

	};
	
	onShowOnPresentation = (roundIndex) => {
		if (this.state.presentationRoundIndex === roundIndex) {
			roundIndex = -1;
		}
		this.setState({presentationRoundIndex: roundIndex});
		ls.set("presentationRoundIndex", roundIndex);
	};
	
	onResetState = () => {
		ls.clear();
		window.location.reload();
	};
	
	onAutoPresentNewRoundChange = (value) => {
		this.setState({autoPresentNewRound: value});
	};
	
	draw = () => {
		this.setState({errors: []}, () => {
			ls.set("errors", []);
			const round = this.createRound();
			if (round) {
				const newRounds = [...this.state.rounds, round];
				let pressIndex = this.state.presentationRoundIndex;
				if (this.state.autoPresentNewRound) {
					pressIndex = newRounds.length-1;
				}
				
				this.setState({rounds: newRounds, presentationRoundIndex: pressIndex});
				ls.set("rounds", newRounds);
				ls.set("presentationRoundIndex", pressIndex);

				const created = Date.now();
				this.setState({lastRoundCreationDate: created});
				ls.set("lastRoundCreationDate", created);
			}
		});
	};

	createRound(dryRun = false) {
		return Round.createRound(
			this.getAllAvailablePlayers(),
			this.state.noCourts,
			this.state.teamsPerCourt,
			this.state.playersPerTeam,
			this.state.useAllPlayers,
			dryRun ? (error) => {
			} : this.logError,
			dryRun,
			this.state.rounds,
			this.state.importedPlayers
		);
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
	};
	
	setImportedPlayers = (importedPlayers) => {
		this.setState({importedPlayers: importedPlayers});
		ls.set("importedPlayers", importedPlayers);
	};

	render() {
		let dryRunRound;
		const dryRunRoundDraw = this.createRound(true);
		if (dryRunRoundDraw) {
			dryRunRound = <Round 
				courts={dryRunRoundDraw} 
				roundName="Example round" 
				courtClass="courtSize3" 
				className="dryRun" 
				showEigthCourts={this.state.showEigthCourts}
				courtsToUse={this.state.courtsToUse}
				importedPlayers={this.state.importedPlayers} />;
		}
		
		const rounds = [];
		for (let index = this.state.rounds.length - 1; index >= 0; index--) {
			rounds.push(
				<Round courts={this.state.rounds[index]}
					key={index}
					roundName={`Round ${index + 1}`}
					roundIndex={index}
					onDeleteRound={this.onDeleteRound}
					onShowOnPresentation={this.onShowOnPresentation}
					isShown={this.state.presentationRoundIndex === index}
					courtClass="courtSize1"
					showEigthCourts={this.state.showEigthCourts}
					courtsToUse={this.state.courtsToUse}
					importedPlayers={this.state.importedPlayers} />
			);
		}
		
		const errors = this.state.errors.map((message, index) =>
			<li className="error" key={index}>{message}</li>
		);
		
		return (
			<div id="app">
				<div id="config">
					<Settings noCourts={this.state.noCourts}
							  teamsPerCourt={this.state.teamsPerCourt}
							  playersPerTeam={this.state.playersPerTeam}
							  useAllPlayers={this.state.useAllPlayers}
							  players={this.state.availablePlayers}
							  onSettingChange={this.onSettingChange}
							  onPlayersChange={this.onPlayersChange}
							  onSubmit={this.draw}
							  onResetState={this.onResetState}
							  autoPesentNewRound={this.state.autoPresentNewRound}
							  onAutoPresentNewRoundChange={this.onAutoPresentNewRoundChange}
							  showEigthCourts={this.state.showEigthCourts}
							  courtsToUse={this.state.courtsToUse}
							  onCourtsToUseChange={this.onCourtsToUseChange}
							  setImportedPlayers={this.setImportedPlayers}
							  importedPlayers={this.state.importedPlayers}
							  lastRoundCreationDate={this.state.lastRoundCreationDate}
						/>
					<ul className="clear">
						{errors}
					</ul>
				</div>
				<div>
					{dryRunRound}
					{!dryRunRound && <p className="exampleRoundError">The example run couldn't be generated. Check your input values or try generate the round for more detailed errors.</p>}
					{rounds}
				</div>
			</div>
		);
	}
}

export default App;
