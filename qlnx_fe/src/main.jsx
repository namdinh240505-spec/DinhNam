
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles.css'
import './styles/tickets.css'
import './styles/signup.css'       
import './styles/busnews-premium.css'
import './styles/trips.css'
import './styles/booking.css'
import './styles/BookingForm.css'
import './styles/payment-momo.css'
import './styles/payment-result.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
