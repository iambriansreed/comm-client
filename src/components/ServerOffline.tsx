import { useState } from 'react';
import useMountEffect from '../hooks/useMountEffect';
import Footer from './Footer';

export default function ServerOffline() {
    const [secondsTillRefresh, setSeconds] = useState(30);

    const seconds = secondsTillRefresh === 1 ? 'second' : `${secondsTillRefresh} seconds`;

    useMountEffect(() => {
        setInterval(() => {
            setSeconds((prev) => {
                if (prev < 2) {
                    document.location.reload();
                }
                return prev - 1;
            });
        }, 1000);
    });

    return (
        <>
            <main>
                <h1>Server Offline</h1>
                <p>Try refreshing the page or wait another {seconds} and we'll automatically refresh.</p>
            </main>
            <Footer />
        </>
    );
}
