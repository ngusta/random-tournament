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

        const lastPlayerInRounds = ls.get("lastPlayerInRounds") ? ls.get("lastPlayerInRounds") : [];
        const lastPlayerInPreviousRound = lastPlayerInRounds.length > 0 ? lastPlayerInRounds[lastPlayerInRounds.length - 1] : 0;
        let players = [...allAvailablePlayers.filter(player => player > lastPlayerInPreviousRound), ...allAvailablePlayers.filter(player => player <= lastPlayerInPreviousRound)];
        if (!useAllPlayers) {
            let useableCourts = noCourts;
            while (players.length < 4 * useableCourts) {
                useableCourts--;
            }
            players.splice(useableCourts * teamsPerCourt * playersPerTeam);
        }

        if (!dryRun) {
            lastPlayerInRounds.push(players[players.length - 1]);
            ls.set("lastPlayerInRounds", lastPlayerInRounds);
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
        if (!dryRun) {
            Round.shuffle(players);
            console.log("players: " + players);
        }
        let bestPlayers = players;
        for (let i = 0; i < noTries; i++) {

            const round = [];
            nextPlayer = 0;
            nextPlayer = Round.addTwoTeamsOfTwoPlayers(nextPlayer, noCourts, players, round);
            nextPlayer = Round.addExtraTeams(nextPlayer, noCourts, teamsPerCourt, players, round);
            nextPlayer = Round.addExtraPlayersInTeams(nextPlayer, noCourts, teamsPerCourt, players, round, useAllPlayers, playersPerTeam);

            const res = dryRun ? 0 : Round.evaluateRound(round, importedPlayers);
            const points = dryRun ? 0 : res[0];

            if (points < bestPoints) {
                bestPoints = points;
                bestRound = round;
                bestPlayers = players;
                if (!dryRun) {
                    console.log("new best " + points + " after " + i);
                    console.log(res[1]);
                }
            } else if (Math.random() * noTries < 10 * i) { // avoids getting stuck at a local minima
                players = bestPlayers;
            }
            if (!dryRun) {
                if (Object.keys(res[1]).length > 0) {
                    Round.swapTwo(players, res[1]);
                } else {
                    Round.swapTwo(players, {0: players});
                }
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
                if (0 && bestPoints <= stopAtPoints) {
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
        !dryRun && console.log("Best after 1, 10, 50, 100, 300, 500, 1000, 10000, best");
        !dryRun && console.log(diff1 + ", " + diff10 + ", " + diff50 + ", " + diff100 + ", " + diff300 + ", " + diff500 + ", " + diff1000 + ", " + diff10000 + ", " + bestPoints);
        if (!dryRun) {
            Round.updatePlayerStats(bestRound, importedPlayers);
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

    static swapTwo(a, scores) {
        const worst = Object.keys(scores).reduce(function (a, b) {
            return scores[a] > scores[b] ? a : b
        });
        const i = a.indexOf(scores[worst][Math.floor(Math.random() * scores[worst].length)]);
        let j = Math.floor(Math.random() * a.length);
        while (i === j) {
            j = Math.floor(Math.random() * a.length);
        }
        [a[i], a[j]] = [a[j], a[i]];
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

    static evaluateRound(round, importedPlayers) {
        const playerStats = ls.get("playerStats") || {};
        let points = 0;
        let scores = {};
        for (let c = 0; c < round.length; c++) {
            let noMenInLastTeam = 0;
            let noWomenInLastTeam = 0;
            for (let t = 0; t < round[c].length; t++) {
                let noMenInTeam = 0;
                let noWomenInTeam = 0;
                for (let p = 0; p < round[c][t].length; p++) {
                    const player = round[c][t][p];
                    const partners = Round.partners(round, c, t, p);
                    if (playerStats[player]) {
                        const opponents = Round.opponents(round, c, t);
                        let playerPoints = 0;
                        //Played with partner
                        partners.forEach((partner) => playerPoints += 5 * Round.countOccurences(partner, playerStats[player].partners));
                        //points += partners.map((partner) => 4*Round.countOccurences(partner, playerStats[player].partners)).reduce((a, b) => a + b));
                        //Played against partner
                        partners.forEach((partner) => playerPoints += 2 * Round.countOccurences(partner, playerStats[player].opponents));
                        //Played with opponent
                        opponents.forEach((opponent) => playerPoints += 2 * Round.countOccurences(opponent, playerStats[player].partners));
                        //Played against opponent
                        opponents.forEach((opponent) => playerPoints += 2 * Round.countOccurences(opponent, playerStats[player].opponents));
                        //Played on the same court (People get sad when they end on court 8 every game)
                        playerPoints += 1 * Round.countOccurences(c, playerStats[player].courts);

                        points += playerPoints * playerPoints; // square it to spread the points out among players better!
                        if (playerPoints in scores) {
                            scores[playerPoints].push(player);
                        } else {
                            scores[playerPoints] = [player];
                        }
                    }
                    if (Round.isMan(importedPlayers, player)) {
                        noMenInTeam++;
                    }
                    if (Round.isWoman(importedPlayers, player)) {
                        noWomenInTeam++;
                    }
                }

                //Avoid mixed teams playing non-mixed teams
                let mixPoints = 0;
                if (round[c].length === 2 && t === 1) {
                    const isThisAMixedTeam = noMenInTeam > 0 && noWomenInTeam > 0;
                    const isLastTeamAMixedTeam = noMenInLastTeam > 0 && noWomenInLastTeam > 0;
                    if (isThisAMixedTeam !== isLastTeamAMixedTeam) {
                        mixPoints += 4;
                    }
                    if ((noWomenInTeam === 0 && noMenInLastTeam === 0) || (noMenInTeam === 0 && noWomenInLastTeam === 0)) {
                        mixPoints += 8;
                    }
                }

                //Avoid non-mixed teams
                if (noMenInTeam === 0 || noWomenInTeam === 0) {
                    mixPoints += round[c][t].length * 6;
                }
                points += mixPoints * mixPoints; // square it to make it really rare!

                noMenInLastTeam = noMenInTeam;
                noWomenInLastTeam = noWomenInTeam;
            }
        }
        return [points, scores];
    }

    static isMan(importedPlayers, player) {
        return Round.getGender(importedPlayers, player) === "M"
    }

    static isWoman(importedPlayers, player) {
        return Round.getGender(importedPlayers, player) === "W"
    }

    static getGender(importedPlayers, player) {
        if (importedPlayers && importedPlayers[player] && importedPlayers[player].gender === "W") {
            return "W";
        }
        return "M";
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

    static updatePlayerStats(round, importedPlayers) {
        const playerStats = ls.get("playerStats") || {};
        for (let c = 0; c < round.length; c++) {
            let noMenInLastTeam = 0;
            let noWomenInLastTeam = 0;
            for (let t = 0; t < round[c].length; t++) {
                let noMenInTeam = 0;
                let noWomenInTeam = 0;
                for (let p = 0; p < round[c][t].length; p++) {
                    const player = round[c][t][p];
                    if (!playerStats[player]) {
                        playerStats[player] = {
                            partners: [],
                            opponents: [],
                            courts: [],
                            playedMatches: 0,
                            mixedMatches: 0,
                            mixedTeams: 0
                        };
                    }
                    const newPartners = Round.partners(round, c, t, p);
                    playerStats[player].partners = [...playerStats[player].partners, ...newPartners].sort();

                    const newOpponents = Round.opponents(round, c, t);
                    playerStats[player].opponents = [...playerStats[player].opponents, ...newOpponents].sort();

                    playerStats[player].courts.push(c);

                    playerStats[player].playedMatches++;

                    if (Round.isMan(importedPlayers, player)) {
                        noMenInTeam++;
                    }
                    if (Round.isWoman(importedPlayers, player)) {
                        noWomenInTeam++;
                    }

                }

                if (round[c].length === 2 && t === 1) {
                    const isThisAMixedTeam = noMenInTeam > 0 && noWomenInTeam > 0;
                    const isLastTeamAMixedTeam = noMenInLastTeam > 0 && noWomenInLastTeam > 0;
                    if (isThisAMixedTeam !== isLastTeamAMixedTeam) {
                        playerStats[round[c][t][0]].mixedMatches += 1;
                        playerStats[round[c][t][1]].mixedMatches += 1;
                        playerStats[round[c][t - 1][0]].mixedMatches += 1;
                        playerStats[round[c][t - 1][1]].mixedMatches += 1;
                    }
                }

                if (noMenInTeam > 0 && noWomenInTeam > 0) {
                    playerStats[round[c][t][0]].mixedTeams += 1;
                    playerStats[round[c][t][1]].mixedTeams += 1;
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
        let noMixedTeams = 0;
        this.props.courts.forEach(court => {
            court.forEach(team => {
                let noMenInTeam = 0;
                let noWomenInTeam = 0;
                team.forEach(player => {
                    if (Round.isWoman(this.props.importedPlayers, player)) {
                        noWomenInTeam++;
                    } else {
                        noMenInTeam++;
                    }
                });
                if (noMenInTeam > 0 && noWomenInTeam > 0) {
                    noMixedTeams++;
                }

            });
        });
        return noMixedTeams;
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
                if (teams.length > 0 || !this.props.hideUnusedCourts) {
                    courts.push(<Court teams={teams} key={court} courtNumber={court} courtClass={this.props.courtClass}
                                       importedPlayers={this.props.importedPlayers}/>)
                }
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