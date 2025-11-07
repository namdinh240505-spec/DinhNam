import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Contact from './pages/Contact'
import AccountPage from './pages/AccountPage'
import Booking from './pages/Booking'
import BookingDetail from "./pages/Bookingdetail"
import Booking1 from './pages/Booking1'
import Login from './pages/Login'
import TripReviews from './pages/TripReviews'
import BusNews from './pages/BusNews'
import PaymentMomo from './pages/PaymentMomo';
import PaymentResult from './pages/PaymentResult';
import SeatPickerPage from './pages/SeatPickerPage'
import Trips from './pages/Trips'
import Login1 from './pages/Login1'
import Register from './pages/Register' // Trang đăng ký
import NewsDetail from './pages/NewsDetail';
import RoundTrip from './pages/RoundTrip'

//trang admin
import AdminLayout from "@/components/AdminLayout";
//
import RoutesPage from "@/admin/routes/Routes";
//
import TripsPage from "@/admin/trips/Trips";
//
import BusesPage from "@/admin/busses/Buses";
//
import DriversPage from "@/admin/drivers/Drivers";
import BookingsPage from "@/admin/bookings/Bookings";
import CustomersPage from "@/admin/customers/Customers";
import EditCustomer from "@/admin/customers/Edit";
import DeleteCustomer from "@/admin/customers/Delete";
import Reports from "@/admin/reports/Reports";
import NewsPage from '@/admin/news/News';
function PrivateRoute({ children }) {
  return localStorage.getItem('auth_token') ? children : <Navigate to="/login" />
}

export default function App() {
  return (
      <Routes>
        <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/Trips" element={<Trips />} />
        <Route path="/TripReviews" element={<TripReviews />} />
        <Route path="/AccountPage" element={<AccountPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/BusNews" element={<BusNews />} />
        <Route path="/payment/momo" element={<PaymentMomo />} />
        <Route path="/payment/momo/result" element={<PaymentResult />} />
        <Route path="/SeatPickerPage" element={<SeatPickerPage />} />
        <Route path="/login1" element={<Login1 />} />
        <Route path="/Booking" element={<Booking />} />
        <Route path="/Booking1" element={<Booking1 />} />
        <Route path="/booking/detail/:code" element={<BookingDetail />} />
        <Route path="/trips/roundtrip" element={<RoundTrip/>} />
        <Route path="/Register" element={<Register />} /> {/* trang đăng ký */}
          <Route path="/news/:slug" element={<NewsDetail />} />  {/* chi tiết theo slug hoặc id */}
                </Route>
        {/* Trang admin */}
        <Route path="/admin" element={<AdminLayout />}>
        {/*Tuyến xe*/}
        <Route path="routes" element={<RoutesPage />} />
        <Route path="trips" element={<TripsPage />} />
        {/*Quản lý xe*/}
        <Route path="buses" element={<BusesPage />} />
        {/*Quản lý tài xế*/}
        <Route path="drivers" element={<DriversPage />} />
        {/*Quản lý vé xe*/}
        <Route path="bookings" element={<BookingsPage />} />
        {/*Quản lý khách hàng*/}
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/edit/:id" element={<EditCustomer />} />
        <Route path="customers/delete/:id" element={<DeleteCustomer />} />
        {/*Quản lý tin tức*/}
        <Route path="news" element={<NewsPage/>} />
        {/*Báo cáo*/}
        <Route path="reports" element={<Reports/>} />
        {/* Mặc định vào trang quản lý chuyến xe */}
        <Route index element={<TripsPage />} />
        </Route>
      </Routes>
  )
}
