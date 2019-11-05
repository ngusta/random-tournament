import React from 'react';
import './App.css';
import Round from './Round';
import ls from 'local-storage'

class Presentation extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			rounds: ls.get("rounds") || []
		}
		setInterval(this.checkUpdate, 1000);
	}
	
	checkUpdate = () => {
		console.log("Checking. Update: " + ls.get("updatePresentation"));
		if (ls.get("updatePresentation")) {
			ls.set("updatePresentation", false);
			this.setState({rounds: ls.get("rounds") || []});
		}
	}
	
	render() {
		const noRounds = this.state.rounds.length;
		const nextRound = noRounds > 0 &&
			<Round courts={this.state.rounds[0]} roundName="Next round" />
				
		const currentRound = noRounds	 > 1 &&
			<Round courts={this.state.rounds[1]} roundName="Current round" />
		
		return (
			<div>
				{currentRound}
				{nextRound}
			</div>
		);
	}
}

export default Presentation;