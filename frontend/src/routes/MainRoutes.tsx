import { Navigate } from 'react-router-dom';
import MainLayout from 'layout/MainLayout';
import AuthGuard from 'utils/route-guard/AuthGuard';
import AttendancePage from 'pages/Attendance/AttendancePage';
import EmployeeListing from 'pages/Attendance/Employee/EmployeeListing';
import AttendanceReportPage from 'pages/Attendance/Report/AttendanceReportPage';
import AttendanceMarking from 'pages/Attendance/Request/AttendanceMarking';
import AttendanceRequestPage from 'pages/Attendance/Request/AttendanceRequestPage';
import AttendanceRequestsAdmin from 'pages/Attendance/Request/AttendanceRequestsAdmin';
import ProxyLog from 'pages/Attendance/Request/ProxyLogsAdmin';

const MainRoutes = {
  path: '/',
  element: (
    <AuthGuard>
      <MainLayout />
    </AuthGuard>
  ),
  children: [
    { index: true, element: <Navigate to="/attendance/dashboard" replace /> },
    {
      path: 'attendance',
      children: [
        { index: true, element: <Navigate to="/attendance/dashboard" replace /> },
        { path: 'dashboard', element: <AttendanceMarking /> },
        {
          path: 'activity',
          children: [
            {
              path: 'request',
              children: [
                { path: 'proxy_logs', element: <ProxyLog /> },
                { path: 'request_attendance', element: <AttendanceRequestPage /> },
                { path: 'attendance_approvals', element: <AttendanceRequestsAdmin /> },
                { path: 'register_page', element: <EmployeeListing /> },
                { path: 'attendance_page', element: <AttendancePage /> }
              ]
            },
            {
              path: 'master',
              children: [
                {
                  path: 'gm',
                  children: [{ path: 'attendance_page', element: <AttendancePage /> }]
                }
              ]
            }
          ]
        },
        { path: 'mark', element: <Navigate to="/attendance/dashboard" replace /> },
        { path: 'records', element: <Navigate to="/attendance/activity/request/attendance_page" replace /> },
        { path: 'request', element: <Navigate to="/attendance/activity/request/request_attendance" replace /> },
        { path: 'requests', element: <Navigate to="/attendance/activity/request/attendance_approvals" replace /> },
        { path: 'proxy-logs', element: <Navigate to="/attendance/activity/request/proxy_logs" replace /> },
        { path: 'employees', element: <Navigate to="/attendance/activity/request/register_page" replace /> },
        { path: 'report', element: <AttendanceReportPage /> }
      ]
    },
    { path: '*', element: <Navigate to="/attendance/dashboard" replace /> }
  ]
};

export default MainRoutes;
