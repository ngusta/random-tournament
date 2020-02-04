import React from 'react';
import dateFormat from 'dateformat';

class Timer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {seconds: 0};
    }

    tick() {
        this.setState(prevState => ({
            seconds: prevState.seconds + 1
        }));
    }

    componentDidMount() {
        this.interval = setInterval(() => this.tick(), 1000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    render() {
        const lastRoundCreated = dateFormat(this.props.lastRoundCreationDate, "HH:MM:ss");
        var lastRoundCreatedSecondsDiff = Math.floor((Date.now() - this.props.lastRoundCreationDate) / 1000);
        const lastRoundCreatedMinDiff = Math.floor(lastRoundCreatedSecondsDiff / 60);
        lastRoundCreatedSecondsDiff -= lastRoundCreatedMinDiff * 60;

        const secondLastRoundCreated = dateFormat(this.props.secondLastRoundCreationDate, "HH:MM:ss");
        var secondLastRoundCreatedSecondsDiff = Math.floor((Date.now() - this.props.secondLastRoundCreationDate) / 1000);
        const secondLastRoundCreatedMinDiff = Math.floor(secondLastRoundCreatedSecondsDiff / 60);
        secondLastRoundCreatedSecondsDiff -= secondLastRoundCreatedMinDiff * 60;
        return (
            <div>
                <p>
                    Second last round created {secondLastRoundCreated}.
                    ({secondLastRoundCreatedMinDiff} min {secondLastRoundCreatedSecondsDiff} s sedan)
                </p>
                <p>
                    Last round created {lastRoundCreated}.
                    ({lastRoundCreatedMinDiff} min {lastRoundCreatedSecondsDiff} s sedan)
                </p>
            </div>
        );
    }
}

export default Timer;