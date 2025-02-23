import React from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const PlayerViewPrint = () => {
    const { tournamentId } = useParams();
    const baseUrl = window.location.origin;
    const playerViewUrl = `${baseUrl}/playerView/${tournamentId}`;

    return (
        <div style={{textAlign: 'center', padding: '20px'}}>
            <h2>Today's Tournament</h2>
            <p><strong>Scan QR to see your games and report results</strong></p>

            <QRCodeCanvas value={playerViewUrl} size={150}/>

            <p>{playerViewUrl}</p>
        </div>
    );
};

export default PlayerViewPrint;
