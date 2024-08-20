import Uik from '@reef-chain/ui-kit'
import React from 'react'
import { useTheme } from '../popup/context/ThemeContext'

interface Props {
    text: string;
    className?: string;
}

function LightText({ text, className }: Props) {
    const { isDarkMode } = useTheme();
    return (
        <Uik.Text type="light" className={`${isDarkMode ? "text--dark-mode" : ""} ${className ?? ''}`} text={text} />
    )
}

export default LightText