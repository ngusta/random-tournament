import React from 'react';
import './Presentation.css';
import Round from './Round';
import ls from 'local-storage'

class Presentation extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			rounds: ls.get("rounds") || [],
			width: 0, 
			height: 0
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
	
	componentDidMount() {
		this.updateWindowDimensions();
		window.addEventListener('resize', this.updateWindowDimensions);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateWindowDimensions);
	}

	updateWindowDimensions = () => {
		this.setState({ width: window.innerWidth, height: window.innerHeight });
	}
	
	getCourtClass() {
		if (this.state.rounds.length === 0) {
			return;
		}
		const noCourts = this.state.rounds[0].length;
		const availableCourtWidths =  [50,  100, 150, 200, 300, 400, 500,  600,  700,  800,  900,  1000];
		const availableCourtHeights = [103, 207, 311, 415, 623, 831, 1039, 1247, 1455, 1663, 1871, 2079];
		
		let i = availableCourtWidths.length - 1;
		while (i > 0 && (availableCourtWidths[i] > (this.state.width/noCourts) || availableCourtHeights[i] > this.state.height)) {
			i--;
		}
		return "courtSize" + i;
	}
	
	render() {
		
		const noRounds = this.state.rounds.length;
		const currentRound = noRounds > 0 &&
			<Round courts={this.state.rounds[0]} courtClass={this.getCourtClass()} />
			
		return (
			<div id="presentation">
				{currentRound}
			</div>
		);
	}
}

export default Presentation;