import React, { createContext, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';
import './App.css'
import Login from './pages/login'
import SingUp from './pages/singup'
import Home from './pages/home'
import VerifyEmail from './pages/verifyEmail';
import { fetchDataFromApi } from './utils/api';
import Footer from './components/footer';
import Search from './pages/search';
import Profile from './pages/profile';
import Setting from './pages/setting';
import ProductDetails from './components/productDetails';
import Cart from './pages/cart';

const MyContext = createContext();

const App = () => {

  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const alertBox = (type, msg) => {
    if (type === "Success") {
      toast.success(msg)
    }
    if (type === "error") {
      toast.error(msg);
    }
  }

  const checkUserLoggedIn = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setIsLoggedIn(false);
      return;
    }

    try {
      const res = await fetchDataFromApi("/api/user/userData");
      if (res?.error === false) {
        setUserData(res?.user);
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      setIsLoggedIn(false);
    }
  }

  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  const values = {
    alertBox,
    userData,
    setUserData,
    isLoggedIn,
    setIsLoggedIn
  }

  return (
    <>
      <BrowserRouter>
        <MyContext.Provider value={values}>
          <Routes>
            <Route path='/' exact={true} element={<Home />} />
            <Route path='/login' exact={true} element={<Login />} />
            <Route path='/register' exact={true} element={<SingUp />} />
            <Route path='/verify-email' exact={true} element={<VerifyEmail />} />
            <Route path='/search' exact={true} element={<Search />} />
            <Route path='/profile' exact={true} element={<Profile />} />
            <Route path='/setting' exact={true} element={<Setting />} />
            <Route path='/product/:id' exact={true} element={<ProductDetails />} />
            <Route path='/cart' exact={true} element={<Cart />} />
          </Routes>
        </MyContext.Provider>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App
export { MyContext };
