import React from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const GroupPrint = () => {
    const { groupId } = useParams();
    const baseUrl = window.location.origin;
    const groupUrl = `${baseUrl}/group/${groupId}`;

    return (
        <div style={{textAlign: 'center', padding: '20px'}}>
            <h2>Today's Tournaments</h2>
            <p><strong>Scan QR to find your tournament, see your games and report results</strong></p>

            <QRCodeCanvas value={groupUrl} size={150}/>

            <p>{groupUrl}</p>
        </div>
    );
};

export default GroupPrint;
