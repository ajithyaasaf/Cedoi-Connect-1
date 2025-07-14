import { useState } from 'react';

export default function Home() {
  const [message] = useState('Welcome to CEDOI Forum');
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>{message}</h1>
      <p>This is a simplified home page to test React functionality.</p>
    </div>
  );
}