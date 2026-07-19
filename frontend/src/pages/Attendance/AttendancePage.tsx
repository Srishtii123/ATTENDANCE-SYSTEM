import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef, useMemo, forwardRef } from 'react';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';
import moment from 'moment-timezone';
import dayjs from 'dayjs';
import { DatePicker, Button, Tooltip, Dropdown, Tag, Spin } from 'antd';
import { ExportOutlined, SyncOutlined, MenuOutlined, FilterOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions } from 'ag-grid-community';
import {
  attendanceGridPanel,
  attendanceGridTheme,
  attendanceHeaderCard,
  attendanceIconBox,
  attendancePageBackdrop,
  attendancePanel,
  attendanceShell,
  attendanceShellInner,
  attendanceSubtitle,
  attendanceTitle
} from './attendanceStyles';

const { RangePicker } = DatePicker;

interface IAttendanceEvent {
  id: string;
  employee_code: string;
  full_name: string;
  department: string;
  position: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  event_time: string;
  event_type: 'check_in' | 'check_out';
  day_of_week: string;
}

interface IAttendanceResponse {
  data: IAttendanceEvent[];
  total: number;
  page: number;
  limit: number;
}

// AttendanceGrid Component
interface AttendanceGridProps {
  rowData: IAttendanceEvent[];
  isLoading?: boolean;
  windowWidth: number;
}

const AttendanceGrid = forwardRef(function AttendanceGrid({ rowData, isLoading, windowWidth }: AttendanceGridProps, ref: any) {
  const gridRef = useRef<any>(null);

  const containerStyle = useMemo(
    () => ({
      height: windowWidth < 768 ? '450px' : '100%',
      width: '100%',
      minHeight: windowWidth < 768 ? '350px' : 0
    }),
    [windowWidth]
  );

  const getDepartmentColor = (dept: string) => {
    const deptColors: { [key: string]: string } = {
      IT: '#1677ff',
      HR: '#722ED1',
      Finance: '#13C2C2',
      Operations: '#52C41A',
      Sales: '#FA8C16',
      Marketing: '#EB2F96'
    };
    return deptColors[dept] || '#1677ff';
  };

  const columnDefs: ColDef[] = [
    {
      headerName: 'Employee Code',
      field: 'employee_code',
      width: 140,
      minWidth: 100,
      cellStyle: { fontFamily: 'monospace', color: '#1677ff', fontSize: '11px' },
      suppressSizeToFit: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: false,
        debounceMs: 300
      }
    },
    {
      headerName: 'Full Name',
      field: 'full_name',
      sortable: true,
      filter: true,
      minWidth: 190,
      flex: 2
    },
    {
      headerName: 'Department',
      field: 'department',
      sortable: true,
      filter: true,
      minWidth: 160,
      flex: 1,
      cellRenderer: (params: any) => {
        const color = getDepartmentColor(params.value);
        return (
          <Tag
            color={color}
            style={{
              padding: '0px 8px',
              fontSize: '11px',
              background: `linear-gradient(45deg, ${color}15, ${color}30)`,
              borderColor: `${color}50`,
              color: color,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            {params.value}
          </Tag>
        );
      }
    },
    {
      headerName: 'Position',
      field: 'position',
      sortable: true,
      filter: true,
      minWidth: 130,
      flex: 1,
      hide: windowWidth < 768
    },
    {
      headerName: 'Date',
      field: 'event_time',
      sortable: true,
      filter: true,
      minWidth: 120,
      flex: 1,
      valueFormatter: (params: { value: string }) => (params.value ? dayjs(params.value).format('DD MMM YYYY') : ''),
      hide: windowWidth < 768
    },
    {
      headerName: 'Day',
      field: 'day_of_week',
      sortable: true,
      filter: true,
      minWidth: 70,
      flex: 0.5,
      valueFormatter: (params: { value: string }) => params.value?.substring(0, 3) || '',
      hide: windowWidth < 768
    },
    {
      headerName: 'Time',
      field: 'event_time',
      sortable: true,
      filter: true,
      minWidth: 100,
      flex: 0.8,
      valueFormatter: (params: { value: string }) => (params.value ? moment.utc(params.value).local().format('HH:mm:ss') : ''),
      cellStyle: { fontFamily: 'monospace', fontSize: '11px' }
    },
    {
      headerName: 'Event Type',
      field: 'event_type',
      sortable: true,
      filter: true,
      minWidth: 120,
      flex: 1,
      cellRenderer: (params: any) => (
        <Tag
          color={params.value === 'check_in' ? 'success' : 'error'}
          style={{ padding: '0px 8px', fontSize: '11px', minWidth: '80px', textAlign: 'center' }}
        >
          {params.value === 'check_in' ? 'CHECK IN' : 'CHECK OUT'}
        </Tag>
      )
    }
  ];

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      floatingFilter: false,
      suppressMenu: false,
      menuTabs: ['filterMenuTab'],
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: false,
        debounceMs: 300
      }
    }),
    []
  );

  const gridOptions = useMemo<GridOptions>(
    () => ({
      rowHeight: windowWidth < 768 ? 40 : 25,
      headerHeight: windowWidth < 768 ? 35 : 30,
      enableCellTextSelection: true,
      enableBrowserTooltips: true,
      suppressMenuHide: false,
      pagination: true,
      paginationPageSizeSelector: [50, 100, 500, 1000, 10000],
      paginationPageSize: windowWidth < 768 ? 15 : 25,
      animateRows: true,
      popupParent: document.body
    }),
    [windowWidth]
  );

  const onGridReady = (params: any) => {
    gridRef.current = params.api;
    if (ref && typeof ref === 'object') {
      ref.current = params.api;
    }
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 100);
  };

  const onGridSizeChanged = (params: any) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <div className="relative h-full w-full min-h-0">
      <style>
        {attendanceGridTheme(windowWidth)}
      </style>

      <div className="ag-theme-alpine" style={containerStyle}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(13, 17, 23, 0.72)',
              zIndex: 10
            }}
          >
            <Spin size="large" tip="Loading attendance data..." />
          </div>
        )}
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          gridOptions={gridOptions}
          onGridReady={onGridReady}
          onGridSizeChanged={onGridSizeChanged}
          onFirstDataRendered={onGridSizeChanged}
          suppressScrollOnNewData={true}
          enableBrowserTooltips={true}
        />
      </div>
    </div>
  );
});

// Main AttendancePage Component
const AttendancePage = () => {
  const gridApiRef = useRef<any>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ]);
  const [viewMode] = useState<'paginated' | 'full-month'>('full-month');
  const [showFilters, setShowFilters] = useState(windowWidth >= 768);

  const {
    data: attendanceData,
    isFetching,
    refetch
  } = useQuery<IAttendanceResponse, Error>({
    queryKey: ['attendance_events', dateRange, viewMode],
    queryFn: async () => {
      let response;

      if (viewMode === 'full-month') {
        const fullMonthData = await attendanceServiceInstance.getFullMonthAttendanceRecords(dateRange);
        response = {
          data: fullMonthData.data,
          total: fullMonthData.total,
          page: 1,
          limit: fullMonthData.total
        };
      } else {
        response = await attendanceServiceInstance.getAttendanceRecords(
          {
            page: 1,
            rowsPerPage: 1000
          },
          dateRange
        );
      }

      const mappedData = response.data.map((record: any) => ({
        id: record.id || record.event_id,
        employee_code: record.employee_code,
        full_name: record.full_name,
        department: record.department,
        position: record.position,
        date: record.date,
        check_in: record.check_in,
        check_out: record.check_out,
        status: record.status,
        event_time: record.event_time,
        event_type: record.event_type,
        day_of_week: record.day_of_week
      }));

      return {
        ...response,
        data: mappedData
      } as IAttendanceResponse;
    },
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    setShowFilters(windowWidth >= 768);
  }, [windowWidth]);

  const handleExport = useCallback(() => {
    if (!attendanceData?.data) return;

    const api = gridApiRef.current;
    let exportRows: IAttendanceEvent[] = attendanceData.data;
    if (api) {
      const count = api.getDisplayedRowCount ? api.getDisplayedRowCount() : 0;
      if (count && count > 0) {
        const rows: any[] = [];
        for (let i = 0; i < count; i++) {
          const node = api.getDisplayedRowAtIndex(i);
          if (node && node.data) rows.push(node.data);
        }
        if (rows.length) exportRows = rows;
      }
    }

    const exportData = exportRows.map((record: IAttendanceEvent) => ({
      'Employee Code': record.employee_code || '',
      'Employee Name': record.full_name || '',
      Department: record.department || '',
      Position: record.position || '',
      Date: record.event_time ? dayjs(record.event_time).format('DD MMM YYYY') : '',
      Day: record.day_of_week || '',
      Time: record.event_time ? moment.utc(record.event_time).local().format('HH:mm') : '',
      'Event Type': record.event_type ? (record.event_type === 'check_in' ? 'CHECK IN' : 'CHECK OUT') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Records');

    const summaryData = [
      ['Attendance Export Report'],
      ['Export Date', new Date().toLocaleString()],
      ['View Mode', viewMode === 'paginated' ? 'Paginated' : 'Full Month'],
      ['Date Range', `${dateRange[0]} to ${dateRange[1]}`],
      ['Total Records', attendanceData.total],
      ['']
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    const fileName = `Attendance_${dayjs(dateRange[0]).format('YYYY-MM-DD')}_to_${dayjs(dateRange[1]).format(
      'YYYY-MM-DD'
    )}_${viewMode}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }, [attendanceData?.data, attendanceData?.total, dateRange, viewMode]);

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
    }
  };

  const mobileMenuItems = [
    {
      key: 'export',
      label: 'Export to Excel',
      icon: <ExportOutlined />,
      onClick: handleExport
    },
    {
      key: 'refresh',
      label: 'Refresh Now',
      icon: <SyncOutlined />,
      onClick: () => refetch()
    },
    {
      key: 'filters',
      label: showFilters ? 'Hide Filters' : 'Show Filters',
      icon: <FilterOutlined />,
      onClick: () => setShowFilters(!showFilters)
    }
  ];

  const renderFilters = () => (
    <div
      className={`w-full flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 transition-all duration-300 ${
        showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
      } lg:max-h-none lg:opacity-100`}
    >
      <div className="w-full lg:min-w-[300px] lg:max-w-[500px]">
        <RangePicker
          value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
          onChange={handleDateRangeChange}
          style={{ width: '100%' }}
          size={windowWidth < 768 ? 'middle' : 'large'}
          className="rounded-lg border border-gray-200"
          format="DD/MM/YYYY"
          allowClear={false}
          placeholder={['Start Date', 'End Date']}
        />
      </div>

      <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap">
        {windowWidth >= 768 && (
          <Tooltip title="Export to Excel">
            <Button
              icon={<ExportOutlined />}
              type="primary"
              onClick={handleExport}
              loading={isFetching}
              className="flex items-center gap-1"
              style={{ padding: '8px 16px', height: '40px' }}
            >
              Export
            </Button>
          </Tooltip>
        )}
      </div>
    </div>
  );

  return (
    <div className={attendanceShell}>
      <div className={attendancePageBackdrop} />
      <div className={attendanceShellInner}>
        <section className={attendanceHeaderCard}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className={attendanceIconBox}>
                <FileTextOutlined />
              </div>
              <div>
                <h1 className={attendanceTitle}>Attendance Records</h1>
                <p className={attendanceSubtitle}>Review check-in and check-out events.</p>
              </div>
            </div>
            <div className="rounded-xl border border-[#254239] bg-[rgba(93,202,165,0.1)] px-3 py-2 text-xs font-semibold text-[#6fe2bd]">
              <CalendarOutlined className="mr-2" />
              {dayjs(dateRange[0]).format('DD MMM')} - {dayjs(dateRange[1]).format('DD MMM YYYY')}
            </div>
          </div>
        </section>

        <section className={attendancePanel}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {windowWidth < 768 && (
          <Dropdown menu={{ items: mobileMenuItems }} placement="bottomRight" trigger={['click']}>
            <Button icon={<MenuOutlined />} type="text" size="middle" />
          </Dropdown>
        )}
          </div>

          {renderFilters()}
        </section>

        <section className={attendanceGridPanel}>
          <AttendanceGrid ref={gridApiRef} rowData={attendanceData?.data || []} isLoading={isFetching} windowWidth={windowWidth} />
        </section>

        {windowWidth < 768 && (
          <div className="fixed bottom-6 right-6 z-10">
            <Tooltip title="Quick Actions">
              <Dropdown menu={{ items: mobileMenuItems }} placement="topRight" trigger={['click']}>
                <Button type="primary" shape="circle" size="large" icon={<MenuOutlined />} className="shadow-lg" />
              </Dropdown>
            </Tooltip>
          </div>
        )}
        </div>
    </div>
  );
};

export default AttendancePage;
