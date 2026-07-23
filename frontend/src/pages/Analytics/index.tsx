import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Card, CardContent, CircularProgress, Grid, MenuItem, Slider, Stack, TextField, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { vehicleMonitorService } from '../../services/vehicle-monitor.service'
import * as XLSX from 'xlsx'
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import { useRef } from "react";
//@ts-ignore
import { saveAs } from 'file-saver'
import { Button } from '@mui/material'

type RangeKey = 'yearly' | 'monthly' | '15d' | '7d' | '3d' | '1d' | 'hourly'

// const COLORS = ['#FFDE42', '#4C5C2D', '#42A5F5', '#EF5350']
const COLORS = ['#FFDE42', '#4C5C2D', '#42A5F5', '#EF5350', '#9C27B0']

const rangeToMs: Record<RangeKey, number> = {
  yearly: 365 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  '15d': 15 * 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '3d': 3 * 24 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  hourly: 60 * 60 * 1000,
}

const bucketByZoom = (zoomLevel: number) => {
  if (zoomLevel < 7) return 12 * 60 * 60 * 1000
  if (zoomLevel < 9) return 6 * 60 * 60 * 1000
  if (zoomLevel < 11) return 60 * 60 * 1000
  if (zoomLevel < 13) return 30 * 60 * 1000
  if (zoomLevel < 15) return 10 * 60 * 1000
  if (zoomLevel < 17) return 60 * 1000
  return 1000
}

const AnalyticsScreen = () => {
  const barChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);
  const [vehicles, setVehicles] = useState<any[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [rangeKey, setRangeKey] = useState<RangeKey>('monthly')
  const [zoomLevel, setZoomLevel] = useState(10)
  const [analytics, setAnalytics] = useState<any | null>(null)
  const [rangePoints, setRangePoints] = useState<any[]>([])
  const [error, setError] = useState('')
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingVehicles(true)
        const data = await vehicleMonitorService.getVehicles()
        setVehicles(data.items || [])
      } catch (e: any) {
        setError(e?.error_message || 'Failed to load vehicles')
      } finally {
        setLoadingVehicles(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
  const now = new Date()
  const before = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const formatLocalDateTime = (date: Date) => {
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60000)

    return localDate.toISOString().slice(0, 16)
  }

  setFromDate(formatLocalDateTime(before))
  setToDate(formatLocalDateTime(now))
}, [])

  // useEffect(() => {
  //   if (!vehicleId) return
  //   const loadAnalytics = async () => {
  //     try {
  //       setLoadingAnalytics(true)
  //       const [analyticsData, locations] = await Promise.all([
  //         // vehicleMonitorService.getVehicleAnalytics(vehicleId),

  //         vehicleMonitorService.getVehicleAnalytics(vehicleId, {
  //         from: "2026-04-01T00:00:00Z",
  //         to: "2026-04-21T23:59:59Z",
  //       }),
  //         vehicleMonitorService.getVehicleLocations({
  //           vehicleId,
  //           from: new Date(Date.now() - rangeToMs[rangeKey]).toISOString(),
  //           to: new Date().toISOString(),
  //           limit: 20000,
  //           sortBy: 'time',
  //           sortOrder: 'asc',
  //           excludeSource: 'simulation',
  //         }),
  //       ])

  //       setAnalytics(analyticsData)
  //       setRangePoints(locations.items || [])
  //       setError('')
  //     } catch (e: any) {
  //       setError(e?.error_message || 'Failed to load analytics')
  //     } finally {
  //       setLoadingAnalytics(false)
  //     }
  //   }
  //   loadAnalytics()
  // }, [vehicleId, rangeKey])
  useEffect(() => {
  if (!vehicleId || !fromDate || !toDate) return;

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);

      console.log('FROM LOCAL:', fromDate)
      console.log('TO LOCAL:', toDate)

      console.log('FROM ISO:', new Date(fromDate).toISOString())
      console.log('TO ISO:', new Date(toDate).toISOString())

      const [analyticsData, locations] = await Promise.all([
        vehicleMonitorService.getVehicleAnalytics(vehicleId, {
          from: new Date(fromDate + ':00').toISOString(),
          to: new Date(toDate + ':00').toISOString(),
        }),

        vehicleMonitorService.getVehicleLocations({
          vehicleId,
           from: new Date(fromDate + ':00').toISOString(),
           to: new Date(toDate + ':00').toISOString(),
          limit: 20000,
          sortBy: "time",
          sortOrder: "asc",
          excludeSource: "simulation",
        }),
      ]);

      setAnalytics(analyticsData);
      console.log(" ANALYTICS RESPONSE:", analyticsData);
      setRangePoints(locations.items || []);
      setError("");
    } catch (e: any) {
      setError(e?.error_message || "Failed to load analytics");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  loadAnalytics();
}, [vehicleId, fromDate, toDate]);

  const geofenceCols: GridColDef[] = [
    { field: 'geofenceName', headerName: 'Geofence', flex: 1 },
    { field: 'eventType', headerName: 'Event', flex: 0.7 },
    { field: 'enter_time', headerName: 'Time', flex: 1, valueGetter: (_, row) => {
  const d = new Date(row.enter_time)

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
} },
    { field: 'speed', headerName: 'Speed', flex: 0.6 },
  ]

  const bucketMs = useMemo(() => bucketByZoom(zoomLevel), [zoomLevel])

  const timelineData = useMemo(() => {
    const map = new Map<number, { time: string; avgSpeed: number; maxSpeed: number; count: number }>()
    for (const p of rangePoints) {
      const t = new Date(p.time).getTime()
      const bucket = Math.floor(t / bucketMs) * bucketMs
      const item = map.get(bucket)
      if (!item) {
        map.set(bucket, {
          time: new Date(bucket).toLocaleString(),
          avgSpeed: p.speed || 0,
          maxSpeed: p.speed || 0,
          count: 1,
        })
      } else {
        item.avgSpeed += p.speed || 0
        item.maxSpeed = Math.max(item.maxSpeed, p.speed || 0)
        item.count += 1
      }
    }
    return Array.from(map.values())
      .map((item) => ({ ...item, avgSpeed: Number((item.avgSpeed / item.count).toFixed(2)) }))
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  }, [rangePoints, bucketMs])

  const metricBars = useMemo(() => {
    if (!analytics) return []
    return [
      // { name: 'Avg Speed', value: analytics.avgSpeed },
      { name: 'Enter', value: analytics.geofenceEnterCount },
      { name: 'Exit', value: analytics.geofenceExitCount },
      // { name: 'Ignition (min)', value: analytics.ignitionOnMinutes },
      { name: 'Harsh Brake', value: analytics.harshBrakingCount },
      { name: 'Overspeed', value: analytics.overSpeedCount },
       { name: 'SOS', value: analytics.sosCount },
    ]
  }, [analytics])

  const pieData = useMemo(() => {
    if (!analytics) return []
    return [
      { name: 'Geofence Enter', value: analytics.geofenceEnterCount },
      { name: 'Geofence Exit', value: analytics.geofenceExitCount },
      { name: 'Harsh Braking', value: analytics.harshBrakingCount },
      { name: 'Overspeed', value: analytics.overSpeedCount },
       { name: 'SOS', value: analytics.sosCount },
    ]
  }, [analytics])


  const downloadReport = () => {
  if (!analytics) return

  const workbook = XLSX.utils.book_new()

  // =====================================
  // SUMMARY SHEET
  // =====================================

  const selectedVehicle =
  vehicles.find(v => v._id === vehicleId);

const summaryData = [
  {
    Vehicle: selectedVehicle?.vehicleNumber || '',
    "Vehicle Tag Name":
      selectedVehicle?.vehicle_tag_name || '',

    From: new Date(fromDate).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),

    To: new Date(toDate).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }),

    'Geofence Enter': analytics.geofenceEnterCount,
    'Geofence Exit': analytics.geofenceExitCount,
    'Harsh Braking': analytics.harshBrakingCount,
    Overspeed: analytics.overSpeedCount,
    'SOS Count': analytics.sosCount,
  },
]

  const summarySheet = XLSX.utils.json_to_sheet(summaryData)

  summarySheet['!cols'] = [
  { wch: 18 },
  { wch: 25 },
  { wch: 25 },
  { wch: 18 },
  { wch: 18 },
  { wch: 18 },
  { wch: 22 },
  { wch: 18 },
  { wch: 18 },
  { wch: 15 },
]

  XLSX.utils.book_append_sheet(
    workbook,
    summarySheet,
    'Summary'
  )

  // =====================================
  // GEOFENCE LOGS
  // =====================================

  const geofenceLogs = (analytics.geofenceLogs || []).map((log: any) => ({
    Geofence: log.geofenceName,
    Event: log.eventType,
    Time: new Date(log.enter_time).toLocaleString(),
    Speed: log.speed,
  }))

  const geofenceSheet = XLSX.utils.json_to_sheet(geofenceLogs)

  XLSX.utils.book_append_sheet(
    workbook,
    geofenceSheet,
    'Geofence Logs'
  )

  // =====================================
  // SOS LOGS
  // =====================================

  const sosLogs = (analytics.sosLogs || []).map((log: any) => ({
    Time: new Date(log.createdAt).toLocaleString(),
    Status: log.status,
  }))

  const sosSheet = XLSX.utils.json_to_sheet(sosLogs)

  XLSX.utils.book_append_sheet(
    workbook,
    sosSheet,
    'SOS Logs'
  )

  // =====================================
  // DOWNLOAD FILE
  // =====================================

  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  })

  const fileData = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  })

  const vehicleNumber =
    vehicles.find(v => v._id === vehicleId)?.vehicleNumber || 'vehicle'

  saveAs(
    fileData,
    `${vehicleNumber}_analytics_report.xlsx`
  )
}

const downloadPDF = async () => {
  if (!analytics) return;

  const pdf = new jsPDF("p", "mm", "a4");

 const selectedVehicle =
  vehicles.find(v => v._id === vehicleId);

const vehicleNumber =
  selectedVehicle?.vehicleNumber ||
  "Unknown Vehicle";

const vehicleTagName =
  selectedVehicle?.vehicle_tag_name || "";

  pdf.setFillColor(25, 25, 25);
  pdf.rect(0, 0, 210, 20, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(18);
  pdf.text("Vehicle Analytics Report", 14, 13);

  pdf.setTextColor(0, 0, 0);

  pdf.setFontSize(12);
pdf.text(
  `Vehicle: ${vehicleNumber}${vehicleTagName ? ` (${vehicleTagName})` : ""}`,
  14,
  30
);
  const formattedFrom = new Date(fromDate).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formattedTo = new Date(toDate).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

pdf.text(`From: ${formattedFrom}`, 14, 38);
pdf.text(`To: ${formattedTo}`, 14, 46);

  const totalGeofenceEvents =
  analytics.geofenceEnterCount +
  analytics.geofenceExitCount;

const totalSafetyEvents =
  analytics.harshBrakingCount +
  analytics.overSpeedCount +
  analytics.sosCount;

pdf.setFontSize(14);
pdf.text("Overall Summary", 14, 58);

pdf.setFontSize(11);

pdf.text(
  `Total Geofence Entries : ${analytics.geofenceEnterCount}`,
  14,
  68
);

pdf.text(
  `Total Geofence Exits : ${analytics.geofenceExitCount}`,
  14,
  76
);

pdf.text(
  `Total Harsh Braking : ${analytics.harshBrakingCount}`,
  14,
  84
);

pdf.text(
  `Total Overspeed Events : ${analytics.overSpeedCount}`,
  14,
  92
);

pdf.text(
  `Total SOS Alerts : ${analytics.sosCount}`,
  14,
  100
);

pdf.text(
  `Total Geofence Events : ${totalGeofenceEvents}`,
  14,
  108
);

pdf.text(
  `Total Safety Events : ${totalSafetyEvents}`,
  14,
  116
);

// let status = "Normal";

// if (analytics.sosCount > 0) {
//   status = "Critical";
// } else if (
//   analytics.harshBrakingCount > 0 ||
//   analytics.overSpeedCount > 0
// ) {
//   status = "Attention Required";
// }

// pdf.setFillColor(
//   status === "Critical"
//     ? 220
//     : status === "Attention Required"
//     ? 255
//     : 120,
//   status === "Critical"
//     ? 53
//     : status === "Attention Required"
//     ? 193
//     : 200,
//   status === "Critical"
//     ? 69
//     : status === "Attention Required"
//     ? 7
//     : 80
// );

// pdf.roundedRect(140, 58, 50, 12, 2, 2, "F");

// pdf.setTextColor(255, 255, 255);
// pdf.text(status, 148, 66);

// pdf.setTextColor(0, 0, 0);

  let y = 130;
  pdf.setFontSize(14);
pdf.text("Analytics Overview", 14, y - 5);

  // BAR CHART

  if (barChartRef.current) {
    const canvas = await html2canvas(barChartRef.current, {
      scale: 2,
    });

    const img = canvas.toDataURL("image/png");

    pdf.addImage(img, "PNG", 10, y, 120, 70);
  }

  // PIE CHART

  if (pieChartRef.current) {
    const canvas = await html2canvas(pieChartRef.current, {
      scale: 2,
    });

    const img = canvas.toDataURL("image/png");

    pdf.addImage(img, "PNG", 135, y, 60, 70);
  }

  y += 85;

  pdf.setFontSize(14);
  pdf.text("Geofence Logs", 14, y);

  y += 10;

  autoTable(pdf, {
  startY: y,
  head: [["Geofence", "Event", "Time", "Speed"]],
  body: (analytics.geofenceLogs || []).map((log: any) => [
    log.geofenceName,
    log.eventType,
    new Date(log.enter_time).toLocaleString(),
    log.speed,
  ]),
  theme: "grid",
  headStyles: {
    fillColor: [25, 25, 25],
  },
});

const geofenceTableEndY =
  (pdf as any).lastAutoTable.finalY;

// If Geofence table ended near page bottom,
// move SOS logs to next page
if (geofenceTableEndY > 240) {

  pdf.addPage();

  pdf.setFontSize(14);
  pdf.text("SOS Logs", 14, 20);

  autoTable(pdf, {
    startY: 28,

    head: [["Time", "Status"]],

    body: (analytics.sosLogs || []).map((log: any) => [
      new Date(log.createdAt).toLocaleString(),
      log.status,
    ]),

    theme: "grid",

    headStyles: {
      fillColor: [25, 25, 25],
    },
  });

} else {

  pdf.setFontSize(14);

  pdf.text(
    "SOS Logs",
    14,
    geofenceTableEndY + 12
  );

  autoTable(pdf, {
    startY: geofenceTableEndY + 18,

    head: [["Time", "Status"]],

    body: (analytics.sosLogs || []).map((log: any) => [
      new Date(log.createdAt).toLocaleString(),
      log.status,
    ]),

    theme: "grid",

    headStyles: {
      fillColor: [25, 25, 25],
    },
  });

}

const finalY =
  (pdf as any).lastAutoTable?.finalY || 260;

pdf.setFontSize(9);

pdf.text(
  `Generated On: ${new Date().toLocaleString()}`,
  14,
  finalY + 15
);

  pdf.save(`${vehicleNumber}_analytics_report.pdf`);
};

  return (
    <Box sx={{ maxWidth: 1700, mx: 'auto', width: '100%' }}>
      <Typography variant='h5' mb={2}>Vehicle Analytics</Typography>
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField fullWidth select label='Vehicle' value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} disabled={loadingVehicles}>
                {vehicles.map((vehicle) => (
  <MenuItem
    key={vehicle._id}
    value={vehicle._id}
  >
    {vehicle.vehicleNumber}
    {vehicle.vehicle_tag_name
      ? ` (${vehicle.vehicle_tag_name})`
      : ""}
      
  </MenuItem>
))}
              </TextField>
            </Grid>
           <Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="From"
    type="datetime-local"
    InputLabelProps={{ shrink: true }}
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
  />
</Grid>

<Grid item xs={12} md={3}>
  <TextField
    fullWidth
    label="To"
    type="datetime-local"
    InputLabelProps={{ shrink: true }}
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
  />
</Grid>
           <Grid item xs={12} md={2}>
  <Stack spacing={1}>
    <Button
      fullWidth
      variant="contained"
      onClick={downloadPDF}
      disabled={!analytics}
      sx={{ height: '56px' }}
    >
      Download PDF
    </Button>

    <Button
      fullWidth
      variant="outlined"
      onClick={downloadReport}
      disabled={!analytics}
    >
      Download Excel
    </Button>
  </Stack>
</Grid>
          </Grid>
        </CardContent>
      </Card>

      {(loadingVehicles || loadingAnalytics) && (
        <Card sx={{ mb: 2 }}><CardContent><Stack direction='row' alignItems='center' spacing={2}><CircularProgress size={28} /><Typography>Loading analytics data...</Typography></Stack></CardContent></Card>
      )}

      {analytics && !loadingAnalytics && (
         <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {[
              // { label: 'Average Speed', value: `${analytics.avgSpeed} km/h` }, 
              { label: 'Geofence Enter', value: analytics.geofenceEnterCount }, { label: 'Geofence Exit', value: analytics.geofenceExitCount }, 
              // { label: 'Ignition On Time', value: `${analytics.ignitionOnMinutes} min` }, 
              { label: 'Harsh Braking', value: analytics.harshBrakingCount }, { label: 'Overspeed', value: analytics.overSpeedCount },{ label: 'SOS Count', value: analytics.sosCount }].map((item) => (
              <Grid item xs={12} sm={6} md={2} key={item.label}><Card><CardContent><Typography variant='caption'>{item.label}</Typography><Typography variant='h6'>{item.value}</Typography></CardContent></Card></Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={8}><Card><CardContent><Typography variant='h6' mb={1}>Analytics Overview</Typography><Box
  ref={barChartRef}
  sx={{
    width: '100%',
    height: 280,
    backgroundColor: '#fff'
  }}
><ResponsiveContainer><BarChart data={metricBars}><CartesianGrid strokeDasharray='3 3' /><XAxis dataKey='name' /><YAxis /><Tooltip /><Bar dataKey='value' fill='#FFDE42' radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></Box></CardContent></Card></Grid>
            <Grid item xs={12} md={4}><Card><CardContent><Typography variant='h6' mb={1}>Event Distribution</Typography><Box
  ref={pieChartRef}
  sx={{
    width: '100%',
    height: 280,
    backgroundColor: '#fff'
  }}
><ResponsiveContainer><PieChart><Pie data={pieData} dataKey='value' nameKey='name' outerRadius={90} label>{pieData.map((_: any, index: number) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></Box></CardContent></Card></Grid>
          </Grid>

         

          <Card><CardContent><Typography variant='h6' mb={1}>Geofence Logs</Typography><div style={{ height: 320 }}><DataGrid rows={(analytics.geofenceLogs || []).map((x: any) => ({ ...x, id: x._id }))} columns={geofenceCols} /></div></CardContent></Card>
          <Card sx={{ mt: 2 }}>
  <CardContent>
    <Typography variant='h6' mb={1}>SOS Logs</Typography>

    <div style={{ height: 320 }}>
      <DataGrid
        rows={(analytics.sosLogs || []).map((x: any) => ({
          ...x,
          id: x._id,
        }))}
        columns={[
          {
            field: "createdAt",
            headerName: "Time",
            flex: 1,
            valueGetter: (_, row) => {
  const d = new Date(row.createdAt)

  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
},
          },
          {
            field: "status",
            headerName: "Status",
            flex: 1,
          },
        ]}
      />
    </div>
  </CardContent>
</Card>
        </>
      )}
    </Box>
  )
}

export default AnalyticsScreen
