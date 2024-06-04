import React from 'react'

interface Props {
    value: boolean;
    onChange: () => void;
    isDarkMode: boolean;
    disabled?: boolean;
    className?: string;
}

function Checkbox({ value, onChange, isDarkMode, disabled, className }: Props) {
    return (
        <span className={'custom-checkbox-container'}>
            <input type='checkbox' checked={value} onChange={onChange} className={className ?? 'custom-checkbox'} />
        </span>
    )
}

export default Checkbox