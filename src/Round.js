import React from 'react';
import Court from './Court';
import ls from 'local-storage';
import deleteIcon from './img/delete.png';
import emptyStar from './img/star_empty.png';
import filledStar from './img/star_filled.png';

class Round extends React.Component {

    static createRound(allAvailablePlayers, noCourts, teamsPerCourt, playersPerTeam, useAllPlayers,
                       onError, dryRun, earlierRounds, importedPlayers, paradiseMode, paradisePlayersPerCourt) {
        const startTime = performance.now();

        const lastPlayerInRounds = ls.get("lastPlayerInRounds") ? ls.get("lastPlayerInRounds") : [];
        const lastPlayerInPreviousRound = lastPlayerInRounds.length > 0 ? lastPlayerInRounds[lastPlayerInRounds.length - 1] : 0;
        let players = [...allAvailablePlayers.filter(player => player > lastPlayerInPreviousRound), ...allAvailablePlayers.filter(player => player <= lastPlayerInPreviousRound)];

        if (!useAllPlayers) {
            let useableCourts = noCourts;
            while (players.length < (useableCourts * 2 * playersPerTeam)) {
                useableCourts--;
            }
            players.splice(useableCourts * (paradiseMode ? paradisePlayersPerCourt : teamsPerCourt * playersPerTeam));
        }

        if (!dryRun) {
            lastPlayerInRounds.push(players[players.length - 1]);
            ls.set("lastPlayerInRounds", lastPlayerInRounds);
        }

        const error = Round.validateInput(players, noCourts, teamsPerCourt, playersPerTeam, paradiseMode, paradisePlayersPerCourt);
        if (error) {
            onError(error);
            return;
        }

        let bestRound = [];
        let bestPoints = Number.MAX_SAFE_INTEGER;
        const noTries = dryRun ? 1 : 20000;
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
            if (paradiseMode) {
                //console.log("no courts: " + noCourts + " players per team: 2");
                nextPlayer = Round.addTwoTeamsOfMaximumTwoPlayers(nextPlayer, noCourts, players, round, 2);
                let playersStartingOutside = paradisePlayersPerCourt - 4;
                //console.log("Rounds after 2 teams");
                //console.log(structuredClone(round));
                //console.log("teams per court: 3, players outside: " + playersStartingOutside + ", useAllplayers: " + useAllPlayers);
                nextPlayer = Round.addExtraPlayersToOutsideTeams(nextPlayer, noCourts, players, round, useAllPlayers, playersStartingOutside);
                //console.log("Rounds after extra players & team");
                //console.log(structuredClone(round));
            } else {
                nextPlayer = Round.addTwoTeamsOfMaximumTwoPlayers(nextPlayer, noCourts, players, round, playersPerTeam);
                nextPlayer = Round.addExtraTeams(nextPlayer, noCourts, teamsPerCourt, players, round, playersPerTeam);
                nextPlayer = Round.addExtraPlayersInTeams(nextPlayer, noCourts, teamsPerCourt, players, round, useAllPlayers, playersPerTeam);
            }
            if (!dryRun) {
                //console.log("Round " + i);
                //Round.printRound(round);
            }

            const res = dryRun ? 0 : Round.evaluateRound(round, importedPlayers, paradiseMode);
            const points = dryRun ? 0 : res[0];
            const playerPoints = res[1];

            if (points < bestPoints) {
                bestPoints = points;
                bestRound = round;
                bestPlayers = players;
                if (!dryRun) {
                    console.log("New best " + points + " after " + i);
                }
            } else if (Math.random() * noTries < 10 * i) { // avoids getting stuck at a local minima
                players = bestPlayers;
            }
            if (i > 0 && i % 4000 === 0) {
                console.log("Shuffle!");
                players = Round.shuffle(players);
            }
            if (!dryRun) {
                if (Object.keys(playerPoints).length > 0) {
                    Round.swapTwo(players, playerPoints);
                } else {
                    Round.swapTwo(players, {0: players});
                }
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
        !dryRun && console.log("Final mean/StdDev: " + Math.round(mean) + "/" + Math.round(stdDev) + ". Best points: " + bestPoints);
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

    static swapTwo(players, playerPoints) {
        const highestPoints = Math.max(...Object.values(playerPoints).filter(value => !isNaN(value)));
        const playersWithHighestPoints = Object.keys(playerPoints).filter(key => playerPoints[key] === highestPoints).map(value => Number(value));
        const i = players.indexOf(playersWithHighestPoints[this.getRandomInteger(playersWithHighestPoints.length)]);
        let j = this.getRandomInteger(players.length);
        while (i === j) {
            j = this.getRandomInteger(players.length);
        }
        //console.log("Swapping: " + players[i] + " och " + players[j] + " (Högst poäng: " + highestPoints + ")");
        [players[i], players[j]] = [players[j], players[i]];
        return players;
    }

    static getRandomInteger(maxNumber) {
        return Math.floor(Math.random() * maxNumber);
    }

    static validateInput(players, noCourts, teamsPerCourt, playersPerTeam, paradiseMode, paradisePlayersPerCourt) {
        if (players.length < 4) {
            return "noPlayers - Min: 4, Was: " + players.length;
        }

        if (noCourts < 1 || noCourts > 20) {
            return "noCourts - Min: 1, Max: 20, Was: " + noCourts;
        }

        if (paradiseMode) {
            if (paradisePlayersPerCourt < 4 || paradisePlayersPerCourt > 12) {
                return "paradisePlayersPerCourt - Min: 4, Max: 12, Was: " + paradisePlayersPerCourt;
            }
        } else {
            if (teamsPerCourt < 2 || teamsPerCourt > 4) {
                return "teamsPerCourt - Min: 2, Max: 4, Was: " + teamsPerCourt;
            }

            if (playersPerTeam < 1 || playersPerTeam > 10) {
                return "playersPerTeam - Min: 2, Max: 10, Was: " + playersPerTeam;
            }
        }
    }

    static addTwoTeamsOfMaximumTwoPlayers(nextPlayer, noCourts, players, round, playersPerTeam) {
        let minimumPlayersPerTeam = Math.min(playersPerTeam, 2); //Handle playersPerTeam = 1
        for (let c = 0; c < noCourts; c++) {
            const court = [];
            if (nextPlayer + (2 * minimumPlayersPerTeam - 1) < players.length) {
                for (let t = 0; t < 2; t++) {
                    const team = players.slice(nextPlayer, nextPlayer + minimumPlayersPerTeam);
                    court.push(team);
                    nextPlayer += minimumPlayersPerTeam
                }
                round.push(court)
            }
        }
        return nextPlayer;
    }

    static addExtraTeams(nextPlayer, noCourts, teamsPerCourt, players, round, playersPerTeam) {
        let minimumPlayersPerTeam = Math.min(playersPerTeam, 2); //Handle playersPerTeam = 1
        if (teamsPerCourt > 2 && (nextPlayer + (minimumPlayersPerTeam - 1)) < players.length) {
            let court = 0;
            while ((nextPlayer + (minimumPlayersPerTeam - 1)) < players.length && round[court].length < teamsPerCourt) {
                const team = players.slice(nextPlayer, nextPlayer + minimumPlayersPerTeam);
                round[court].push(team);
                nextPlayer += minimumPlayersPerTeam;
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

    static addExtraPlayersToOutsideTeams(nextPlayer, noCourts, players, round, useAllPlayers, playersInOutsideTeams) {
        let court = 0;
        let outsideTeam = 2;
        while (nextPlayer < players.length) {
            if (!useAllPlayers && round[court].length === 3 && round[court][outsideTeam].length === playersInOutsideTeams) {
                nextPlayer++;
                break;
            }
            if (round[court].length === 2) { //Add outside team
                const team = players.slice(nextPlayer, nextPlayer + 1);
                round[court].push(team);
                nextPlayer++;
            } else { //Add player to outside team
                round[court][outsideTeam] = [...round[court][outsideTeam], players[nextPlayer]];
                nextPlayer++
            }

            court = (court + 1) % Math.min(noCourts, round.length);
        }
        return nextPlayer;
    }

    static evaluateRound(round, importedPlayers, paradiseMode) {
        const playerStats = ls.get("playerStats") || {};
        let points = 0;
        let scores = {};
        let allPlayerPoints = {};
        for (let c = 0; c < round.length; c++) {
            let totalMenOnCourt = 0;
            let totalWomenOnCourt = 0;

            let totalMixedTeamsOnCourt = 0;
            let totalNonMixedTeamsOnCourt = 0;

            let wins = [];

            const noWomenInTeams = new Array(round[c].length).fill(0);
            const noMenInTeams = new Array(round[c].length).fill(0);

            for (let t = 0; t < round[c].length; t++) {
                let noMenInTeam = 0;
                let noWomenInTeam = 0;
                for (let p = 0; p < round[c][t].length; p++) {
                    const player = round[c][t][p];
                    const partners = Round.partners(round, c, t, p);
                    if (playerStats[player]) {
                        const opponents = Round.opponents(round, c, t);
                        let playerPoints = 0;

                        const partnerFactor = paradiseMode ? 2 : 5;
                        const otherThenPartnerFactor = 2;

                        //Played with partner
                        partners.forEach((partner) => playerPoints += partnerFactor * Round.countOccurences(partner, playerStats[player].partners));
                        //points += partners.map((partner) => 4*Round.countOccurences(partner, playerStats[player].partners)).reduce((a, b) => a + b));
                        //Played against partner
                        partners.forEach((partner) => playerPoints += otherThenPartnerFactor * Round.countOccurences(partner, playerStats[player].opponents));
                        //Played with opponent
                        opponents.forEach((opponent) => playerPoints += otherThenPartnerFactor * Round.countOccurences(opponent, playerStats[player].partners));
                        //Played against opponent
                        opponents.forEach((opponent) => playerPoints += otherThenPartnerFactor * Round.countOccurences(opponent, playerStats[player].opponents));
                        //Played on the same court (People get sad when they end up on court 10 every game)
                        playerPoints += 1 * Round.countOccurences(c, playerStats[player].courts);

                        //console.log("Player points: " + playerPoints + " Points before: " + points);
                        points += playerPoints * playerPoints; // square it to spread the points out among players better!
                        if (playerPoints in scores) {
                            scores[playerPoints].push(player);
                        } else {
                            scores[playerPoints] = [player];
                        }
                        if (!allPlayerPoints[player]) {
                            allPlayerPoints[player] = 0;
                        }
                        allPlayerPoints[player] += playerPoints;
                    }
                    if (Round.isMan(importedPlayers, player)) {
                        noMenInTeam++;
                    }
                    if (Round.isWoman(importedPlayers, player)) {
                        noWomenInTeam++;
                    }
                    wins = [...wins, Round.getWins(importedPlayers, player)];
                }

                totalMenOnCourt += noMenInTeam;
                totalWomenOnCourt += noWomenInTeam;

                noMenInTeams[t] = noMenInTeam
                noWomenInTeams[t] = noWomenInTeam

                if (noMenInTeam > 0 && noWomenInTeam > 0) {
                    totalMixedTeamsOnCourt++;
                } else {
                    totalNonMixedTeamsOnCourt++;
                }
            }

            if (paradiseMode) {
                //Promote mixed courts
                let paradiseMixedPoints = 0;
                if ((totalMenOnCourt + totalWomenOnCourt) % 2 === 0) {
                    paradiseMixedPoints = Math.abs(totalMenOnCourt - totalWomenOnCourt) * 4;
                } else {
                    paradiseMixedPoints = (Math.abs(totalMenOnCourt - totalWomenOnCourt) - 1) * 4;
                }

                points += paradiseMixedPoints * paradiseMixedPoints;
                //Add mixed points to all players
                for (let t = 0; t < round[c].length; t++) {
                    for (let p = 0; p < round[c][t].length; p++) {
                        const player = round[c][t][p];
                        allPlayerPoints[player] += paradiseMixedPoints;
                    }
                }
            } else if (totalMenOnCourt > 0 && totalWomenOnCourt > 0) { //Only care if we have gender data
                let mixPoints = 0;
                //Avoid mixed teams playing non-mixed teams
                if (totalMixedTeamsOnCourt > 0 && totalNonMixedTeamsOnCourt > 0) {
                    mixPoints += round[c].length * 5;
                }
                //Avoid only women playing only men (Considering only the first two teams)
                if (round[c].length > 1 && ((noWomenInTeams[1] === 0 && noMenInTeams[0] === 0) || (noMenInTeams[1] === 0 && noWomenInTeams[0] === 0))) {
                    mixPoints += 8;
                }
                //Avoid non-mixed teams
                mixPoints += totalNonMixedTeamsOnCourt * 6;

                //console.log("Mix points: " + mixPoints + " Points before: " + points);
                points += mixPoints * mixPoints;
                //Add mixpoints to players in non-mixed-teams
                for (let t = 0; t < round[c].length; t++) {
                    if (noWomenInTeams[t] === 0 || noMenInTeams[t] === 0) {
                        for (let p = 0; p < round[c][t].length; p++) {
                            const player = round[c][t][p];
                            allPlayerPoints[player] += mixPoints;
                        }
                    }
                }
            }

            let diffInWinsPoints = (Math.max(...wins) - Math.min(...wins))*5;
            //console.log("Win points: " + diffInWinsPoints + " Points before: " + points);
            points += diffInWinsPoints * diffInWinsPoints;
            //Add win points to all players on court
            const mean = wins.reduce((sum, value) => sum + value, 0) / wins.length;
            for (let t = 0; t < round[c].length; t++) {
                for (let p = 0; p < round[c][t].length; p++) {
                    const player = round[c][t][p];
                    allPlayerPoints[player] += Math.abs(Round.getWins(importedPlayers, player) - mean)*5;
                }
            }
        }
        return [points, allPlayerPoints];
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

    static getWins(importedPlayers, player) {
        if (importedPlayers && importedPlayers[player] && importedPlayers[player].wins) {
            return importedPlayers[player].wins;
        }
        return 0;
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
            for (let t = 0; t < round[c].length; t++) {
                for (let p = 0; p < round[c][t].length; p++) {
                    const player = round[c][t][p];
                    if (!playerStats[player]) {
                        playerStats[player] = {
                            partners: [],
                            opponents: [],
                            courts: [],
                            playedMatches: 0,
                            mixedMatches: 0,
                            mixedTeams: 0,
                            paradiseMixedDiff: 0,
                            wins: 0,
                            losses: 0,
                            draws: 0
                        };
                    }
                }
            }
        }

        for (let c = 0; c < round.length; c++) {
            let noMenInLastTeam = 0;
            let noWomenInLastTeam = 0;

            let totalMenOnCourt = 0;
            let totalWomenOnCourt = 0;
            for (let t = 0; t < round[c].length; t++) {
                let noMenInTeam = 0;
                let noWomenInTeam = 0;
                for (let p = 0; p < round[c][t].length; p++) {
                    const player = round[c][t][p];

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

                    totalMenOnCourt += noMenInTeam;
                    totalWomenOnCourt += noWomenInTeam;

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

                if (t === (round[c].length - 1)) {
                    const mixedDiff = Math.abs(totalMenOnCourt - totalWomenOnCourt);
                    for (let t2 = 0; t2 < round[c].length; t2++) {
                        for (let p2 = 0; p2 < round[c][t2].length; p2++) {
                            playerStats[round[c][t2][p2]].paradiseMixedDiff += mixedDiff;
                        }
                    }
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

    static printRound(round, indent = '') {
        for (let c = 0; c < round.length; c++) {
            console.log("C " + c);
            for (let t = 0; t < round[c].length; t++) {
                console.log("  T " + t + ": " + round[c][t].join(" "));
            }
        }
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
        let courts = [];
        if (this.props.courts && this.props.showTenCourts && this.props.courtsToUse && this.props.courts.length <= this.props.courtsToUse.length) {
            const courtsToUse = this.props.courtsToUse.sort(function (a, b) {
                return a - b
            });
            let nextCourtFromRound = 0;
            for (let court = 1; court <= 10; court++) {
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
                {ranges.length > 0 && <span className="ranges">Plays: {ranges}</span>}
                <div className="courts">
                    {courts}
                </div>
            </div>
        );
    }
}

export default Round;