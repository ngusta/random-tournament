import React from 'react';
import './Presentation.css';
import Round from './Round';
import ls from 'local-storage'

class Presentation extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			roundToShow: null,
			previousRound: null,
			roundToShowIndex: ls.get("roundToShowIndex") || -1,
			noRoundMessage: ls.get("noRoundMessage") || "",
			showRoundName: ls.get("showRoundName") || false,
			showNowPlaying: ls.get("showNowPlaying") || false,
			width: 0,
			height: 0,
			showTenCourts: ls.get("showTenCourts") || false,
			hideUnusedCourts: ls.get("hideUnusedCourts") || true,
			courtsToUse: ls.get("courtsToUse") || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
			isLatestRoundStarted: ls.get("isLatestRoundStarted") || false
		};
		setInterval(this.checkUpdate, 100);
		this.containerRef = React.createRef();
	}

	checkUpdate = () => {
		const presentationRoundIndex = Number(ls.get("presentationRoundIndex") === null ? -1 : ls.get("presentationRoundIndex"));
		if (this.state.roundToShowIndex !== presentationRoundIndex || ls.get("updatePresentation")) {
			ls.set("updatePresentation", false);
			if (presentationRoundIndex === -1 || ls.get("rounds") === null || presentationRoundIndex >= ls.get("rounds").length) {
				this.setState({
					roundToShow: null,
					previousRound: null,
					roundToShowIndex: presentationRoundIndex
				});
			} else {
				this.setState({
					roundToShowIndex: presentationRoundIndex,
					roundToShow: ls.get("rounds")[presentationRoundIndex],
					previousRound: presentationRoundIndex > 0 ? ls.get("rounds")[presentationRoundIndex-1] : null
				});
			}
			this.setState({noRoundMessage: ls.get("noRoundMessage")});
			this.setState({showRoundName: ls.get("showRoundName")});
			this.setState({showNowPlaying: ls.get("showNowPlaying")});
			this.setState({showTenCourts: ls.get("showTenCourts")});
			this.setState({hideUnusedCourts: ls.get("hideUnusedCourts")});
			this.setState({courtsToUse: ls.get("courtsToUse")});
 			this.setState({isLatestRoundStarted: ls.get("isLatestRoundStarted")});
		}
	};

	componentDidMount() {
		this.updateWindowDimensions();
		window.addEventListener('resize', this.updateWindowDimensions);
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this.updateWindowDimensions);
	}

	updateWindowDimensions = () => {
		if (this.containerRef.current) {
			const boundingClient = this.containerRef.current.getBoundingClientRect();
			this.setState({width: boundingClient.width, height: boundingClient.height});
		} else {
			this.setState({width: window.innerWidth, height: window.innerHeight});
		}
	};

	getCourtClass() {
		if (!this.state.roundToShow) {
			return;
		}
		const noCourts = Math.max(this.state.courtsToUse.length, this.state.roundToShow.length); //TODO: Consider showTenCourts and/or hideUnsuedCourts here
		console.log(this.state.courtsToUse.length);
		const availableCourtWidths = [50, 100, 150, 200, 220, 300, 400, 500, 600];
		const availableCourtHeights = [82, 166, 248, 332, 365, 498, 663, 830, 945];

		let i = availableCourtWidths.length - 1;
		while (i > 0 && (availableCourtWidths[i] > (this.state.width / noCourts) || availableCourtHeights[i] > this.state.height)) {
			i--;
		}
		return "courtSize" + i;
	}

	render() {
		return (
			<div id="presentation">
				<div id="currentRound">
					{!this.state.roundToShow && <p className="noRoundMessage">{this.state.noRoundMessage}</p>}
					{this.state.roundToShow &&
					<Round
						reff={this.containerRef}
						courts={this.state.roundToShow}
						courtClass={this.getCourtClass()}
						roundName={this.state.showRoundName && `Round ${this.state.roundToShowIndex + 1}`}
						showTenCourts={this.state.showTenCourts}
						hideUnusedCourts={this.state.hideUnusedCourts}
						courtsToUse={this.state.courtsToUse}
					/>
					}
				</div>
				{this.state.showNowPlaying && this.state.previousRound && !this.state.isLatestRoundStarted &&
					<span id="previousRoundLabel">Now playing</span>
				}
				<div id="previousRound">
					{this.state.showNowPlaying && this.state.previousRound && !this.state.isLatestRoundStarted &&
					<Round
						courts={this.state.previousRound}
						courtClass="courtSize1"
						roundName=""
						showTenCourts={this.state.showTenCourts}
						hideUnusedCourts={this.state.hideUnusedCourts}
						courtsToUse={this.state.courtsToUse}
					/>
				}
				</div>
			</div>
		);
	}
}

export default Presentation;