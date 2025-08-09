import { Routes, Route } from 'react-router';
import { useState } from 'react';
import './App.css'
import Home from './components/Home/Home';
import Modal from './components/Modal/Modal';

function App() {
  return (
    <div className="h-full flex flex-col ">
      <div className="p-5 mt-5 font-vintage text-8xl md:text-8xl flex justify-center drop-shadow-[0_0_10px_rgba(214,62,62,0.5)]">
        <h1 className="drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] ">Mónaco</h1>
      </div>

      <div className="flex-1 flex flex-col ">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>
    </div>
  );
}


export default App
