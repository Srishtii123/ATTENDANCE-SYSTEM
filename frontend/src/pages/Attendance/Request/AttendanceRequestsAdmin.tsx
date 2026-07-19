import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Input, Select, Button, Modal, message } from 'antd';
import { ReloadOutlined, SearchOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GridReadyEvent, GridOptions } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import dayjs from 'dayjs';
import attendanceServiceInstance from 'service/Attendance/Service.attendance';
import {
  attendanceGridPanel,
  attendanceGridTheme,
  attendanceHeaderCard,
  attendancePageBackdrop,
  attendanceShell,
  attendanceShellInner,
  attendanceTitle
} from '../attendanceStyles';

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  PENDING: { color: '#d97706', bg: '#fef3c7' },
  APPROVED: { color: '#059669', bg: '#d1fae5' },
  REJECTED: { color: '#dc2626', bg: '#fee2e2' }
};

const StatusCellRenderer = (params: any) => {
  const cfg = STATUS_COLORS[params.value] ?? STATUS_COLORS.PENDING;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg
      }}
    >
      {params.value}
    </span>
  );
};

const EventTypeCellRenderer = (params: any) => {
  const isIn = params.value === 'check_in';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        color: isIn ? '#4f46e5' : '#db2777',
        background: isIn ? '#ede9fe' : '#fce7f3'
      }}
    >
      {isIn ? 'Check In' : 'Check Out'}
    </span>
  );
};

const ImageCellRenderer = (params: any) => {
  const [open, setOpen] = useState(false);
  if (!params.value) return <span style={{ color: '#ccc', fontSize: 12 }}>—</span>;
  return (
    <>
      <Button type="link" icon={<EyeOutlined />} onClick={() => setOpen(true)} size="small" style={{ padding: 0, height: 24 }}>
        View
      </Button>
      <Modal open={open} onCancel={() => setOpen(false)} footer={null} centered width={400} styles={{ body: { padding: 0 } }}>
        <img src={params.value} alt="Attendance capture" style={{ width: '100%', borderRadius: 8, display: 'block' }} />
      </Modal>
    </>
  );
};

const ActionCellRenderer = (params: any) => {
  const { data, context } = params;
  if (data.status !== 'PENDING') return <span style={{ color: '#d1d5db', fontSize: 12 }}>—</span>;
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <Button
        type="primary"
        size="small"
        icon={<CheckOutlined />}
        loading={context.approvingId === data.id}
        onClick={() => context.onApprove(data)}
        style={{ fontSize: 11, height: 22, padding: '0 8px', lineHeight: '20px' }}
      >
        Approve
      </Button>
      <Button
        size="small"
        icon={<CloseOutlined />}
        onClick={() => context.onReject(data)}
        style={{ fontSize: 11, height: 22, padding: '0 8px', lineHeight: '20px', marginLeft: 4 }}
      >
        Reject
      </Button>
    </div>
  );
};

const StatPill = ({ label, value, color, bg, filterVal, statusFilter, setStatusFilter }: any) => {
  const active = statusFilter === filterVal;
  return (
    <div
      onClick={() => filterVal && setStatusFilter && setStatusFilter(active ? null : filterVal)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        borderRadius: 20,
        background: active ? color : bg,
        border: `1px solid ${color}55`,
        cursor: filterVal ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: active ? '#fff' : color, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 11, color: active ? 'rgba(255,255,255,0.85)' : color }}>{label}</span>
    </div>
  );
};

const AttendanceRequestsAdmin: React.FC = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth); // windowWidth handling

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gridRef = useRef<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>('PENDING');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await attendanceServiceInstance.listAttendanceRequests();
      const data = res?.data?.data ?? res?.data ?? res?.results ?? res?.items ?? res;
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      message.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchCode = searchCode
        ? r.employee_code?.toLowerCase().includes(searchCode.toLowerCase()) ||
          r.employee?.full_name?.toLowerCase().includes(searchCode.toLowerCase())
        : true;
      const matchStatus = statusFilter ? r.status === statusFilter : true;
      return matchCode && matchStatus;
    });
  }, [requests, searchCode, statusFilter]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === 'PENDING').length,
      approved: requests.filter((r) => r.status === 'APPROVED').length,
      rejected: requests.filter((r) => r.status === 'REJECTED').length
    }),
    [requests]
  );

  const handleApprove = useCallback((record: any) => {
    Modal.confirm({
      title: 'Approve this request?',
      content: (
        <div style={{ paddingTop: 4 }}>
          <div style={{ color: '#374151' }}>
            <strong>{record.employee?.full_name || record.employee_code}</strong>
          </div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
            {record.event_type === 'check_in' ? 'Check In' : 'Check Out'} · {record.employee_code}
          </div>
        </div>
      ),
      okText: 'Approve',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        setApprovingId(record.id);
        try {
          const resp = await attendanceServiceInstance.approveAttendanceRequest(record.id, 'Approved by HR');
          if (resp?.success) {
            message.success('Request approved');
            fetchRequests();
          } else {
            message.error('Approval failed');
          }
        } catch {
          message.error('Approval failed');
        } finally {
          setApprovingId(null);
        }
      }
    });
  }, []);

  const handleReject = useCallback((record: any) => {
    Modal.confirm({
      title: 'Reject this request?',
      content: (
        <div style={{ paddingTop: 4 }}>
          <div style={{ color: '#374151' }}>
            <strong>{record.employee?.full_name || record.employee_code}</strong>
          </div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
            {record.event_type === 'check_in' ? 'Check In' : 'Check Out'} · {record.employee_code}
          </div>
          <div style={{ color: '#dc2626', fontSize: 12, marginTop: 6 }}>
            This request will be rejected and will not be recorded as an attendance event.
          </div>
        </div>
      ),
      okText: 'Reject',
      cancelText: 'Cancel',
      onOk: async () => {
        setRejectingId(record.id);
        try {
          const resp = await attendanceServiceInstance.rejectAttendanceRequest(record.id, 'Rejected by HR');
          if (resp?.success) {
            message.success('Request rejected');
            fetchRequests();
          } else {
            message.error('Rejection failed');
          }
        } catch {
          message.error('Rejection failed');
        } finally {
          setRejectingId(null);
        }
      }
    });
  }, []);

  const columnDefs: ColDef<any>[] = [
    {
      field: 'employee_code',
      headerName: 'Employee Code',
      width: 140,
      minWidth: 100,
      cellStyle: { fontFamily: 'monospace', color: '#4f46e5', fontSize: '11px', fontWeight: 600 },
      suppressSizeToFit: true,
      filter: 'agTextColumnFilter',
      filterParams: {
        buttons: ['reset', 'apply'],
        closeOnApply: false,
        debounceMs: 300
      }
    },
    {
      field: 'requested_by',
      headerName: 'Requested By',
      sortable: true,
      filter: true,
      minWidth: 180,
      flex: 2,
      valueGetter: (p: any) => p.data?.employee?.full_name || p.data?.employee_code,
      cellStyle: { fontSize: '12px', fontWeight: 500, color: '#111827' }
    },
    {
      field: 'event_type',
      headerName: 'Event',
      sortable: true,
      filter: true,
      minWidth: 110,
      flex: 0.8,
      cellRenderer: EventTypeCellRenderer,
      hide: windowWidth < 768
    },
    {
      field: 's3_image_key',
      headerName: 'Capture',
      sortable: false,
      filter: false,
      minWidth: 90,
      flex: 0.6,
      cellRenderer: ImageCellRenderer,
      cellStyle: { display: 'flex', alignItems: 'center' },
      hide: windowWidth < 768
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: true,
      minWidth: 110,
      flex: 0.8,
      cellRenderer: StatusCellRenderer
    },
    {
      field: 'created_at',
      headerName: 'Submitted',
      sortable: true,
      filter: true,
      minWidth: 140,
      flex: 1,
      valueFormatter: (p: any) => dayjs(p.value).format('DD MMM YY, HH:mm'),
      cellStyle: { fontSize: '11px', color: '#6b7280' },
      sort: 'desc' as const
    },
    {
      field: 'actions',
      headerName: 'Action',
      sortable: false,
      filter: false,
      minWidth: 160,
      flex: 1.2,
      cellRenderer: ActionCellRenderer,
      cellStyle: { display: 'flex', alignItems: 'center' }
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
      paginationPageSizeSelector: [20, 50, 100, 500, 1000],
      paginationPageSize: windowWidth < 768 ? 15 : 25,
      animateRows: true,
      popupParent: document.body
    }),
    [windowWidth]
  );

  const containerStyle = useMemo(
    () => ({
      height: windowWidth < 768 ? '450px' : '100%',
      width: '100%',
      minHeight: windowWidth < 768 ? '350px' : 0
    }),
    [windowWidth]
  );

  const context = useMemo(
    () => ({
      approvingId,
      onApprove: handleApprove,
      onReject: handleReject
    }),
    [approvingId, handleApprove, rejectingId, handleReject]
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    gridRef.current = params.api;
    setTimeout(() => {
      params.api.sizeColumnsToFit();
    }, 100);
  }, []);

  const onGridSizeChanged = useCallback((p: any) => {
    p.api.sizeColumnsToFit();
  }, []);

  return (
    <div className={attendanceShell}>
      <div className={attendancePageBackdrop} />
      <div className={attendanceShellInner}>
      <section className={attendanceHeaderCard}>
      {/* Stat pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <StatPill label="Total" value={stats.total} color="#374151" bg="#f3f4f6" />
        <StatPill
          label="Pending"
          value={stats.pending}
          color="#d97706"
          bg="#fef3c7"
          filterVal="PENDING"
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <StatPill
          label="Approved"
          value={stats.approved}
          color="#059669"
          bg="#d1fae5"
          filterVal="APPROVED"
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        <StatPill
          label="Rejected"
          value={stats.rejected}
          color="#dc2626"
          bg="#fee2e2"
          filterVal="REJECTED"
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
        {filtered.length !== requests.length && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '3px 10px',
              borderRadius: 20,
            background: 'rgba(133,183,235,0.1)',
              border: '1px solid #26394e'
            }}
          >
            <span style={{ fontSize: 11, color: '#9bc8f5', fontWeight: 600 }}>{filtered.length} shown</span>
          </div>
        )}
      </div>

      {/* Header Section */}
      <div className="mt-3 flex flex-col sm:flex-row justify-between items-center gap-3">
        <h1 className={attendanceTitle}>Attendance Approvals</h1>
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <Input
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            placeholder="Search employee…"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            allowClear
            size="middle"
            style={{ width: windowWidth < 768 ? '100%' : 190 }}
          />
          <Select
            placeholder="Filter statuses"
            value={statusFilter}
            onChange={setStatusFilter}
            allowClear
            size="middle"
            style={{ width: windowWidth < 768 ? 150 : 120 }}
            options={[
              { label: 'Pending', value: 'PENDING' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' }
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchRequests} loading={loading} size="middle">
            {windowWidth >= 768 && 'Refresh'}
          </Button>
        </div>
      </div>
      </section>

      <section className={attendanceGridPanel}>
        <style>
          {attendanceGridTheme(windowWidth)}
        </style>

        <div className="ag-theme-alpine" style={containerStyle}>
          <AgGridReact
            ref={gridRef}
            rowData={filtered}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            gridOptions={gridOptions}
            context={context}
            onGridReady={onGridReady}
            onGridSizeChanged={onGridSizeChanged}
            onFirstDataRendered={onGridSizeChanged}
            suppressScrollOnNewData={true}
            enableBrowserTooltips={true}
            overlayLoadingTemplate='<span style="color:#6b7280;font-size:13px">Loading…</span>'
            overlayNoRowsTemplate='<span style="color:#9ca3af;font-size:13px">No requests found</span>'
            loadingOverlayComponentParams={{ loading }}
          />
        </div>
      </section>
      </div>
    </div>
  );
};

export default AttendanceRequestsAdmin;
