import React, { useEffect, useState, useMemo } from 'react';
import { Input } from 'antd-mobile';

const InputComponent = (props: { value?: string; placeholder: string; onChange: (value: string) => void }) => {
  const [inputValue, setInputValue] = useState<string>(props.value || '0');
  useEffect(() => {
    console.log(props.value);
    setInputValue(props.value);
  }, [props.value]);

  return useMemo(() => {
    return (
      <Input
        type="number"
        value={inputValue}
        placeholder={props.placeholder}
        onChange={(str) => {
          setInputValue(str);
          props.onChange(str);
        }}
      />
    );
  }, [inputValue]);
};

export default InputComponent;
