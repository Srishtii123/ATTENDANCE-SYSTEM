import { FileDoneOutlined, FileSearchOutlined, TeamOutlined, SafetyCertificateOutlined, HomeOutlined } from '@ant-design/icons';
import { attendanceMenuTree } from './attendanceMenu';

const icons = { FileDoneOutlined, FileSearchOutlined, TeamOutlined, SafetyCertificateOutlined };
// const icons = {
//   FileDoneOutlined,
//   FileSearchOutlined,
//   TeamOutlined,
//   SafetyCertificateOutlined
// };

export const NavigationItems = (attendanceMenuTree[0].children || []).map((item) => ({
  ...item,
  icon:
    item.id === 'attendance_dashboard'
      ? HomeOutlined
      : item.id === 'attendance_approvals'
        ? icons.FileDoneOutlined
        : item.id === 'attendance_employee_register'
          ? icons.TeamOutlined
          : item.id === 'attendance_proxy_logs'
            ? icons.SafetyCertificateOutlined
            : icons.FileSearchOutlined
}));
