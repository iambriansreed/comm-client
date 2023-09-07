import Footer from './Footer';
import { LoadingIcon } from '../icons';
import useMountEffect from '../hooks/useMountEffect';
import { useState } from 'react';
import clsx from '../clsx';

export default function Connecting() {
    const [loaded, setLoaded] = useState(false);

    useMountEffect(() => {
        setTimeout(() => setLoaded(true), 1000);
    });

    return (
        <>
            <main className={clsx('relative z-30', !loaded && 'opacity-0')}>
                <h2 className="mb-5">Connecting</h2>
                <div className="spinner">
                    <LoadingIcon />
                </div>
            </main>
            <Footer />
        </>
    );
}
