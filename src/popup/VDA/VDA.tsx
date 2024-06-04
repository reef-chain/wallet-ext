import React, { useContext, useState } from 'react'
import Uik from '@reef-chain/ui-kit'
import "./index.css";
import Tokens from '../Tokens/Tokens';
import NFTs from '../NFTs/NFTs';
import { ActionContext } from '../contexts';
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

function VDA() {
    const [tab, setTab] = useState("tokens")
    const onAction = useContext(ActionContext);
    const { isDarkMode } = useTheme();

    return (
        <div className='p-2'>
            <FontAwesomeIcon
                className=" text-gray-500 absolute right-8 hover:text-gray-300 cursor-pointer"
                onClick={() => onAction("/")}
                icon={faCircleXmark as IconProp}
                size="lg"
            />
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