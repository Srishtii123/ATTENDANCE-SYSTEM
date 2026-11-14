import { NavItemType } from 'types/menu';

export const attendanceMenuTree: NavItemType[] = [
  {
    id: 'attendance',
    title: 'ATTENDANCE',
    type: 'group',
    url_path: 'attendance',
    children: [
      {
        id: 'attendance_dashboard',
        title: 'Dashboard',
        type: 'item',
        url_path: '/attendance/dashboard'
      },
      {
        id: 'attendance_approvals',
        title: 'Approvals',
        type: 'item',
        url_path: '/attendance/activity/request/attendance_approvals'
      },
      {
        id: 'attendance_employee_register',
        title: 'Employees',
        type: 'item',
        url_path: '/attendance/activity/request/register_page'
      },
      {
        id: 'attendance_page',
        title: 'Attendance Records',
        type: 'item',
        url_path: '/attendance/activity/request/attendance_page'
      },
      {
        id: 'attendance_proxy_logs',
        title: 'Proxy Logs',
        type: 'item',
        url_path: '/attendance/activity/request/proxy_logs'
      }
    ]
  }
];
