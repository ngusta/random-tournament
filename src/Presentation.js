import React from 'react';
import './Presentation.css';
import Round from './Round';
import ls from 'local-storage'

class Presentation extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			roundToShow: ls.get("roundToShow") || null,
			roundToShowIndex: ls.get("roundToShowIndex") || -1,
			width: 0,
			height: 0
		}
		console.log("rts: " + this.state.roundToShow);
		console.log("rtsi: " + this.state.roundToShowIndex);
		setInterval(this.checkUpdate, 1000);
	}
	
	checkUpdate = () => {
		console.log("rts: " + this.state.roundToShow);
		console.log("rtsi: " + this.state.roundToShowIndex);
		const presentationRoundIndex = ls.get("presentationRoundIndex");
		console.log("Checking. Round to show: " + presentationRoundIndex);
		if (this.state.roundToShowIndex != presentationRoundIndex || ls.get("updatePresentation")) {
			ls.set("updatePresentation", false);
			if (presentationRoundIndex === -1 || ls.get("rounds") === null || (presentationRoundIndex < 0 && presentationRoundIndex >= ls.get("rounds").length)) {
				this.setState({roundToShow: null});
			} else {
				this.setState({roundToShowIndex: presentationRoundIndex,
					roundToShow: ls.get("rounds")[presentationRoundIndex]});
			}
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
		if (!this.state.roundToShow) {
			return;
		}
		const noCourts = this.state.roundToShow.length;
		const availableCourtWidths =  [50,  100, 150, 200, 300, 400, 500,  600,  700,  800,  900,  1000];
		const availableCourtHeights = [103, 207, 311, 415, 623, 831, 1039, 1247, 1455, 1663, 1871, 2079];
		
		let i = availableCourtWidths.length - 1;
		while (i > 0 && (availableCourtWidths[i] > (this.state.width/noCourts) || availableCourtHeights[i] > this.state.height)) {
			i--;
		}
		return "courtSize" + i;
	}
	
	render() {
		const currentRound = this.state.roundToShow && this.state.roundToShowIndex > -1 &&
			<Round courts={this.state.roundToShow} courtClass={this.getCourtClass()} />
			
		return (
			<div id="presentation">
				{currentRound}
			</div>
		);
	}
}

export default Presentation;