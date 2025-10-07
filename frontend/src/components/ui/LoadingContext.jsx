import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { LinearProgress, Box } from '@mui/material';

const LoadingContext = createContext({
    start: () => { },
    stop: () => { },
    isLoading: false,
    pendingCount: 0,
});

export const LoadingProvider = ({ children }) => {
    const [pendingCount, setPendingCount] = useState(0);
    const [visible, setVisible] = useState(false);
    const hideTimerRef = useRef(null);

    const start = useCallback(() => {
        setPendingCount((c) => c + 1);
        setVisible(true);
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        setPendingCount((c) => {
            const next = Math.max(0, c - 1);
            if (next === 0) {
                // Prevent flicker for very short ops
                hideTimerRef.current = setTimeout(() => setVisible(false), 200);
            }
            return next;
        });
    }, []);

    const value = useMemo(
        () => ({ start, stop, isLoading: pendingCount > 0, pendingCount }),
        [start, stop, pendingCount]
    );

    return (
        <LoadingContext.Provider value={value}>
            {visible && (
                <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: (theme) => theme.zIndex.tooltip + 1 }}>
                    <LinearProgress />
                </Box>
            )}
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);


