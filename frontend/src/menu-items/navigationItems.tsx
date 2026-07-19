import { FileDoneOutlined, FileSearchOutlined, TeamOutlined } from '@ant-design/icons';

import { attendanceMenuTree } from './attendanceMenu';

const icons = {
  FileDoneOutlined,
  FileSearchOutlined,
  TeamOutlined
};

export const NavigationItems = (attendanceMenuTree[0].children || []).map((item) => ({
  ...item,
  icon:
    item.id === 'attendance_approvals'
      ? icons.FileDoneOutlined
      : item.id === 'attendance_employee_register'
        ? icons.TeamOutlined
        : icons.FileSearchOutlined
}));
