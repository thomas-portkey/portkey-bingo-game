import React, { useEffect, useState, useMemo, forwardRef } from 'react';
import { Input } from 'antd-mobile';

const InputComponent = (props: { value?: string; placeholder: string; onChange: (value: string) => void }, ref) => {
  const [inputValue, setInputValue] = useState<string>(props.value);
  useEffect(() => {
    console.log(props.value);
    if (inputValue !== props.value) {
      setInputValue(props.value);
    }
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
        onBlur={() => {
          const fixedString = Number(inputValue).toFixed(2);
          setInputValue(fixedString);
          props.onChange(fixedString);
        }}
      />
    );
  }, [inputValue]);
};

export default forwardRef(InputComponent);
