import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  Users, 
  Building, 
  Calendar,
  Download,
  ChevronDown
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import '../../components/CSS/Hotel/Reports.css';

const Reports = () => {
  const [dateRange, setDateRange] = useState('6months');
  const [analyticsData, setAnalyticsData] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [foodTypeData, setFoodTypeData] = useState([]);
  const [ngoData, setNgoData] = useState([]);

  const hotelData = JSON.parse(localStorage.getItem('userInfo'));
  const hotelId = hotelData?.hotelId;
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const hotelData = JSON.parse(localStorage.getItem('userInfo'));
       const hotelId = hotelData?.hotelId;
       if (!hotelId) return;
      
        const res = await axios.get(`http://localhost:5000/api/hotelReports/${hotelId}?range=${dateRange}`);

        const data = res.data;

        setAnalyticsData({
          totalDonations: data.totalDonations,
          totalServings: data.totalServings,
          ngosServed: data.ngosServed,
          peopleFed: data.peopleFed,
          avgDonationSize: data.avgDonationSize,
          impactScore: data.impactScore || 0
        });

        setMonthlyData(data.monthlyData || []);
        setFoodTypeData(data.foodTypeData || []);
        setNgoData(data.ngoData || []);

      } catch (err) {
        console.error('Error fetching reports:', err);
      }
    };

    fetchReports();
  }, [hotelId, dateRange]);

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const handleExportReport = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
  
    // Hotel name on top
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(hotelData?.hotelName || 'Hotel Name', 105, 15, { align: 'center' });
  
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Analytics & Reports (${dateRange})`, 105, 25, { align: 'center' });
  
    let yOffset = 35;
  
    // Metrics
    const metrics = [
      { label: 'Total Donations', value: analyticsData.totalDonations },
      { label: 'Total Servings', value: analyticsData.totalServings },
      { label: 'NGO Partners', value: analyticsData.ngosServed },
      { label: 'People Fed', value: analyticsData.peopleFed }
    ];
  
    metrics.forEach((m, i) => {
      doc.text(`${m.label}: ${m.value}`, 15, yOffset + i * 7);
    });
  
    yOffset += metrics.length * 7 + 5;
  
    // Monthly Trends Table
    if (monthlyData.length) {
      autoTable(doc, {
        startY: yOffset,
        head: [['Month', 'Donations', 'Servings']],
        body: monthlyData.map(d => [d.month, d.donations, d.servings]),
        theme: 'grid'
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }
  
    // Food Type Distribution Table
    if (foodTypeData.length) {
      autoTable(doc, {
        startY: yOffset,
        head: [['Food Type', 'Percentage']],
        body: foodTypeData.map(d => [d.name, d.value + '%']),
        theme: 'grid'
      });
      yOffset = doc.lastAutoTable.finalY + 10;
    }
  
    // NGO Performance Table
    if (ngoData.length) {
      autoTable(doc, {
        startY: yOffset,
        head: [['NGO Name', 'Donations Received', 'Total Servings']],
        body: ngoData.map(d => [d.name, d.donations, d.servings]),
        theme: 'grid'
      });
    }
  
    // Save PDF
    doc.save(`${hotelData?.hotelName || 'Hotel'}_Report.pdf`);
  };
  

  const formatNumber = (num) => num?.toLocaleString() || 0;
  return (
    <div className="reports-container">
      {/* Header */}
      <div className="reports-header">
        <div className="header-content">
          <h1>Analytics & Reports</h1>
          <p>Track your impact and donation performance over time</p>
        </div>
        
        <div className="header-actions">
          <div className="date-filter">
            <select 
              value={dateRange} 
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="date-select"
            >
              <option value="1month">Last Month</option>
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="1year">Last Year</option>
            </select>
            <ChevronDown size={16} className="select-arrow" />
          </div>
          
          <button className="export-btn" onClick={handleExportReport}>
            <Download size={20} />
            Export Report
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon"><Calendar size={24} /></div>
          <div className="metric-content">
            <h3>{formatNumber(analyticsData.totalDonations)}</h3>
            <p>Total Donations</p>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon"><TrendingUp size={24} /></div>
          <div className="metric-content">
            <h3>{formatNumber(analyticsData.totalServings)}</h3>
            <p>Total Servings</p>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon"><Building size={24} /></div>
          <div className="metric-content">
            <h3>{analyticsData.ngosServed}</h3>
            <p>NGO Partners</p>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon"><Users size={24} /></div>
          <div className="metric-content">
            <h3>{formatNumber(analyticsData.peopleFed)}</h3>
            <p>People Fed</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Monthly Trend */}
        <div className="chart-card large">
          <div className="chart-header">
            <h3>Donation Trends</h3>
          </div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="donations" stroke="#3b82f6" strokeWidth={3} />
                <Line type="monotone" dataKey="servings" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Food Type Distribution */}
        <div className="chart-card">
          <div className="chart-header"><h3>Food Type Distribution</h3></div>
          <div className="chart-content">
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={foodTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name }) => name}       
                  labelLine={false}                
                  fill="#8884d8"

                >
                  {foodTypeData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
            <div className="pie-legend">
              {foodTypeData.map((item, index) => (
                <div key={index} className="pie-legend-item">
                  <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                  <span>{item.name}</span>
                  <span className="percentage">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NGO Table */}
      <div className="performance-section">
        <div className="section-header">
          <h3>NGO Partnership Performance</h3>
        </div>
        <div className="performance-table">
          <div className="table-header">
            <div>NGO Name</div>
            <div>Donations Received</div>
            <div>Total Servings</div>
          </div>
          <div className="table-body">
            {ngoData.map((ngo, index) => (
              <div key={index} className="table-row">
                <div className="ngo-info">
                  <div className="ngo-avatar">{ngo.name.charAt(0)}</div>
                  <span className="ngo-name">{ngo.name}</span>
                </div>
                <div className="donations-count">{ngo.donations}</div>
                <div className="servings-count">{formatNumber(ngo.servings)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;