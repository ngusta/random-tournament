import React from 'react';

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
        var lastRoundCreatedSecondsDiff = Math.floor((Date.now() - this.props.lastRoundCreationDate) / 1000);
        const lastRoundCreatedMinDiff = Math.floor(lastRoundCreatedSecondsDiff / 60);
        lastRoundCreatedSecondsDiff -= lastRoundCreatedMinDiff * 60;
        if (lastRoundCreatedSecondsDiff <= 9) {
            lastRoundCreatedSecondsDiff = "0" + lastRoundCreatedSecondsDiff;
        }

        var secondLastRoundCreatedSecondsDiff = Math.floor((Date.now() - this.props.secondLastRoundCreationDate) / 1000);
        const secondLastRoundCreatedMinDiff = Math.floor(secondLastRoundCreatedSecondsDiff / 60);
        secondLastRoundCreatedSecondsDiff -= secondLastRoundCreatedMinDiff * 60;
        if (secondLastRoundCreatedSecondsDiff <= 9) {
            secondLastRoundCreatedSecondsDiff = "0" + secondLastRoundCreatedSecondsDiff;
        }
        return (
            <div>
                <p>
                    Second last round created <span
                    className="time">{secondLastRoundCreatedMinDiff}:{secondLastRoundCreatedSecondsDiff}</span> min ago.
                    <br/>
                    Last round created <span
                    className="time">{lastRoundCreatedMinDiff}:{lastRoundCreatedSecondsDiff}</span> min ago.
                </p>
            </div>
        );
    }
}

export default Timer;