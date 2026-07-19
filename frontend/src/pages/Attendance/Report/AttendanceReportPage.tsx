import { useQuery } from '@tanstack/react-query';
import { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import CustomDataTable, { rowsPerPageOptions } from 'components/tables/CustomDataTables';
import { useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';
import { IAttendanceRecord } from '../../../types/attendance.types';
import dayjs from 'dayjs';
import { DatePicker, Select, Space, Tag } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

type FixedAttendanceRecord = IAttendanceRecord & { employee_name?: string };

const AttendanceReportPage = () => {
  const [paginationData, setPaginationData] = useState({ page: 0, rowsPerPage: rowsPerPageOptions[0] });
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().startOf('month').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);
  const [department, setDepartment] = useState<string | undefined>();

  const columns = useMemo<ColumnDef<FixedAttendanceRecord>[]>(
    () => [
      {
        accessorFn: (row: FixedAttendanceRecord) => row.employee_id,
        id: 'employee_id',
        header: () => <FormattedMessage id="Employee ID" />
      },
      {
        accessorFn: (row: FixedAttendanceRecord) => row.employee_name,
        id: 'employee_name',
        header: () => <FormattedMessage id="Employee Name" />
      },
      {
        accessorFn: (row: FixedAttendanceRecord) => row.department,
        id: 'department',
        header: () => <FormattedMessage id="Department" />
      },
      {
        accessorFn: (row: FixedAttendanceRecord) => {
          if (!row.check_in) return '--:--:--';
          try {
            const parsed = dayjs(row.check_in);
            return parsed.isValid() ? parsed.format('HH:mm:ss') : '--:--:--';
          } catch (error) {
            console.warn('Invalid check_in timestamp:', row.check_in);
            return '--:--:--';
          }
        },
        id: 'check_in',
        header: () => <FormattedMessage id="Check In" />
      },
      {
        accessorFn: (row: FixedAttendanceRecord) => {
          if (!row.check_out) return '--:--:--';
          try {
            const parsed = dayjs(row.check_out);
            return parsed.isValid() ? parsed.format('HH:mm:ss') : '--:--:--';
          } catch (error) {
            console.warn('Invalid check_out timestamp:', row.check_out);
            return '--:--:--';
          }
        },
        id: 'check_out',
        header: () => <FormattedMessage id="Check Out" />
      },
      {
        accessorFn: (row: FixedAttendanceRecord) => row.status,
        id: 'status',
        header: () => <FormattedMessage id="Status" />,
        cell: ({ getValue }) => {
          const status = String(getValue()).toLowerCase();
          const color = status === 'present' ? 'success' : status === 'late' ? 'warning' : 'error';
          return <Tag color={color}>{status.toUpperCase()}</Tag>;
        }
      }
    ],
    []
  );

  const { data: attendanceData, isFetching } = useQuery({
    queryKey: ['attendance_report', paginationData, dateRange, department],
    queryFn: () => attendanceServiceInstance.getAttendanceRecords(paginationData, dateRange)
  });

  const customFilter = (
    <Space wrap size={8}>
      <RangePicker
        value={[dayjs(dateRange[0]), dayjs(dateRange[1])].map(date => {
          return date?.isValid?.() ? date : dayjs();
        }) as [any, any]}
        onChange={(dates) => {
          if (dates && dates[0] && dates[1]) {
            setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
          }
        }}
      />
      <Select placeholder="Select Department" style={{ width: 200 }} onChange={setDepartment} allowClear>
        <Option value="IT">IT</Option>
        <Option value="HR">HR</Option>
        <Option value="Finance">Finance</Option>
      </Select>
    </Space>
  );

  return (
    <div className="bg-[#f4f7fb] p-3 sm:p-4 lg:p-5 md:h-[calc(100vh-145px)] md:overflow-hidden">
      <div className="mx-auto flex h-full max-w-[1500px] flex-col gap-3 md:min-h-0">
        <section className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#082a89] text-lg text-white">
              <BarChartOutlined />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#082a89]">Attendance Report</h1>
              <p className="text-xs text-slate-500">Filter and review attendance summaries.</p>
            </div>
          </div>
        </section>

        <section className="flex-1 overflow-hidden rounded-xl border border-blue-100 bg-white p-2 shadow-sm md:min-h-0">
          <CustomDataTable
            columns={columns}
            data={attendanceData?.data || []}
            isDataLoading={isFetching}
            customFilter={customFilter}
            handleFilterChange={() => {}}
            row_id="id"
            rowSelection={rowSelection}
            setRowSelection={setRowSelection}
            count={attendanceData?.data?.length || 0}
            hasPagination
            onPaginationChange={(page: number, rowsPerPage: number) => {
              setPaginationData({ page, rowsPerPage });
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default AttendanceReportPage;
