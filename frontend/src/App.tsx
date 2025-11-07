import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import Presentation from './Presentation'
import Health from './Health'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/presentation" element={<Presentation />} />
        <Route path="/health" element={<Health />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
