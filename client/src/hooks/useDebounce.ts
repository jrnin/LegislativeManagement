import { useState, useEffect } from 'react';

/**
 * Custom hook para adicionar debounce a um valor
 * @param value O valor a ser monitorado
 * @param delay Tempo de atraso em milissegundos
 * @returns O valor após o período de debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Atualiza o valor debouncedValue após o delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancela o timeout se o valor mudar (ou o componente for desmontado)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}