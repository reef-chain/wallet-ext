import React, { useContext, useState } from 'react'
import Uik from '@reef-chain/ui-kit'
import "./index.css";
import Tokens from '../Tokens/Tokens';
import NFTs from '../NFTs/NFTs';
import { ActionContext } from '../contexts';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

function VDA() {
    const [tab, setTab] = useState("tokens")
    const onAction = useContext(ActionContext);
    const { isDarkMode } = useTheme();

    return (
        <div className='p-2'>
            <Uik.Button icon={faCircleXmark} onClick={() => onAction("/")} className={`${isDarkMode ? 'dark-btn' : ""} cross-btn-tabs absolute right-10 `} />
            <Uik.Tabs
                className={`${isDarkMode ? 'uik-tabs--dark' : ''} `}
                value={tab}
                onChange={value => setTab(value)}
                options={[
                    { value: 'tokens', text: 'Tokens' },
                    { value: 'nfts', text: 'NFTs' },
                ]}
            />
            {tab == 'tokens' && <Tokens />}
            {tab == 'nfts' && <NFTs />}
        </div>
    )
}

export default VDA