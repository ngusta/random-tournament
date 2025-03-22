import React, {useState} from 'react';

const GoogleSheets = ({setImportedPlayers, updateImportedPlayers, showLoadingSpinner}) => {
    const [sheetId, setSheetId] = useState('1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I');
    const [sheetRange, setSheetRange] = useState("'test'!A2:H");
    const [error, setError] = useState(null);
    const NUMBER_OF_COLUMNS = 6;
    const IMPORT_ALL = 1;
    const IMPORT_UPDATE_ONLY = 2;

    const handleImportData = (e, type) => {
        e.preventDefault();
        showLoadingSpinner(true);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?key=AIzaSyANb2sSxomytVZ7OSM5lVFas3HuAQj2mD8`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.values && data.values.length > 0) {
                    const playerData = data.values.map(player => {
                        if (player.length === NUMBER_OF_COLUMNS) {
                            //Keep same as Settings.emptyImportedPlayer
                            return {
                                active: player[0] !== "No" && player[0] !== "Nej" && player[0] !== false && player[0] !== "N",
                                id: player[1],
                                name: player[2] + ' ' + player[3],
                                displayName: player[4] ? player[4] : player[2] + ' ' + player[3],
                                gender: player[5] === 'Tjej' || player[5] === 'W' ? 'W' : 'M',
                            };
                        } else {
                            console.error(`Wrong number of columns in sheet. Expected ${NUMBER_OF_COLUMNS}, was: ${player.length}`);
                        }
                        return null;
                    }).filter(player => player !== null);

                    switch(type) {
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

    return (
        <div>
            <label>
                <span>Google Sheet ID:</span>
                <input type="text" value={sheetId} onChange={(e) => setSheetId(e.target.value)}/>
                <span className="labelDetails">Reference: <a rel="noreferrer" target="_blank" href="https://docs.google.com/spreadsheets/d/1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I/edit#gid=0">https://docs.google.com/spreadsheets/d/<span
                    className="highlight">1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I</span>/edit#gid=0</a></span>
            </label>
            <label>
                <span>Player Range:</span>
                <input type="text" value={sheetRange} onChange={(e) => setSheetRange(e.target.value)}/>
                <span className="labelDetails">Sheet with {NUMBER_OF_COLUMNS} columns in this order: Active (Yes|No), Player number, First name, Last name, Display Name, Gender (Tjej|Kille|W|M). <br/>The sheet needs "Anyone with the link can view" access.</span>
            </label>
            {error && <p>{error}</p>}
            <button onClick={(event) => handleImportData(event, IMPORT_ALL)}>Import All Data</button>
            <button onClick={(event) => handleImportData(event, IMPORT_UPDATE_ONLY)}>Import Only Display Name</button>
        </div>
    );
}

export default GoogleSheets;