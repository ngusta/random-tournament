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
        const roundCreated = dateFormat(this.props.lastRoundCreationDate, "HH:MM:ss");
        var roundCreatedSecondsDiff = Math.floor((Date.now() - this.props.lastRoundCreationDate) / 1000);
        const roundCreatedMinDiff = Math.floor(roundCreatedSecondsDiff / 60);
        roundCreatedSecondsDiff -= roundCreatedMinDiff * 60;
        return (
            <p>
                Last round created {roundCreated}. ({roundCreatedMinDiff} min {roundCreatedSecondsDiff} s sedan)
            </p>
        );
    }
}

export default Timer;