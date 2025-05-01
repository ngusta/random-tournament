import React, {useState} from 'react';

const GoogleSheets = ({setImportedPlayers, updateImportedPlayers, showLoadingSpinner, importNextRound}) => {
    const [sheetId, setSheetId] = useState('1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I');
    const [playersSheetRange, setPlayersSheetRange] = useState("'players'!A2:F");
    const [predefinedRoundSheetRange, setPredefinedRoundSheetRange] = useState("'start games'!B2:E");
    const [error, setError] = useState(null);
    const NUMBER_OF_COLUMNS = 6;
    const IMPORT_ALL = 1;
    const IMPORT_UPDATE_ONLY = 2;

    const handleImportPlayerData = (e, type) => {
        e.preventDefault();
        showLoadingSpinner(true);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${playersSheetRange}?key=AIzaSyANb2sSxomytVZ7OSM5lVFas3HuAQj2mD8`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.values && data.values.length > 0) {
                    const playerData = data.values.map(player => {
                        if (player.length === NUMBER_OF_COLUMNS) {
                            //Keep same as Settings.emptyImportedPlayer
                            return {
                                active: player[0] !== "No" && player[0] !== "Nej" && player[0] !== false && player[0] !== "N" && player[0] !== "",
                                id: player[1],
                                name: player[2] + ' ' + player[3],
                                displayName: player[4] ? player[4] : player[2] + ' ' + player[3],
                                gender: (player[5] === 'Tjej' || player[5] === 'W' || player[5] === 'Female' || player[5] === 'F' || player[5] === 'female') ? 'W' : 'M',
                            };
                        } else {
                            console.error(`Wrong number of columns in sheet. Expected ${NUMBER_OF_COLUMNS}, was: ${player.length}`);
                        }
                        return null;
                    }).filter(player => player !== null);

                    switch (type) {
                        case IMPORT_ALL:
                            setImportedPlayers(playerData);
                            break;
                        case IMPORT_UPDATE_ONLY:
                            updateImportedPlayers(playerData);
                            break;
                        default:
                            console.error("Invalid import type");
                            break;
                    }
                }
                showLoadingSpinner(false);
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                setError('Failed to load data.');
                showLoadingSpinner(false);
            });
    };

    const handleImportNextRound = (e) => {
        e.preventDefault();
        showLoadingSpinner(true);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${predefinedRoundSheetRange}?key=AIzaSyANb2sSxomytVZ7OSM5lVFas3HuAQj2mD8`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                importNextRound(data.values.map(row => row.map(Number)));
                showLoadingSpinner(false);
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                setError('Failed to load data.');
                showLoadingSpinner(false);
            });
    }

    return (
        <div>
            <label>
                <span>Google sheet id:</span>
                <input type="text" value={sheetId} onChange={(e) => setSheetId(e.target.value)}/>
                <span className="labelDetails">Reference: <a rel="noreferrer" target="_blank"
                                                             href="https://docs.google.com/spreadsheets/d/1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I/edit#gid=0">https://docs.google.com/spreadsheets/d/<span
                    className="highlight">1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I</span>/edit#gid=0</a><br/>The sheet needs "Anyone with the link can view" access.</span>
            </label>
            <label>
                <span>Player range:</span>
                <input type="text" value={playersSheetRange} onChange={(e) => setPlayersSheetRange(e.target.value)}/>
                <span className="labelDetails">Sheet with {NUMBER_OF_COLUMNS} columns in this order: Active (Yes|No), Player number, First name, Last name, Display Name, Gender (Tjej|Kille|W|M).</span>
            </label>
            <button className="import-button" onClick={(event) => handleImportPlayerData(event, IMPORT_ALL)}>Import player data</button>
            <button className="import-button" onClick={(event) => handleImportPlayerData(event, IMPORT_UPDATE_ONLY)}>Only import static data (Name, Alias, Gender)</button>
            <label>
                <span>Predefined round range:</span>
                <input type="text" value={predefinedRoundSheetRange} onChange={(e) => setPredefinedRoundSheetRange(e.target.value)}/>
                <span className="labelDetails">Sheet with players in columns and courts in rows.<br/>
                The first column should be the courts and remaining columns should be the players (No. of courts and Courts to use below will be updated).<br/>
                The tournament settings below will be ignored, the sheet is king.</span>
            </label>
            {error && <p>{error}</p>}
            <button className="import-button" onClick={(event) => handleImportNextRound(event)}>Create predefined round</button>
        </div>
    );
}

export default GoogleSheets;