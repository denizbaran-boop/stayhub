import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div style={{ padding: 40, textAlign: 'center' }}><h1>StayHub</h1><p>Find Your Perfect Stay</p></div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
