import { useState, useEffect, useMemo, useRef } from 'react';
import { DatePicker, Input, Button, Tag, message, Modal, Flex, Select } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, GridOptions } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { SearchOutlined, ExclamationCircleOutlined, EyeOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import {
  attendanceGridPanel,
  attendanceGridTheme,
  attendanceHeaderCard,
  attendancePageBackdrop,
  attendanceShellInner,
  attendanceTitle
} from '../attendanceStyles';

const { RangePicker } = DatePicker;

interface ProxyLog {
  id: string;
  uuid: string;
  timestamp: string;
  proxy_employee_code: string;
  proxy_employee_name: string;
  actual_employee_code: string;
  actual_employee_name: string;
  confidence: number;
  action: 'check_in' | 'check_out';
  action_taken: 'cancelled_by_user' | 'auto_rejected';
  device_type: string;
  status: string;
  created_at: string;
  s3_image_url?: string;
  location_data?: any;
}

const ProxyLogsAdmin = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [loading, setLoading] = useState(false);
  const [proxyLogs, setProxyLogs] = useState<ProxyLog[]>([]);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10000,
    start_date: '',
    end_date: '',
    employee_code: '',
    action: '' as '' | 'check_in' | 'check_out',
    status: ''
  });
  const [imageModal, setImageModal] = useState({ visible: false, imageUrl: '' });
  const [stats, setStats] = useState({
    totalIncidents: 0,
    reportedToday: 0,
    highConfidence: 0,
    officeLocation: 0
  });

  const fetchProxyLogs = async () => {
    setLoading(true);
    try {
      const response = await attendanceServiceInstance.getProxyLogs(filters);
      const logs = response.data?.proxy_logs || [];
      setProxyLogs(logs);
      setTotal(response.data?.total || 0);
      if (response.data?.stats) {
        setStats(response.data.stats);
      } else {
        calculateStats(logs);
      }
    } catch (error: any) {
      message.error('Failed to fetch proxy logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (logs: ProxyLog[]) => {
    const today = dayjs().format('YYYY-MM-DD');
    const todayLogs = logs.filter((log) => {
      try {
        const parsedDate = dayjs(log.timestamp);
        return parsedDate.isValid() && parsedDate.format('YYYY-MM-DD') === today;
      } catch (error) {
        console.warn(`Invalid timestamp format: ${log.timestamp}`);
        return false;
      }
    });

    setStats({
      totalIncidents: logs.length,
      reportedToday: todayLogs.length,
      highConfidence: logs.filter((log) => {
        const confidence = typeof log.confidence === 'string' ? parseFloat(log.confidence) : log.confidence;
        return !isNaN(confidence) && confidence > 80;
      }).length,
      officeLocation: logs.filter((log) => getLocationValue(log.location_data, 'locationType').toLowerCase() === 'office').length
    });
  };

  const getLocationValue = (locationData: any, key: 'locationType' | 'officeName') => {
    if (!locationData) return '';
    try {
      const parsed = typeof locationData === 'string' ? JSON.parse(locationData) : locationData;
      const snakeKey = key === 'locationType' ? 'location_type' : 'office_name';
      return String(parsed?.[key] || parsed?.[snakeKey] || '');
    } catch {
      return '';
    }
  };

  useEffect(() => {
    fetchProxyLogs();
  }, [filters]);

  const handleDateChange = (dates: any) => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      start_date: dates?.[0]?.format('YYYY-MM-DD') || '',
      end_date: dates?.[1]?.format('YYYY-MM-DD') || ''
    }));
  };

  const handleExport = () => {
    if (!proxyLogs.length) {
      message.info('No proxy incidents to export');
      return;
    }

    const rows = proxyLogs.map((log) => ({
      Timestamp: dayjs(log.timestamp).isValid() ? dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss') : log.timestamp,
      'Proxy Employee': `${log.proxy_employee_name || ''} (${log.proxy_employee_code || ''})`,
      'Actual Employee': `${log.actual_employee_name || ''} (${log.actual_employee_code || ''})`,
      Confidence: log.confidence,
      Action: log.action === 'check_in' ? 'Check In' : 'Check Out',
      Status: log.action_taken,
      Location: getLocationValue(log.location_data, 'locationType'),
      Evidence: log.s3_image_url || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proxy Incidents');
    XLSX.writeFile(workbook, `proxy-incidents-${dayjs().format('YYYY-MM-DD-HHmm')}.xlsx`);
  };

  const gridRef = useRef<any>(null);

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

  const columns: ColDef<ProxyLog>[] = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      sortable: true,
      filter: true,
      minWidth: 130,
      flex: 1,
      cellRenderer: (params: any) => {
        const parsed = dayjs(params.value);
        if (!parsed.isValid()) return <span style={{ color: '#9ca3af', fontSize: 11 }}>Invalid</span>;
        return (
          <div style={{ lineHeight: 1.4 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{parsed.format('DD/MM/YYYY')}</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>{parsed.format('HH:mm:ss')}</div>
          </div>
        );
      },
      comparator: (a, b) => {
        const timeA = dayjs(a).isValid() ? dayjs(a).unix() : 0;
        const timeB = dayjs(b).isValid() ? dayjs(b).unix() : 0;
        return timeA - timeB;
      }
    },
    {
      field: 'proxy_employee_name',
      headerName: 'Proxy Employee',
      sortable: true,
      filter: true,
      minWidth: 180,
      flex: 2,
      cellRenderer: (params: any) => (
        <div style={{ lineHeight: 1.4 }}>
          <div
            style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params.value}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.data?.proxy_employee_code}
          </div>
        </div>
      )
    },
    {
      field: 'actual_employee_name',
      headerName: 'Actual Employee',
      sortable: true,
      filter: true,
      minWidth: 180,
      flex: 2,
      hide: windowWidth < 768,
      cellRenderer: (params: any) => (
        <div style={{ lineHeight: 1.4 }}>
          <div
            style={{ fontSize: 12, fontWeight: 600, color: '#059669', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {params.value}
          </div>
          <div style={{ fontSize: 10, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {params.data?.actual_employee_code}
          </div>
        </div>
      )
    },
    {
      field: 'confidence',
      headerName: 'Confidence',
      sortable: true,
      filter: true,
      minWidth: 140,
      flex: 1,
      cellRenderer: (params: any) => {
        const confidence = params.value;
        const confidenceNum = typeof confidence === 'string' ? parseFloat(confidence) : confidence;
        const isValid = !isNaN(confidenceNum) && confidenceNum >= 0 && confidenceNum <= 100;
        const value = isValid ? confidenceNum : 0;

        return (
          <div className="flex items-center space-x-2">
            <div className="w-12 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${value > 80 ? 'bg-green-500' : value > 60 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${value}%` }}
              ></div>
            </div>
            <Tag color={value > 80 ? 'green' : value > 60 ? 'orange' : 'red'}>{value}%</Tag>
          </div>
        );
      }
    },
    {
      field: 'action',
      headerName: 'Action',
      sortable: true,
      filter: true,
      minWidth: 110,
      flex: 0.8,
      hide: windowWidth < 768,
      cellRenderer: (params: any) => (
        <Tag color={params.value === 'check_in' ? 'blue' : 'purple'}>{params.value === 'check_in' ? 'Check In' : 'Check Out'}</Tag>
      )
    },
    {
      field: 'action_taken',
      headerName: 'Status',
      sortable: true,
      filter: true,
      minWidth: 130,
      flex: 1,
      cellRenderer: (params: any) => (
        <Tag color={params.value === 'cancelled_by_user' ? 'red' : 'orange'}>
          {params.value === 'cancelled_by_user' ? 'Reported Proxy' : 'Auto Rejected'}
        </Tag>
      )
    },
    {
      field: 'location_data',
      headerName: 'Location',
      sortable: true,
      filter: true,
      minWidth: 120,
      flex: 1,
      hide: windowWidth < 768,
      cellRenderer: (params: any) => {
        const location = params.value;
        const locationType = getLocationValue(location, 'locationType').toLowerCase() || 'remote';
        const officeName = getLocationValue(location, 'officeName');
        const isOffice = locationType === 'office';

        return (
          <div className="text-xs">
            <Tag color={isOffice ? 'green' : 'orange'}>{isOffice ? 'Office' : 'Remote'}</Tag>
            {officeName && <div className="text-gray-500 mt-1">{officeName}</div>}
          </div>
        );
      }
    },
    {
      field: 'id',
      headerName: 'Evidence',
      sortable: false,
      filter: false,
      minWidth: 120,
      flex: 0.8,
      cellRenderer: (params: any) => {
        const record = params.data as ProxyLog;
        return record.s3_image_url ? (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => setImageModal({ visible: true, imageUrl: record.s3_image_url! })}
            size="small"
          >
            View Image
          </Button>
        ) : (
          <span className="text-gray-400 text-xs">No Image</span>
        );
      }
    }
  ];

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

  const containerStyle = useMemo(
    () => ({
      height: windowWidth < 768 ? '450px' : '100%',
      width: '100%'
    }),
    [windowWidth]
  );

  const onGridReady = (params: GridReadyEvent) => {
    gridRef.current = params.api;
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 100);
  };

  const onGridSizeChanged = (params: any) => {
    params.api.sizeColumnsToFit();
  };

  return (
    <div
      className="relative flex flex-col bg-[var(--ams-bg)] p-3 text-[var(--ams-text)] sm:p-4 lg:p-5"
      style={{
        height: windowWidth >= 768 ? 'calc(100vh - 145px)' : 'auto',
        overflow: windowWidth >= 768 ? 'hidden' : 'visible'
      }}
    >
      <div className={attendancePageBackdrop} />
      <div className={`${attendanceShellInner} w-full`}>
      <section className={attendanceHeaderCard}>
      {/* Stats Cards */}
      <Flex gap={windowWidth < 768 ? 4 : 8}>
        {[
          { label: 'Total Proxy', value: stats.totalIncidents, color: '#cf1322', bg: '#fff1f0', icon: '!' },
          { label: 'Today', value: stats.reportedToday, color: '#1677ff', bg: '#e6f4ff', icon: 'T' },
          { label: 'High Confidence', value: stats.highConfidence, color: '#52c41a', bg: '#f6ffed', icon: '%' },
          { label: 'Office', value: stats.officeLocation, color: '#fa8c16', bg: '#fff7e6', icon: 'O' }
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: s.bg,
              border: `1px solid ${s.color}33`,
              borderLeft: `3px solid ${s.color}`,
              borderRadius: 8,
              padding: windowWidth < 768 ? '4px 6px' : '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: windowWidth < 768 ? 6 : 10
            }}
          >
            <span style={{ fontSize: windowWidth < 768 ? 14 : 18 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: windowWidth < 768 ? 16 : 20, fontWeight: 700, color: s.color, lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: windowWidth < 768 ? 9 : 11, color: '#9a9a96', marginTop: windowWidth < 768 ? 1 : 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </Flex>

      {/* Header Section */}
      <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex items-center">
          <ExclamationCircleOutlined className="text-red-500 mr-2 text-lg" />
          {/* <h1 className="text-2xl font-semibold text-gray-800">Proxy Attendance Incidents</h1> */}
          <h1
              className={attendanceTitle}
            style={{
              fontSize: windowWidth < 768 ? '16px' : '20px'
            }}
          >
            Proxy Attendance Incidents
          </h1>
          <Tag color="red" className="ml-2">
            {total} Total
          </Tag>
        </div>
        <div className="flex space-x-2">
          <Button size="small" icon={<DownloadOutlined />} onClick={handleExport} disabled={!proxyLogs.length}>
            Export
          </Button>
          <Button type="primary" size="small" icon={<ReloadOutlined />} onClick={fetchProxyLogs} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <RangePicker size="middle" onChange={handleDateChange} />
        <Input
          size="middle"
          placeholder="Search employee code or name"
          value={filters.employee_code}
          onChange={(e) => setFilters((prev) => ({ ...prev, employee_code: e.target.value, page: 1 }))}
          style={{ width: windowWidth < 768 ? '100%' : 250 }}
          suffix={<SearchOutlined />}
        />
        <Select
          size="middle"
          value={filters.action}
          onChange={(value) => setFilters((prev) => ({ ...prev, action: value, page: 1 }))}
          style={{ width: windowWidth < 768 ? '100%' : 160 }}
          options={[
            { value: '', label: 'All actions' },
            { value: 'check_in', label: 'Check In' },
            { value: 'check_out', label: 'Check Out' }
          ]}
        />
        <Select
          size="middle"
          value={filters.status}
          onChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
          style={{ width: windowWidth < 768 ? '100%' : 170 }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'reported', label: 'Reported' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'dismissed', label: 'Dismissed' }
          ]}
        />
      </div>
      </section>

      {/* <div className="relative w-full"> */}
      <div
        className={attendanceGridPanel}
        style={{
          flex: windowWidth >= 768 ? 1 : 'unset',
          minHeight: 0
        }}
      >
        <style>
          {attendanceGridTheme(windowWidth)}
        </style>

        <div className="ag-theme-alpine" style={containerStyle}>
          <AgGridReact
            ref={gridRef}
            rowData={proxyLogs}
            columnDefs={columns}
            defaultColDef={defaultColDef}
            gridOptions={gridOptions}
            onGridReady={onGridReady}
            onGridSizeChanged={onGridSizeChanged}
            onFirstDataRendered={onGridSizeChanged}
            suppressScrollOnNewData={true}
            enableBrowserTooltips={true}
            overlayNoRowsTemplate='<span style="color:#9ca3af;font-size:13px">No proxy incidents found</span>'
          />
        </div>
      </div>

      {/* Image Modal */}
      <Modal
        title="Captured Image Evidence"
        open={imageModal.visible}
        onCancel={() => setImageModal({ visible: false, imageUrl: '' })}
        footer={null}
        width={700}
        centered
      >
        {imageModal.imageUrl && (
          <div className="text-center">
            <img src={imageModal.imageUrl} alt="Proxy attempt evidence" className="max-w-full h-auto rounded-lg shadow-lg border" />
            <p className="text-gray-500 text-sm mt-4">This image was captured during the proxy attempt and used for face recognition.</p>
          </div>
        )}
      </Modal>
      </div>
    </div>
  );
};

export default ProxyLogsAdmin;
