import { useState } from 'react';
import useMountEffect from '../hooks/useMountEffect';
import Footer from './Footer';
import { BurstIcon } from '../icons';

export default function Connecting() {
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
            <main className="relative z-30">
                <h2 className="mb-5">Connecting to Server</h2>
                <p>Try refreshing the page or wait another {seconds} and we'll automatically refresh.</p>
            </main>
            <div className="absolute z-10 opacity-10 w-full h-full overflow-hidden">
                <BurstIcon className="animate-pulse w-[150%]" />
            </div>
            <Footer />
        </>
    );
}
