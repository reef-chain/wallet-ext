import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface HideBalanceContextProps {
    isHidden: boolean;
    toggle: () => void;
}

const HideBalanceContext = createContext<HideBalanceContextProps | undefined>(undefined);

export const useHideBalance = (): HideBalanceContextProps => {
    const context = useContext(HideBalanceContext);
    if (!context) {
        throw new Error('useHideBalance must be used within a HideBalanceProvider');
    }
    return context;
};

interface HideBalanceProviderProps {
    children: ReactNode;
}

export const HideBalanceProvider: React.FC<HideBalanceProviderProps> = ({ children }) => {
    const [isHidden, setIsHidden] = useState(false);

    useEffect(() => {
        const fetchStoredTheme = () => {
            try {
                const storedTheme = localStorage.getItem("REEF_HIDDEN_BALANCE_IDENT");
                if (storedTheme) {
                    setIsHidden(JSON.parse(storedTheme).mode === true);
                } else {
                    setIsHidden(false);
                }
            } catch (error) {
                setIsHidden(false);
                console.error("Error fetching stored theme:", error);
            }
        };
        fetchStoredTheme();
    }, []);

    const toggle = () => {
        const newMode = !isHidden;
        setIsHidden(!isHidden);
        localStorage.setItem("REEF_HIDDEN_BALANCE_IDENT", JSON.stringify({ mode: newMode }));
    };

    return (
        <HideBalanceContext.Provider value={{ isHidden, toggle }}>
            {children}
        </HideBalanceContext.Provider>
    );
};
