import React, { createContext, useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast';
import './App.css'
import Login from './pages/login'
import SingUp from './pages/singup'
import Home from './pages/home'
import VerifyEmail from './pages/verifyEmail';
import { fetchDataFromApi } from './utils/api';
import Search from './pages/search';
import Profile from './pages/profile';
import ManageProfile from './pages/profileManage';
import Setting from './pages/setting';
import ProductDetails from './components/productDetails';
import Cart from './pages/cart';
import CheckOut from './pages/checkOut';
import Order from './pages/order';
import OrderDetails from './pages/orderDetails';
import OrderStatus from './pages/orderStatus';
import Products from './pages/products';
import Addresses from './pages/addresses';
import RefundAccounts from './pages/refundAccounts';

const MyContext = createContext();

const App = () => {

  const [userData, setUserData] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const alertBox = (type, msg) => {
    if (type === "Success") {
      toast.success(msg)
    }
    if (type === "error") {
      toast.error(msg);
    }
  }

  const checkUserLoggedIn = async () => {
    try {
      const res = await fetchDataFromApi("/api/user/userData");
      if (res?.error === false && res?.data) {
        setUserData(res.data);
        setIsLoggedIn(true);
      } else {
        setUserData(null);
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.log("Auth check error:", err);
      setUserData(null);
      setIsLoggedIn(false);
    } finally {
      setIsAuthReady(true);
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
    setIsLoggedIn,
    isAuthReady,
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
            <Route path='/addresses' exact={true} element={<Addresses />} />
            <Route path='/products' exact={true} element={<Products />} />
            <Route path='/profile' exact={true} element={<Profile />} />
            <Route path='/profile/manage' exact={true} element={<ManageProfile />} />
            <Route path='/setting' exact={true} element={<Setting />} />
            <Route path='/product/:id' exact={true} element={<ProductDetails />} />
            <Route path='/cart' exact={true} element={<Cart />} />
            <Route path='/checkout' exact={true} element={<CheckOut />} />
            <Route path='/orders' exact={true} element={<Order />} />
            <Route path='/order/:id' exact={true} element={<OrderDetails />} />
            <Route path='/order/:id/status' exact={true} element={<OrderStatus />} />
            <Route path='/refund-accounts' exact={true} element={<RefundAccounts />} />
          </Routes>
        </MyContext.Provider>
      </BrowserRouter>
      <Toaster />
    </>
  )
}

export default App
export { MyContext };
