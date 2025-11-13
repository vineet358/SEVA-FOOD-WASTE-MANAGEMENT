import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Users,
  Heart,
  MapPin,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../../components/CSS/ngos/reports.css";

const API_BASE = "http://localhost:5000/api/reports"; 

const Reports = () => {
  const ngoId = JSON.parse(localStorage.getItem('userInfo'))?.ngoId;

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedReport, setSelectedReport] = useState("overview");
  const [reportData, setReportData] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!ngoId) return;
        const res = await fetch(
          `${API_BASE}/${selectedReport}/${ngoId}?period=${selectedPeriod}`
        );
        const data = await res.json();
        setReportData(data);
      } catch (err) {
        console.error("Error fetching report:", err);
      }
    };
    fetchData();
  }, [selectedReport, selectedPeriod, ngoId]);

  const getTrendIcon = (trend) =>
    trend === "up" ? (
      <TrendingUp size={16} className="trend-icon up" />
    ) : (
      <TrendingDown size={16} className="trend-icon down" />
    );

  const getTrendColor = (trend) => (trend === "up" ? "#10b981" : "#ef4444");

  // const handleExport = () => {
  //   if (!reportData) return;
  //   const blob = new Blob([JSON.stringify(reportData, null, 2)], {
  //     type: "application/json",
  //   });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = `${selectedReport}-report-${selectedPeriod}.json`;
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };

  if (!reportData) {
    return (
      <p style={{ color: "#000", textAlign: "center", marginTop: "50px" }}>
        Loading {selectedReport} report...
      </p>
    );
  }

  const handleExportPDF = async () => {
    const doc = new jsPDF();
    let startY = 20;
  
    // Title
    doc.setFontSize(16);
    doc.text("NGO Report", 14, startY);
    startY += 10;
  
    doc.setFontSize(12);
    doc.text(`Period: ${selectedPeriod}`, 14, startY);
    startY += 10;
  
    // Fetch all three reports
    const overviewRes = await fetch(`${API_BASE}/overview/${ngoId}?period=${selectedPeriod}`);
    const overviewData = await overviewRes.json();
  
    const donationsRes = await fetch(`${API_BASE}/donations/${ngoId}?period=${selectedPeriod}`);
    const donationsData = await donationsRes.json();
  
    const impactRes = await fetch(`${API_BASE}/impact/${ngoId}?period=${selectedPeriod}`);
    const impactData = await impactRes.json();
  
    // Overview Table
    doc.setFontSize(14);
    doc.text("Overview", 14, startY);
    startY += 6;
    autoTable(doc, {
      startY,
      head: [["Metric", "Value"]],
      body: overviewData.stats.map((s) => [s.label, s.value]),
      theme: "grid",
    });
    startY = doc.lastAutoTable.finalY + 10;
  
    // Donations Table
    if (donationsData.topDonors?.length > 0) {
      doc.setFontSize(14);
      doc.text("Donations", 14, startY);
      startY += 6;
      autoTable(doc, {
        startY,
        head: [["Name", "Donations", "Servings"]],
        body: donationsData.topDonors.map((d) => [d.name, d.donations, d.servings]),
        theme: "grid",
      });
      startY = doc.lastAutoTable.finalY + 10;
    }
  
    // Impact Table
    if (impactData.distributionByArea?.length > 0) {
      doc.setFontSize(14);
      doc.text("Impact", 14, startY);
      startY += 6;
      autoTable(doc, {
        startY,
        head: [["Area", "Servings", "Percentage"]],
        body: impactData.distributionByArea.map((a) => [a.area, a.servings, a.percentage + "%"]),
        theme: "grid",
      });
    }
  
    doc.save(`NGO-report-${selectedPeriod}.pdf`);
  };
  


  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="header-content">
          <h1>Reports & Analytics</h1>
          <p>Track your NGO's performance and impact metrics</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={handleExportPDF}>
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="reports-controls">
        <div className="report-type-selector">
          <label>Report Type:</label>
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
          >
            <option value="overview">Overview</option>
            <option value="donations">Donations</option>
            <option value="impact">Impact</option>
          </select>
        </div>

        <div className="period-selector">
          <label>Time Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Report Content */}
      <div className="report-content">
        <div className="report-header">
          <h2>{reportData.title}</h2>
          <span className="report-period">{reportData.period}</span>
        </div>

        {/* Overview */}
        {selectedReport === "overview" && reportData.stats?.length > 0 && (
          <>
            <div className="stats-grid">
              {reportData.stats.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-content">
                    <h3>
                      {typeof stat.value === "number"
                        ? stat.value.toLocaleString()
                        : stat.value}
                    </h3>
                    <p>{stat.label}</p>
                  </div>
                  {stat.trend && (
                    <div className="stat-trend">
                      {getTrendIcon(stat.trend)}
                      <span style={{ color: getTrendColor(stat.trend) }}>
                        {stat.change}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="chart-section">
              <h3>Monthly Trends</h3>
              {reportData.stats?.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.stats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4f46e5" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

        {/* Donations */}
        {selectedReport === "donations" && reportData.topDonors?.length > 0 && (
          <div className="top-list-section">
            <h3>Top Donors</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.topDonors}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="donations" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>

            <div className="top-list">
              {reportData.topDonors.map((donor, index) => (
                <div key={index} className="list-item">
                  <div className="item-rank">#{index + 1}</div>
                  <div className="item-info">
                    <h4>{donor.name}</h4>
                    <p>
                      {donor.donations} donations • {donor.servings} servings
                    </p>
                  </div>
                  <div className="item-badge">
                    <Heart size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impact */}
        {selectedReport === "impact" &&
          reportData.distributionByArea?.length > 0 && (
            <div className="distribution-section">
              <h3>Distribution by Area</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData.distributionByArea}
                    dataKey="servings"
                    nameKey="area"
                    outerRadius={120}
                    fill="#10b981"
                    label
                  >
                    {reportData.distributionByArea.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][
                            index % 5
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="distribution-list">
                {reportData.distributionByArea.map((area, index) => (
                  <div key={index} className="distribution-item">
                    <div className="area-info">
                      <MapPin size={16} />
                      <span>{area.area}</span>
                    </div>
                    <div className="area-stats">
                      <span className="servings">{area.servings} servings</span>
                      <span className="percentage">{area.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Key Insights */}
        <div className="insights-section">
          <h3>Key Insights</h3>
          <div className="insights-grid">
            <div className="insight-card positive">
              <CheckCircle size={20} />
              <div>
                <h4>Strong Performance</h4>
                <p>
                  Your NGO has maintained a 94% distribution rate, exceeding
                  industry average.
                </p>
              </div>
            </div>
            <div className="insight-card neutral">
              <Clock size={20} />
              <div>
                <h4>Response Time</h4>
                <p>
                  Average response time to food requests improved this period.
                </p>
              </div>
            </div>
            <div className="insight-card positive">
              <TrendingUp size={20} />
              <div>
                <h4>Growth Trend</h4>
                <p>
                  People served increased compared to last month, showing strong
                  community impact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
