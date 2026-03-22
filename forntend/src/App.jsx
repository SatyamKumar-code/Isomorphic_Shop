import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './pages/login'

const App = () => {
  return (
    
    <BrowserRouter>
    <Routes>
      <Route path='/login' exact={true} element={<Login />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
