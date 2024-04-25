import Uik from '@reef-chain/ui-kit';
import React, { useState } from 'react';

interface Props {
    iconUrl: string;
    balance: string;
    name: string;
    id: string;
}

function NftContainer({ iconUrl, balance, name, id }: Props) {
    const [dropdownStatus, setDropdownStatus] = useState<boolean>(false);
    return (
        <div>
            <div className='nft-icon__container' onClick={() => setDropdownStatus(!dropdownStatus)}>
                <img src={iconUrl} alt="NFT icon" className='nft-icon' />
                <div className='nft-icon__balance'>{balance}</div>
            </div>
            {dropdownStatus && (
                <div className='nft-icon__container_dropdown'>
                    <div className='text-white'>{name}</div>
                    <div className=' nft-icon__container_info'>Balance : {balance}</div>
                    <div className='nft-icon__container_info'>NFT ID : {id}</div>
                </div>
            )}
        </div>
    );
}

export default NftContainer;
