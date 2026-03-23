import React from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './pages/login'
import SingUp from './pages/singup'
import Home from './pages/home'

const App = () => {
  return (
    
    <BrowserRouter>
    <Routes>
      <Route path='/' exact={true} element={<Home />} />
      <Route path='/login' exact={true} element={<Login />} />
      <Route path='/register' exact={true} element={<SingUp />} />
    </Routes>
    </BrowserRouter>
  )
}

export default App
