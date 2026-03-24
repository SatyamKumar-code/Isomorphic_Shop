import React, { createContext } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';
import './App.css'
import Login from './pages/login'
import SingUp from './pages/singup'
import Home from './pages/home'

const MyContext = createContext();

const App = () => {

  const alertBox = (type, msg) => {
    if (type === "Success") {
      toast.success(msg)
    }
    if (type === "error") {
      toast.error(msg);
    }
  }

  const values = {
    alertBox
  }

  return (
    <>
      <BrowserRouter>
        <MyContext.Provider value={values}>
          <Routes>
            <Route path='/' exact={true} element={<Home />} />
            <Route path='/login' exact={true} element={<Login />} />
            <Route path='/register' exact={true} element={<SingUp />} />
          </Routes>
        </MyContext.Provider>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App
export { MyContext };
