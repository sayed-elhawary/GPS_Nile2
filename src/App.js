// src/App.js
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// صفحات النظام
import Login from './Login';
import Dashboard from './Dashboard';
import ClientData from './ClientData';
import CameraData from './CameraData';
import EquipmentSims from './EquipmentSims';
import Violations from './Violations';
import DocumentEditor from './DocumentEditor';
import SecurityStaff from './pages/SecurityStaff';
import EmployeeHousing from './pages/EmployeeHousing';
import GPSDevices from './pages/GPSDevices';
import PRAccounts from './pages/PRAccounts';
import CompanyEquipment from './pages/CompanyEquipment';
import MaintenanceReport from './pages/MaintenanceReport';
import DriverFollowUp from './pages/DriverFollowUp';  // <-- إضافة استيراد صفحة سائقين الإدارة

// Components
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';

function App() {
  return (
    <Router basename="/">
      <Routes>
        {/* صفحة اللوجين - متاحة للجميع */}
        <Route path="/" element={<Login />} />

        {/* كل الصفحات المحمية */}
        <Route element={<ProtectedRoute />}>
          {/* Dashboard - متاح للكل (admin + gps + user) */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* صفحات متاحة فقط لـ admin و gps */}
          <Route
            path="/client-data"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <ClientData />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/camera-data"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <CameraData />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/equipment-sims"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <EquipmentSims />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/violations"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <Violations />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/document-editor"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <DocumentEditor />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/security-staff"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <SecurityStaff />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/gps-devices"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <GPSDevices />
              </RoleBasedRoute>
            }
          />
          <Route
            path="/pr-accounts"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <PRAccounts />
              </RoleBasedRoute>
            }
          />

          {/* صفحة معدات الشركة - متاحة لـ admin و gps */}
          <Route
            path="/company-equipment"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <CompanyEquipment />
              </RoleBasedRoute>
            }
          />

          {/* صفحة تقرير الصيانة - متاحة لـ admin و gps */}
          <Route
            path="/maintenance-report"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps']}>
                <MaintenanceReport />
              </RoleBasedRoute>
            }
          />

          {/* صفحة متابعة سائقين الإدارة - متاحة للكل (admin + gps + user) */}
          <Route
            path="/driver-followup"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps', 'user']}>
                <DriverFollowUp />
              </RoleBasedRoute>
            }
          />

          {/* صفحة السكن - متاحة للكل (admin + gps + user) */}
          <Route
            path="/employee-housing"
            element={
              <RoleBasedRoute allowedRoles={['admin', 'gps', 'user']}>
                <EmployeeHousing />
              </RoleBasedRoute>
            }
          />
        </Route>

        {/* أي مسار غير معروف يرجع لصفحة اللوجين */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;