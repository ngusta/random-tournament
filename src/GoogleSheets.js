import React, {useState} from 'react';

const GoogleSheets = ({ setImportedPlayers, showLoadingSpinner }) => {
    const [sheetId, setSheetId] = useState('1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I');
    const [sheetRange, setSheetRange] = useState("'test'!A2:H");
    const [error, setError] = useState(null);

    const handleImportData = (e) => {
        e.preventDefault();
        showLoadingSpinner(true);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetRange}?key=AIzaSyANb2sSxomytVZ7OSM5lVFas3HuAQj2mD8`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.values && data.values.length > 0) {
                    const playerData = data.values.map(player => {
                        if (player.length === 4 || player.length === 7) {
                            return {
                                active: player[0] !== "No" && player[0] !== "Nej" && player[0] !== false && player[0] !== "N",
                                id: player[1],
                                name: player[2] + ' ' + player[3],
                                gender: player[4] === 'Tjej' || player[4] === 'W' ? 'W' : 'M',
                                wins: player[5] ? Number(player[5]) : 0,
                                losses: player[6] ? Number(player[6]) : 0
                            };
                        }
                        return null;
                    }).filter(player => player !== null);

                    setImportedPlayers(playerData);
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
                <span className="labelDetails">https://docs.google.com/spreadsheets/d/<span
                    className="highlight">1uci8khgGfqnpKtkyQ4mSYIroeHmXfZd8ColINEwyP2I</span>/edit#gid=0</span>
            </label>
            <label>
                <span>Player Range:</span>
                <input type="text" value={sheetRange} onChange={(e) => setSheetRange(e.target.value)}/>
                <span className="labelDetails">Sheet with seven columns in this order: Active (Yes|No), Player number, First name, Last name, Gender (Tjej|Kille|W|M), Wins, Losses. <br />The sheet needs "Anyone with the link can view" access.</span>
            </label>
            {error && <p>{error}</p>}
            <button onClick={handleImportData}>Import Data</button>
        </div>
    );
}

export default GoogleSheets;