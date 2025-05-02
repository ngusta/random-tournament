export async function getTournaments() {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner`, {
            method: 'GET',
            headers: getHeaders()
        });
        const tournaments = await response.json();
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
        checkStatus(response);
        const tournaments = await response.json();
        console.log("Fetched tournament: " + JSON.stringify(tournaments));
        return tournaments;
    } catch (err) {
        console.error(err);
        return null;
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

export async function deleteTournament(tournamentId) {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner/${tournamentId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        console.log("Deleted tournament " + tournamentId + " in cloud.");
        checkStatus(response);
        return response;
    } catch (err) {
        console.error(err);
    }
}

export async function getPlayers(tournamentId) {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner/${tournamentId}/player`, {
            method: 'GET',
            headers: getHeaders()
        });
        checkStatus(response);
        return await response.json();
    } catch (err) {
        if (!err.message.includes("404")) {
            console.error(err);
        }
        return null;
    }
}

export async function savePlayer(tournamentId, playerId, playerData) {
    try {
        if (!playerData.version) {
            console.error("Player " + playerId + " has no version. Cannot save to cloud.");
            return;
        }
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner/${tournamentId}/player/${playerId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(playerData)
        });
        console.log(`Saved player ${playerId} in cloud.`);
        return response;
    } catch (err) {
        console.error(err);
    }
}

export async function createPlayers(tournamentId, playerData) {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner/${tournamentId}/players`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(playerData)
        });
        console.log(`Saved new players in cloud.`);
        return response;
    } catch (err) {
        console.error(err);
    }
}

export async function savePlayers(tournamentId, playerData) {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner/${tournamentId}/players`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(playerData)
        });
        console.log(`Updated players in cloud.`);
        return response;
    } catch (err) {
        console.error(err);
    }
}

export async function getPlayer(tournamentId, playerId) {
    try {
        const response = await fetch(`https://ztx5ai37rj.execute-api.eu-north-1.amazonaws.com/prod/random-partner/${tournamentId}/player/${playerId}`, {
            method: 'GET',
            headers: getHeaders()
        });
        checkStatus(response);
        const player = await response.json();
        console.log("Fetched player " + playerId + ": " + JSON.stringify(player));
        return player;
    } catch (err) {
        console.error(err);
        return null;
    }
}

function checkStatus(response) {
    if (response.status !== 200) {
        throw new Error("Expected response 200, was " + response.status);
    }
}

function getHeaders() {
    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    headers.append("x-api-key", '' + process.env.REACT_APP_API_KEY);
    return headers;
}

