import Uik from '@reef-chain/ui-kit'
import React from 'react'
import { useTheme } from '../popup/context/ThemeContext'

interface Props {
    text: string;
}

function LightText({ text }: Props) {
    const { isDarkMode } = useTheme();
    return (
        <Uik.Text type="light" className={`${isDarkMode ? "text--dark-mode" : ""}`} text={text} />
    )
}

export default LightText