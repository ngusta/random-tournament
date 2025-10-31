
export const createSwissTournament = (tournamentId, teams, courts) => {
    let seed = 1;
    const teamsDict = {};
    teams.forEach(players => {
        const id = players.join(" / ");
        teamsDict[id] = {
            players: players,
            id: id,
            seed: seed++,
            score: 0,
            opponents: [],
            hadBye: false,
            buchholz: 0,
        };
    });

    const swissTournament = {
        id: tournamentId,
        teams: teamsDict,
        courts: courts,
        pairings: []
    };
    return swissTournament;
}

export const createSwissRound = (swissTournament) => {
    const pairings = pairRound(swissTournament.teams);
    swissTournament.pairings.push(pairings);
}

export const registerSwissResults = (swissTournament, results) => {
    applyResults(swissTournament, results);
}

export const getStandings = (swissTournament) => {
    return standings(swissTournament.teams);
}

function pairRound(teams) {
    // Convert teams dict to array and sort by score descending, then seed ascending
    const pool = Object.values(teams).sort((a, b) => b.score - a.score || a.seed - b.seed);
    console.log("pool:", pool);
    const pairings = [];
    let bye = null;

    // Handle odd number: give bye
    if (pool.length % 2 === 1) {
        const chosen = pickBye(pool);
        if (!chosen) throw new Error("Hittar ingen giltig bye-kandidat.");
        chosen.hadBye = true;
        pairings.push({ home: chosen.id, away: null, bye: true });
        // Remove bye team from pool
        const idx = pool.findIndex(t => t.id === chosen.id);
        pool.splice(idx, 1);
    }

    // Greedy pairing with "float" to nearest score group
    const used = new Set();
    for (let i = 0; i < pool.length; i++) {
        const a = pool[i];
        if (used.has(a.id)) continue;

        // Candidates that haven't met a and aren't used
        const candidates = pool
            .filter(
                b =>
                    b.id !== a.id &&
                    !used.has(b.id) &&
                    !a.opponents.includes(b.id)
            )
            // sort by score difference min, then seed closest to a
            .sort((x, y) => {
                const dx = Math.abs(x.score - a.score);
                const dy = Math.abs(y.score - a.score);
                if (dx !== dy) return dx - dy;
                return Math.abs(x.seed - a.seed) - Math.abs(y.seed - a.seed);
            });

        const b = candidates[0];
        if (!b) {
            // If completely locked, allow a rematch as last resort (best match by seed)
            const fallback = pool
                .filter(b2 => b2.id !== a.id && !used.has(b2.id))
                .sort((x, y) => Math.abs(x.seed - a.seed) - Math.abs(y.seed - a.seed))[0];
            if (!fallback) throw new Error("Parning misslyckades.");
            pairings.push({ home: a.id, away: fallback.id, bye: false });
            
            if (!a.opponents.includes(fallback.id)) a.opponents.push(fallback.id);
            if (!fallback.opponents.includes(a.id)) fallback.opponents.push(a.id);
            used.add(a.id);
            used.add(fallback.id);
        } else {
            pairings.push({ home: a.id, away: b.id, bye: false });
            
            if (!a.opponents.includes(b.id)) a.opponents.push(b.id);
            if (!b.opponents.includes(a.id)) b.opponents.push(a.id);
            used.add(a.id);
            used.add(b.id);
        }
    }
    return pairings;
}

function pickBye(teams) {
    const candidates = teams
        .filter(t => !t.hadBye)
        .sort((a, b) =>
            a.score - b.score || b.seed - a.seed // least points, then worse seed
        );
    return candidates[0] || null;
}

// Register results for a round
// results: Array of {home, away, scoreHome, scoreAway}
// Scoring: win=1, draw=0.5, loss=0. Bye gives 1 point.
function applyResults(tournament, results) {
    const latestPairing = tournament.pairings[tournament.pairings.length - 1];

    // Bye matches: give 1 point
    for (const p of latestPairing) {
        if (p.bye) {
            tournament.teams[p.home].score += 1;
        }
    }

    // Regular matches
    for (const r of results) {
        const A = tournament.teams[r.home];
        const B = tournament.teams[r.away];
        if (!A || !B) continue;

        // Mark opponents for tiebreak
        if (!A.opponents.includes(B.id)) {
            A.opponents.push(B.id);
        }
        if (!B.opponents.includes(A.id)) {
            B.opponents.push(A.id);
        }

        if (r.scoreHome > r.scoreAway) {
            A.score += 1;
        } else if (r.scoreHome < r.scoreAway) {
            B.score += 1;
        } else {
            A.score += 0.5;
            B.score += 0.5;
        }
    }

    // Update Buchholz
    updateBuchholz(tournament.teams);
}

function updateBuchholz(teams) {
    for (const teamId in teams) {
        const team = teams[teamId];
        let sum = 0;
        for (const oid of team.opponents) {
            if (teams[oid]) {
                sum += teams[oid].score;
            }
        }
        team.buchholz = sum;
    }
}

// Standings sorted: score, Buchholz, seed
function standings(teams) {
    // Convert teams dict to array and sort
    const table = Object.values(teams).sort((a, b) =>
        b.score - a.score ||
        b.buchholz - a.buchholz ||
        a.seed - b.seed
    );
    return table.map(t => ({
        id: t.id,
        score: t.score,
        buchholz: +t.buchholz.toFixed(1),
        seed: t.seed,
        bye: t.hadBye,
    }));
}

// ---- Exempel: 31 lag, 5 ronder, slumpresultat ----
/*
(function demo() {
    const teams = makeTeams(31);
    const ROUNDS = 5;

    for (let r = 1; r <= ROUNDS; r++) {
        const pairings = pairRound(teams);

        // Skapa slumpade resultat (byt ut mot riktiga indata i skarpt läge)
        const results = pairings
            .filter(p => !p.bye)
            .map(p => {
                // 0=hemmavinst, 1=bortavinst, 2=oavgjort
                const outcome = Math.floor(Math.random() * 3);
                if (outcome === 0) return { home: p.home, away: p.away, scoreHome: 1, scoreAway: 0 };
                if (outcome === 1) return { home: p.home, away: p.away, scoreHome: 0, scoreAway: 1 };
                return { home: p.home, away: p.away, scoreHome: 1, scoreAway: 1 };
            });

        applyResults(teams, pairings, results);

        // Visa rondens parningar
        console.log(`Rond ${r}`);
        for (const p of pairings) {
            if (p.bye) console.log(`  ${p.home} har BYE (1 poäng)`);
            else console.log(`  ${p.home} vs ${p.away}`);
        }

        // Visa topp 8 efter ronden
        const top = standings(teams).slice(0, 8);
        console.log("Topp 8:", top.map(t => `${t.id} ${t.score}p (BH ${t.buchholz})`).join(" | "));
        console.log("");
    }

    // Slutställning
    console.log("Slutställning:");
    for (const t of standings(teams)) {
        console.log(`${t.id.padEnd(6)}  ${t.score}p  BH:${t.buchholz}  seed:${t.seed}${t.bye ? "  (bye)" : ""}`);
    }
})();
*/