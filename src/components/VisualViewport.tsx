import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function VisualViewport() {
    const [updateCount, setUpdateCount] = useState(0);

    useEffect(() => {
        if (!window.visualViewport) return () => {};
        const onVisualViewportResize = () => setUpdateCount((p) => p + 1);
        window.visualViewport!.addEventListener('resize', onVisualViewportResize);
        return () => {
            window.visualViewport!.removeEventListener('resize', onVisualViewportResize);
        };
    }, [updateCount]);

    return (
        <>
            {createPortal(
                <style media="all">
                    {`:root {
                            --100vvh: ${window.visualViewport?.height || window.outerHeight}px;
                        }`}
                </style>,
                document.body
            )}
        </>
    );
}
