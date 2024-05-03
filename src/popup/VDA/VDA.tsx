import React, { useState } from 'react'
import Uik from '@reef-chain/ui-kit'
import "./index.css";
import Tokens from '../Tokens/Tokens';
import NFTs from '../NFTs/NFTs';

function VDA() {
    const [tab, setTab] = useState("tokens")
    return (
        <>
            <Uik.Tabs
                value={tab}
                onChange={value => setTab(value)}
                options={[
                    { value: 'tokens', text: 'Tokens' },
                    { value: 'nfts', text: 'NFTs' },
                ]}
            />
            {tab == 'tokens' && <Tokens />}
            {tab == 'nfts' && <NFTs />}
        </>
    )
}

export default VDA