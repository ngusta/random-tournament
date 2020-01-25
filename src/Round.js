import React from 'react';
import Court from './Court';
import ls from 'local-storage';
import deleteIcon from './img/delete.png';
import emptyStar from './img/star_empty.png';
import filledStar from './img/star_filled.png';

class Round extends React.Component {

    static createRound(allAvailablePlayers, noCourts, teamsPerCourt, playersPerTeam, useAllPlayers,
                       onError, dryRun, earlierRounds, importedPlayers) {
        const startTime = performance.now();

        const lastPlayerInPreviousRound = isNaN(ls.get("lastPlayerInPreviousRound")) ? 0 : ls.get("lastPlayerInPreviousRound");
        let players = [...allAvailablePlayers.filter(player => player > lastPlayerInPreviousRound), ...allAvailablePlayers.filter(player => player <= lastPlayerInPreviousRound)];
        if (!useAllPlayers) {
            let useableCourts = noCourts;
            while (players.length < 4 * useableCourts) {
                useableCourts--;
            }
            players.splice(useableCourts * teamsPerCourt * playersPerTeam);
        }

        if (!dryRun) {
            ls.set("lastPlayerInPreviousRound", players[players.length - 1]);
        }

        const error = Round.validateInput(players, noCourts, teamsPerCourt, playersPerTeam);
        if (error) {
            onError(error);
            return;
        }

        let bestRound = [];
        let bestPoints = Number.MAX_SAFE_INTEGER;
        let diff1 = 0;
        let diff10 = 0;
        let diff50 = 0;
        let diff100 = 0;
        let diff300 = 0;
        let diff500 = 0;
        let diff1000 = 0;
        let diff10000 = 0;
        const noTries = dryRun ? 1 : 10000;
        let nextPlayer = 0;
        let totalPoints = 0;
        const allPoints = [];
        let foundStopValue = false;
        for (let i = 0; i < noTries; i++) {
            if (!dryRun) {
                Round.shuffle(players);
            }

            const round = [];
            nextPlayer = 0;
            nextPlayer = Round.addTwoTeamsOfTwoPlayers(nextPlayer, noCourts, players, round);
            nextPlayer = Round.addExtraTeams(nextPlayer, noCourts, teamsPerCourt, players, round);
            nextPlayer = Round.addExtraPlayersInTeams(nextPlayer, noCourts, teamsPerCourt, players, round, useAllPlayers, playersPerTeam);

            const points = dryRun ? 0 : Round.evaulateRound(round, importedPlayers);

            if (points < bestPoints) {
                bestPoints = points;
                bestRound = round;
            }
            if (i === 1) {
                diff1 = bestPoints;
            }
            if (i === 9) {
                diff10 = bestPoints;
            }
            if (i === 49) {
                diff50 = bestPoints;
            }
            if (i === 99) {
                diff100 = bestPoints;
            }
            if (i === 299) {
                diff300 = bestPoints;
            }
            if (i === 499) {
                diff500 = bestPoints;
            }
            if (i === 999) {
                diff1000 = bestPoints;
            }
            if (i === 9999) {
                diff10000 = bestPoints;
            }
            totalPoints += points;
            allPoints.push(points);
            if (!foundStopValue && i > 500) {
                const mean = totalPoints / (i + 1);
                const stdDev = Math.sqrt((1 / i) * allPoints.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0));

                const stopAtPoints = (mean - 3 * stdDev) < 0 ? 0 : (mean - 3 * stdDev);
                if (bestPoints <= stopAtPoints) {
                    console.log("Stopping at: " + bestPoints + " (i=" + (i + 1) + ") with mean/StdDev: " + Math.round(mean) + "/" + Math.round(stdDev));
                    foundStopValue = true;
                    break;

                }
            }
            if (bestPoints === 0) {
                break;
            }
        }
        const mean = totalPoints / allPoints.length;
        const stdDev = Math.sqrt((1 / (allPoints.length - 1)) * allPoints.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0));
        !dryRun && console.log("Final mean/StdDev: " + Math.round(mean) + "/" + Math.round(stdDev));
        //console.log(allPoints.join(","));
        !dryRun && console.log("Best after 1, 10, 50, 100, 300, 500, 1000, 10000, best");
        !dryRun && console.log(diff1 + ", " + diff10 + ", " + diff50 + ", " + diff100 + ", " + diff300 + ", " + diff500 + ", " + diff1000 + ", " + diff10000 + ", " + bestPoints);
        if (!dryRun) {
            Round.updatePlayerStats(bestRound);
            const stopTime = performance.now();
            console.log("CreateRound took " + Math.round(stopTime - startTime) + " ms.");
        }
        return bestRound;
    }

    static shuffle(a) {
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    static validateInput(players, noCourts, teamsPerCourt, playersPerTeam) {
        if (players.length < 4) {
            return "noPlayers - Min: 4, Was: " + players.length;
        }

        if (noCourts < 1 || noCourts > 20) {
            return "noCourts - Min: 1, Max: 20, Was: " + noCourts;
        }

        if (teamsPerCourt < 2 || teamsPerCourt > 4) {
            return "teamsPerCourt - Min: 2, Max: 4, Was: " + teamsPerCourt;
        }

        if (playersPerTeam < 2 || playersPerTeam > 10) {
            return "playersPerTeam - Min: 2, Max: 10, Was: " + playersPerTeam;
        }
        return;
    }

    static addTwoTeamsOfTwoPlayers(nextPlayer, noCourts, players, round) {
        for (let c = 0; c < noCourts; c++) {
            const court = [];
            if (nextPlayer + 3 < players.length) {
                for (let t = 0; t < 2; t++) {
                    const team = players.slice(nextPlayer, nextPlayer + 2);
                    court.push(team);
                    nextPlayer += 2
                }
                round.push(court)
            }
        }
        return nextPlayer;
    }

    static addExtraTeams(nextPlayer, noCourts, teamsPerCourt, players, round) {
        if (teamsPerCourt > 2 && (nextPlayer + 1) < players.length) {
            let court = 0;
            while ((nextPlayer + 1) < players.length && round[court].length < teamsPerCourt) {
                const team = players.slice(nextPlayer, nextPlayer + 2);
                round[court].push(team);
                nextPlayer += 2;
                court = (court + 1) % noCourts;
            }
        }
        return nextPlayer;
    }

    static addExtraPlayersInTeams(nextPlayer, noCourts, teamsPerCourt, players, round, useAllPlayers, playersPerTeam) {
        let court = 0;
        let team = 0;
        while (nextPlayer < players.length) {
            if (!useAllPlayers && round[court][team].length === playersPerTeam) {
                nextPlayer++;
                continue;
            }
            round[court][team] = [...round[court][team], players[nextPlayer]];

            if (team === teamsPerCourt - 1 || round[court].length === team + 1) {
                team = 0;
                court = (court + 1) % Math.min(noCourts, round.length);
            } else {
                team++;
            }
            nextPlayer++;
        }
        return nextPlayer;
    }

    static evaulateRound(round, importedPlayers) {
        const playerStats = ls.get("playerStats") || {};
        let points = 0;
        for (let c = 0; c < round.length; c++) {
            for (let t = 0; t < round[c].length; t++) {
                for (let p = 0; p < round[c][t].length; p++) {
                    const player = round[c][t][p];
                    const partners = Round.partners(round, c, t, p);
                    if (playerStats[player]) {
                        const opponents = Round.opponents(round, c, t);
                        //Played with partner
                        partners.forEach((partner) => points += 4 * Round.countOccurences(partner, playerStats[player].partners));
                        //points += partners.map((partner) => 4*Round.countOccurences(partner, playerStats[player].partners)).reduce((a, b) => a + b));
                        //Played against partner
                        partners.forEach((partner) => points += 1 * Round.countOccurences(partner, playerStats[player].opponents));
                        //Played with opponent
                        opponents.forEach((opponent) => points += 1 * Round.countOccurences(opponent, playerStats[player].partners));
                        //Played against opponent
                        opponents.forEach((opponent) => points += 1 * Round.countOccurences(opponent, playerStats[player].opponents));
                        //Played on the same court
                        points += 1 * Round.countOccurences(c, playerStats[player].courts);

                    }
                    //Partner of same gender
                    if (partners.length === 1 && p === 0
                        && importedPlayers[player] && importedPlayers[partners[0]]
                        && importedPlayers[player].gender !== "U" && importedPlayers[partners[0]].gender !== "U"
                        && importedPlayers[player].gender === importedPlayers[partners[0]].gender) {
                        points += 2;
                    }
                }
            }
        }
        return points;
    }

    static countOccurences(item, list) {
        const index = list.indexOf(item);
        if (index === -1) {
            return 0;
        }
        return list.lastIndexOf(item) - list.indexOf(item) + 1;
    }

    static partners(round, c, t, p) {
        const team = [...round[c][t]];
        team.splice(p, 1);
        return team;
    }

    static opponents(round, c, t) {
        const opponentsTeams = Array.from({length: round[c].length}, (v, k) => k);
        opponentsTeams.splice(t, 1);
        let opponents = [];
        opponentsTeams.forEach((opponentsTeam) => {
            opponents = [...opponents, ...round[c][opponentsTeam]]
        });
        return opponents
    }

    static updatePlayerStats(round) {
        const playerStats = ls.get("playerStats") || {};
        for (let c = 0; c < round.length; c++) {
            for (let t = 0; t < round[c].length; t++) {
                for (let p = 0; p < round[c][t].length; p++) {
                    const player = round[c][t][p];
                    if (!playerStats[player]) {
                        playerStats[player] = {partners: [], opponents: [], courts: []};
                    }
                    const newPartners = Round.partners(round, c, t, p);
                    playerStats[player].partners = [...playerStats[player].partners, ...newPartners].sort();

                    const newOpponents = Round.opponents(round, c, t);
                    playerStats[player].opponents = [...playerStats[player].opponents, ...newOpponents].sort();

                    playerStats[player].courts.push(c);
                }
            }
        }
        ls.set("playerStats", playerStats);
    }

    static getPlayersOfRound(round) {
        const players = [];
        round.map(court =>
            court.map(team =>
                team.map(player => players.push(player))
            )
        );
        players.sort(function (a, b) {
            return a - b
        });
        return players;
    }

    getRangeOfPlayers() {
        const players = Round.getPlayersOfRound(this.props.courts);
        const ranges = [];
        players.sort(function (a, b) {
            return a - b
        });
        let firstPlayerInRange = players[0];
        let previousPlayer = players[0];
        for (let i = 1; i < players.length; i++) {
            if ((players[i] - previousPlayer) > 1) {
                ranges.push([firstPlayerInRange, previousPlayer]);
                firstPlayerInRange = players[i];
            }
            if (i === (players.length - 1)) {
                ranges.push([firstPlayerInRange, players[i]]);
            }
            previousPlayer = players[i];
        }
        return ranges.map(range => range[0] === range[1] ? range[0] : range[0] + "-" + range[1]).join(", ");
    }

    getNoMixedTeams = () => {
        let noOfMixedTeams = 0;
        this.props.courts.forEach(court => {
            court.forEach(team => {
                if (team.length === 2) {
                    const p1 = team[0];
                    const p2 = team[1];
                    if (this.props.importedPlayers
                        && this.props.importedPlayers[p1] && this.props.importedPlayers[p2]) {
                        const playerIsWoman = this.props.importedPlayers[p1].gender === "W";
                        const playerIsMan = this.props.importedPlayers[p1].gender === "M";
                        const partnerIsWoman = this.props.importedPlayers[p2].gender === "W";
                        const partnerIsMan = this.props.importedPlayers[p2].gender === "M";
                        if ((playerIsWoman && partnerIsMan) || (playerIsMan && partnerIsWoman)) {
                            noOfMixedTeams++;
                        }
                    }
                }
            })
        });
        return noOfMixedTeams;
    };

    onDeleteRound = (e) => {
        this.props.onDeleteRound(this.props.roundIndex);
        e.preventDefault();
    };

    onShowOnPresentation = (e) => {
        e.preventDefault();
        this.props.onShowOnPresentation(this.props.roundIndex);
    };

    render() {
        const ranges = this.getRangeOfPlayers();
        const noMixedTeams = this.getNoMixedTeams();
        let courts = [];
        if (this.props.courts && this.props.showEigthCourts && this.props.courtsToUse && this.props.courts.length <= this.props.courtsToUse.length) {
            const courtsToUse = this.props.courtsToUse.sort();
            let nextCourtFromRound = 0;
            for (let court = 1; court <= 8; court++) {
                let teams = [];
                if (courtsToUse.indexOf(court) > -1 && nextCourtFromRound < this.props.courts.length) {
                    teams = this.props.courts[nextCourtFromRound++];
                }
                courts.push(<Court teams={teams} key={court} courtNumber={court} courtClass={this.props.courtClass}
                                   importedPlayers={this.props.importedPlayers}/>)
            }
        } else {
            courts = this.props.courts.map((teamsOnCourt, index) =>
                <Court teams={teamsOnCourt} key={index} courtNumber={index + 1} courtClass={this.props.courtClass}
                       importedPlayers={this.props.importedPlayers}/>
            );
        }

        const starImg = this.props.isShown ? filledStar : emptyStar;

        const presentationImg = <img className="star" alt="Present this round" src={starImg}
                                     onClick={e => this.props.onShowOnPresentation && this.onShowOnPresentation(e)}/>;

        const deleteImg = <img className="delete" alt="Delete this round" src={deleteIcon}
                               onClick={e => this.onDeleteRound(e)}/>;

        return (
            <div ref={this.props.reff} className={`round ${this.props.className}`}>
                {this.props.roundName &&
                <h1>
                    {this.props.onShowOnPresentation && presentationImg}
                    {this.props.roundName}
                    {this.props.onDeleteRound && deleteImg}
                </h1>
                }
                {ranges.length > 0 && <span className="ranges">{ranges} plays, {noMixedTeams} mixed teams</span>}
                <div className="courts">
                    {courts}
                </div>
            </div>
        );
    }
}

export default Round;