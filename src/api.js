export async function getTournaments() {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner`, {
            method: 'GET',
            headers: getHeaders()
        });
        const tournaments = await response.json();
        console.log("Status: " + response.status);
        console.log("Fetched tournaments: " + JSON.stringify(tournaments));
        return tournaments;
    } catch (err) {
        console.error(err);
    }
}

export async function getTournament(tournamentId) {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner/${tournamentId}`, {
            method: 'GET',
            headers: getHeaders()
        });
        const tournament = await response.json();
        console.log("Status: " + response.status);
        console.log("Fetched tournament: " + JSON.stringify(tournament));
        return tournament;
    } catch (err) {
        console.error(err);
    }
}

export async function saveTournament(tournamentId, tournamentData) {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner/${tournamentId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(tournamentData)
        });
        console.log(`Saved tournament ${tournamentId} in cloud.`);
        return response;
    } catch (err) {
        console.error(err);
    }
}

function getHeaders() {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("x-api-key", '' + process.env.REACT_APP_API_KEY);
    return headers;
}

