import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Notices from "@/pages/Notices";
import PropertyFee from "@/pages/PropertyFee";
import MaintenanceFund from "@/pages/MaintenanceFund";
import Votes from "@/pages/Votes";
import Complaints from "@/pages/Complaints";
import Committee from "@/pages/Committee";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/notices/:id" element={<Notices />} />
          <Route path="/property-fee" element={<PropertyFee />} />
          <Route path="/property-fee/:id" element={<PropertyFee />} />
          <Route path="/maintenance-fund" element={<MaintenanceFund />} />
          <Route path="/maintenance-fund/:id" element={<MaintenanceFund />} />
          <Route path="/votes" element={<Votes />} />
          <Route path="/votes/:id" element={<Votes />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/complaints/:id" element={<Complaints />} />
          <Route path="/committee" element={<Committee />} />
        </Route>
      </Routes>
    </Router>
  );
}
