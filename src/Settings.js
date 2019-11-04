import React from 'react';

class Settings extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			collapse: false
		}
	}
	
	handleChange = (e) => {
		const value = e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value);
		this.props.onSettingChange(e.target.name, value);
	}
	
	addPlayer = (e) => {
		e.preventDefault();
		this.props.onSettingChange("noPlayers", this.props.players.length + 1);
	}
	
	removePlayer = (e) => {
		e.preventDefault();
		this.props.onSettingChange("noPlayers", this.props.players.length - 1);
	}
	
	handleSubmit = (e) => {
		this.props.onSubmit();
		e.preventDefault();
	}
	
	toggleCollapse = () => {
		this.setState({collapse: !this.state.collapse});
	}
	
	onPlayerCheckbox = (e) => {
		const playersCopy = [...this.props.players];
		playersCopy[e.target.name] = e.target.checked;
		this.props.onPlayersChange(playersCopy);
	}
	
	render() {
		const players = this.props.players.map((playing, index) =>
			<label key={index}>
				{index + 1}:
				<input type="checkbox" name={index} checked={playing} onChange={this.onPlayerCheckbox} />
			</label>
		);
		return (
			<div>
				<button onClick={e => this.toggleCollapse()}>Toggle settings</button>
				{!this.state.collapse &&
				<React.Fragment>
					<button onClick =
						{e =>
							window.confirm("Are you sure you want to delete all data about the tournament?") &&
							this.props.onResetState()
						}> 
						Clear data
					</button>
					<form onSubmit={this.handleSubmit}>
						<label>
							Number of courts:
							<input type="text" name="noCourts" value={this.props.noCourts === 0 ? "" : this.props.noCourts} onChange={this.handleChange} />
						</label>
						<br />
						<label>
							Number of teams per court:
							<input type="text" name="teamsPerCourt" value={this.props.teamsPerCourt === 0 ? "" : this.props.teamsPerCourt} onChange={this.handleChange}  />
						</label>
						<br />
						<label>
							Number of players:
							<input type="text" name="noPlayers" value={this.props.players.length === 0 ? "" : this.props.players.length} onChange={this.handleChange}  />
							<button onClick={e => this.addPlayer(e)}>+</button>
							<button onClick={e => this.removePlayer(e)}>-</button>
						</label>
						<br />
						<label>
							Use all players
							<input type="checkbox" name="useAllPlayers" checked={this.props.useAllPlayers} onChange={this.handleChange} />
						</label>
						<br />
						{!this.props.useAllPlayers && 
							<span>
								<label>
									Number of players per team:
									<input type="text" name="playersPerTeam" value={this.props.playersPerTeam === 0 ? "" : this.props.playersPerTeam} onChange={this.handleChange}  />
								</label>
								<br />
							</span>
						}
						Players
						<br />
						{players}
						<br />
						<input type="submit" value="Create new round" />
					</form>
				</React.Fragment>
				}
			</div>
		)
	}
}

export default Settings;
