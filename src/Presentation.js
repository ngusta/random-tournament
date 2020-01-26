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
			noRoundMessage: ls.get("noRoundMessage") || "",
			showRoundName: ls.get("showRoundName") || false,
			width: 0,
			height: 0,
			showEigthCourts: ls.get("showEigthCourts") || false,
			courtsToUse: ls.get("courtsToUse") || [1, 2, 3, 4, 5, 6, 7, 8]
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
					roundToShowIndex: presentationRoundIndex
				});
			} else {
				this.setState({
					roundToShowIndex: presentationRoundIndex,
					roundToShow: ls.get("rounds")[presentationRoundIndex]
				});
			}
			this.setState({noRoundMessage: ls.get("noRoundMessage")});
			this.setState({showRoundName: ls.get("showRoundName")});
			this.setState({showEigthCourts: ls.get("showEigthCourts")});
			this.setState({courtsToUse: ls.get("courtsToUse")});
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
		const noCourts = this.state.showEigthCourts ? 8 : this.state.roundToShow.length;
		const availableCourtWidths = [50, 100, 150, 200, 220, 300, 400, 500];
		const availableCourtHeights = [82, 166, 248, 332, 365, 498, 663, 830];

		let i = availableCourtWidths.length - 1;
		while (i > 0 && (availableCourtWidths[i] > (this.state.width / noCourts) || availableCourtHeights[i] > this.state.height)) {
			i--;
		}
		return "courtSize" + i;
	}

	render() {
		return (
			<div id="presentation">
				{!this.state.roundToShow && <p className="noRoundMessage">{this.state.noRoundMessage}</p>}
				{this.state.roundToShow &&
				<Round
					reff={this.containerRef}
					courts={this.state.roundToShow}
					courtClass={this.getCourtClass()}
					roundName={this.state.showRoundName && `Round ${this.state.roundToShowIndex + 1}`}
					showEigthCourts={this.state.showEigthCourts}
					courtsToUse={this.state.courtsToUse}
				/>
				}
			</div>
		);
	}
}

export default Presentation;