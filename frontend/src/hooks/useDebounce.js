import { useState, useEffect } from 'react';

export default function useDebounce(value, delay) {
  // internal RAM block that actually gets returned to the UI
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}
