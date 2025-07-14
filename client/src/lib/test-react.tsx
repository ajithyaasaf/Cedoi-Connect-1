import { useState } from 'react';

export function TestComponent() {
  const [test, setTest] = useState('working');
  return <div>{test}</div>;
}