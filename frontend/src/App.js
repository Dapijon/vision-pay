import React, { useState, useEffect } from 'react';
import { MapPin, Users, DollarSign, AlertTriangle, Calendar, Navigation, Plus, Save, TrendingUp, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'; // New Leaflet imports
import L from 'leaflet'; 
import 'leaflet/dist/leaflet.css';
import './style.css'; 

const JAC_API_URL = 'http://localhost:8000';

// Custom icons for Leaflet (You should place corresponding images in your public folder)
const officerIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconRetinaUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const memberIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconRetinaUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  shadowSize: [41, 41]
});

const overdueIcon = new L.Icon({
  iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconRetinaUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
  shadowSize: [41, 41]
});

// Component to handle map clicks for location setting
function MapClickHandler({ setLocation }) {
  const map = useMapEvents({
    click: (e) => {
      setLocation(e.latlng);
    },
  });
  return null;
}

// Main App Component
function VisionPayComplete() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddModal, setShowAddModal] = useState(null); // 'officer' or 'member'
  const [listeningForLocation, setListeningForLocation] = useState(null); // 'officer' or 'member' form is listening

  // Data states
  const [officers, setOfficers] = useState([]);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [riskZones, setRiskZones] = useState([]);
  const [aiInsights, setAiInsights] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  // Form states
  const [officerForm, setOfficerForm] = useState({
    id: '',
    name: '',
    latitude: '',
    longitude: ''
  });
  
  const [memberForm, setMemberForm] = useState({
    id: '',
    name: '',
    latitude: '',
    longitude: '',
    amount: '',
    payment_status: 'pending',
    officer_id: '',
    payment_date: ''
  });
  
  const [settings, setSettings] = useState({
    radius_km: 50,
    payday_frequency: 'weekly' // weekly, biweekly, monthly
  });

  // Function to handle map click and set form location
  const handleMapClickLocation = (latlng) => {
    const lat = latlng.lat.toFixed(6);
    const lng = latlng.lng.toFixed(6);

    if (listeningForLocation === 'officer') {
      setOfficerForm({ ...officerForm, latitude: lat, longitude: lng });
      alert(`Officer location captured: ${lat}, ${lng}`);
    } else if (listeningForLocation === 'member') {
      setMemberForm({ ...memberForm, latitude: lat, longitude: lng });
      alert(`Member location captured: ${lat}, ${lng}`);
    }
    setListeningForLocation(null);
    setActiveTab('map'); // Stay on map to confirm location or switch back to forms if needed
  };

  // Fetch all data (Mock data removed as requested)
  const fetchAllData = async () => {
    try {
      // Fetch stats
      const statsRes = await fetch(`${JAC_API_URL}/walker/GetDashboardStats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch officers
      const officersRes = await fetch(`${JAC_API_URL}/walker/GetOfficers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const officersData = await officersRes.json();
      // Ensure data structure matches expectation even if empty
      setOfficers(Array.isArray(officersData) ? officersData : []);

      // Fetch members
      const membersRes = await fetch(`${JAC_API_URL}/walker/GetMembers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const membersData = await membersRes.json();
      setMembers(Array.isArray(membersData) ? membersData : []);

      // Fetch risk zones
      const riskRes = await fetch(`${JAC_API_URL}/walker/AnalyzeRiskZones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const riskData = await riskRes.json();
      setRiskZones(Array.isArray(riskData) ? riskData : []);

    } catch (error) {
      console.error('Error fetching data:', error);
      // No mock data loaded - start will be empty as requested
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Auto-assign members
  const handleAutoAssign = async () => {
    try {
      const response = await fetch(`${JAC_API_URL}/walker/AssignMembersToOfficers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          radius_km: settings.radius_km
        })
      });
      const data = await response.json();
      alert(`Auto-Assignment complete: Assigned ${data.assigned_count || 0} members within ${settings.radius_km}km radius.`);
      console.log('Assignment results:', data);
      await fetchAllData();
    } catch (error) {
      console.error('Error during auto-assignment:', error);
      alert('Failed to run auto-assignment. Check console for details.');
    }
  };

  // Add officer
  const handleAddOfficer = async () => {
    if (!officerForm.id || !officerForm.name || !officerForm.latitude || !officerForm.longitude) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      const response = await fetch(`${JAC_API_URL}/walker/AddOfficer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(officerForm.id),
          name: officerForm.name,
          latitude: parseFloat(officerForm.latitude),
          longitude: parseFloat(officerForm.longitude)
        })
      });
      
      if (response.ok) {
        alert('Officer added successfully! Running auto-assignment...');
        setOfficerForm({ id: '', name: '', latitude: '', longitude: '' });
        setShowAddModal(null);
        await fetchAllData();
        await handleAutoAssign(); // Run assignment after adding
      } else {
         throw new Error(`API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding officer:', error);
      alert(`Failed to add officer: ${error.message}`);
    }
  };

  // Add member
  const handleAddMember = async () => {
    if (!memberForm.id || !memberForm.name || !memberForm.latitude || !memberForm.longitude || !memberForm.amount) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const response = await fetch(`${JAC_API_URL}/walker/AddMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: parseInt(memberForm.id),
          name: memberForm.name,
          latitude: parseFloat(memberForm.latitude),
          longitude: parseFloat(memberForm.longitude),
          amount: parseFloat(memberForm.amount),
          payment_status: memberForm.payment_status,
          officer_id: parseInt(memberForm.officer_id) || 0
        })
      });
      
      if (response.ok) {
        alert('Member added successfully! Running auto-assignment...');
        setMemberForm({ 
          id: '', name: '', latitude: '', longitude: '', 
          amount: '', payment_status: 'pending', officer_id: '', payment_date: '' 
        });
        setShowAddModal(null);
        await fetchAllData();
        await handleAutoAssign(); // Run assignment after adding
      } else {
         throw new Error(`API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding member:', error);
      alert(`Failed to add member: ${error.message}`);
    }
  };

  // Get optimized route
  const handleGetRoute = async (officerId) => {
    try {
      const response = await fetch(`${JAC_API_URL}/walker/OptimizeRoute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ officer_id: officerId })
      });
      const data = await response.json();
      setSelectedRoute(data);
      if (data.route && data.route.length > 0) {
        setActiveTab('map'); // Switch to map to view the route
      } else {
        alert('No route data returned. Check officer assignment.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to get optimized route.');
    }
  };

  // Generate AI insights
  const handleGenerateAI = async () => {
    try {
      const response = await fetch(`${JAC_API_URL}/walker/GenerateAISummary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await response.json();
      setAiInsights(data.summary || 'No insights available');
    } catch (error) {
      setAiInsights('Failed to connect to AI analysis backend. Please check JAC service status.');
    }
  };

  // Function to start listening for map clicks for location
  const startLocationListener = (formType) => {
    setListeningForLocation(formType);
    setShowAddModal(null); // Close the modal
    setActiveTab('map'); // Switch to map tab
    alert('Click on the map to set the location for the new ' + formType + '.');
  };

  // Record payment
  const handleRecordPayment = async (memberId) => {
    try {
      const member = members.find(m => m.id === memberId);
      const response = await fetch(`${JAC_API_URL}/walker/RecordPayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          amount: member.amount,
          officer_id: member.officer_id
        })
      });
      if (response.ok) {
        alert('Payment recorded!');
        fetchAllData();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to record payment.');
    }
  };

  const displayStats = stats || { total_members: 0, paid_today: 0, overdue_members: 0, total_collected: 0 };
  
  // Calculate map center - use a default (Nairobi) if no data, or center on the first officer
  const defaultCenter = [-1.286389, 36.817223]; 
  const mapCenter = officers.length > 0 && officers[0].location?.lat && officers[0].location?.lng
    ? [officers[0].location.lat, officers[0].location.lng]
    : defaultCenter;

  const routeCoordinates = selectedRoute?.route?.map(stop => [stop.member?.location?.lat, stop.member?.location?.lng]) || [];

  return (
    <div className="app-container">
      {/* Header */}
      <div className="header-bar">
        <div className="header-content">
          <div>
            <h1 className="app-title">VisionPay</h1>
            <p className="app-subtitle">Location-Aware Microfinance System</p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setShowAddModal('officer')}
              className="action-button primary"
            >
              <Plus size={20} />
              Add Officer
            </button>
            <button
              onClick={() => setShowAddModal('member')}
              className="action-button primary"
            >
              <Plus size={20} />
              Add Member
            </button>
          </div>
        </div>
      </div>

      <div className="main-content-wrapper">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label">Total Members</p>
                <p className="stat-value">{displayStats.total_members}</p>
              </div>
              <Users className="icon-blue" size={32} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label">Collected Today</p>
                <p className="stat-value text-green">KES {displayStats.total_collected?.toLocaleString()}</p>
              </div>
              <DollarSign className="icon-green" size={32} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label">Paid Today</p>
                <p className="stat-value text-blue">{displayStats.paid_today}/{displayStats.total_members}</p>
              </div>
              <Calendar className="icon-blue" size={32} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label">Overdue</p>
                <p className="stat-value text-red">{displayStats.overdue_members}</p>
              </div>
              <AlertTriangle className="icon-red" size={32} />
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="main-panel">
          <div className="tab-bar">
            {['overview', 'members', 'map', 'ai', 'settings'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {/* Officers & Routes Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="section-title">Collection Officers</h2>
                <div className="officers-list">
                  {officers.map((officer) => (
                    <div key={officer.id} className="officer-card">
                      <div className="officer-header">
                        <div>
                          <h3 className="officer-name">{officer.name}</h3>
                          <p className="officer-location">
                            <MapPin size={14} className="inline-icon" /> 
                            Lat: {officer.location?.lat?.toFixed(4)}, Lng: {officer.location?.lng?.toFixed(4)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleGetRoute(officer.id)}
                          className="button-sm button-blue"
                        >
                          View Route
                        </button>
                      </div>
                      <div className="officer-stats-grid">
                        <div>
                          <p className="stat-label-sm">Assigned</p>
                          <p className="stat-value-sm">{officer.members_assigned}</p>
                        </div>
                        <div>
                          <p className="stat-label-sm">Collected</p>
                          <p className="stat-value-sm text-green">{officer.collections_today}</p>
                        </div>
                        <div>
                          <p className="stat-label-sm">Completion</p>
                          <p className="stat-value-sm">{officer.members_assigned > 0 ? ((officer.collections_today / officer.members_assigned) * 100).toFixed(0) : 0}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedRoute && (
                  <div className="route-panel">
                    <h3 className="route-title">
                      <Navigation size={20} className="icon-blue" />
                      Optimized Route
                    </h3>
                    <p className="route-meta">
                      {selectedRoute.total_members} stops • {selectedRoute.total_distance_km} km • {selectedRoute.estimated_time_hours} hours
                    </p>
                    <div className="route-stops-list">
                      {selectedRoute.route?.slice(0, 5).map((stop, idx) => (
                        <div key={idx} className="route-stop-item">
                          <span>{idx + 1}. {stop.member?.name}</span>
                          <span className="text-gray">{stop.distance_km} km</span>
                        </div>
                      ))}
                      {selectedRoute.route?.length > 5 && (
                          <div className="route-stop-item">
                            <span>... and {selectedRoute.route.length - 5} more stops</span>
                          </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Members Tab */}
            {activeTab === 'members' && (
              <div>
                <h2 className="section-title">Members & Payments</h2>
                <div className="members-list">
                  {members.map((member) => (
                    <div key={member.id} className="member-card">
                      <div className="member-details">
                        <div>
                          <h3 className="member-name">{member.name}</h3>
                          <p className="member-amount">KES {member.amount?.toLocaleString()}</p>
                          <p className="member-officer">Officer: {officers.find(o => o.id === member.officer_id)?.name || 'Unassigned'}</p>
                        </div>
                        <div className="member-actions">
                          <span className={`payment-status ${member.payment_status}`}>
                            {member.payment_status?.toUpperCase()}
                          </span>
                          {member.payment_status === 'pending' && (
                            <button
                              onClick={() => handleRecordPayment(member.id)}
                              className="button-sm button-green"
                            >
                              Record Payment
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Map View Tab (New Leaflet Integration) */}
            {activeTab === 'map' && (
              <div>
                <h2 className="section-title">Geographic View</h2>
                
                {listeningForLocation && (
                    <div className="map-instruction-banner">
                        <MapPin size={20} className="inline-icon" />
                        **ACTION REQUIRED:** Click on the map to set the location for the new {listeningForLocation}.
                    </div>
                )}

                <div className="map-container-leaflet">
                  <MapContainer 
                    center={mapCenter} 
                    zoom={13} 
                    scrollWheelZoom={true}
                    style={{ height: '400px', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* The click handler is only active when a form is listening */}
                    {listeningForLocation && <MapClickHandler setLocation={handleMapClickLocation} />}

                    {/* Officer Markers */}
                    {officers.map(officer => (
                      <Marker 
                        key={`officer-${officer.id}`} 
                        position={[officer.location.lat, officer.location.lng]} 
                        icon={officerIcon}
                      >
                        <L.Popup>
                          **Officer: {officer.name}**
                          <br />Assigned Members: {officer.members_assigned}
                        </L.Popup>
                      </Marker>
                    ))}
                    
                    {/* Member Markers */}
                    {members.map(member => {
                      let icon = memberIcon;
                      if (member.payment_status === 'overdue') {
                        icon = overdueIcon;
                      }

                      return (
                        <Marker 
                          key={`member-${member.id}`} 
                          position={[member.location.lat, member.location.lng]} 
                          icon={icon}
                        >
                          <L.Popup>
                            **Member: {member.name}**
                            <br />Amount: KES {member.amount?.toLocaleString()}
                            <br />Status: {member.payment_status?.toUpperCase()}
                          </L.Popup>
                        </Marker>
                      );
                    })}
                    
                    {/* Optimized Route Polyline */}
                    {routeCoordinates.length > 0 && (
                        <Polyline 
                          pathOptions={{ color: 'blue', weight: 4, opacity: 0.7 }} 
                          positions={routeCoordinates} 
                        />
                    )}
                  </MapContainer>
                </div>

                <div className="risk-zones-grid">
                  <div className="risk-zone-card safe">
                    <h3 className="risk-zone-title text-green">Safe Zones (Low Risk)</h3>
                    {riskZones.filter(z => z.risk_level === 'low').map((zone, i) => (
                      <div key={i} className="zone-item">
                        <p className="zone-name">{zone.zone_name}</p>
                        <p className="zone-details">{zone.overdue_rate}% overdue • {zone.members_count} members</p>
                      </div>
                    ))}
                  </div>
                  <div className="risk-zone-card high">
                    <h3 className="risk-zone-title text-red">High Risk Zones</h3>
                    {riskZones.filter(z => z.risk_level === 'high' || z.risk_level === 'medium').map((zone, i) => (
                      <div key={i} className="zone-item">
                        <p className="zone-name">{zone.zone_name}</p>
                        <p className="zone-details">{zone.overdue_rate}% overdue • {zone.members_count} members</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === 'ai' && (
              <div>
                <div className="ai-header">
                  <h2 className="section-title">AI-Powered Analysis</h2>
                  <button
                    onClick={handleGenerateAI}
                    className="button button-purple"
                  >
                    <TrendingUp size={20} />
                    Generate Insights
                  </button>
                </div>

                {aiInsights && (
                  <div className="ai-result-box">
                    <h3 className="ai-result-title">AI Analysis Results</h3>
                    <pre className="ai-result-text">{aiInsights}</pre>
                  </div>
                )}

                <div className="insights-list">
                  <div className="insight-card">
                    <h3 className="insight-title">Risk Zone Analysis</h3>
                    {riskZones.map((zone, i) => (
                      <div key={i} className="zone-analysis-item">
                        <div className="zone-analysis-header">
                          <span className="zone-name-span">{zone.zone_name}</span>
                          <span className={`zone-tag ${zone.risk_level}`}>{zone.risk_level?.toUpperCase()}</span>
                        </div>
                        <p className="zone-analysis-details">
                          Overdue Rate: {zone.overdue_rate}% • {zone.members_count} members
                        </p>
                        <p className="zone-analysis-tip">
                          {zone.risk_level === 'high' && ' Requires immediate attention. Increase officer visits.'}
                          {zone.risk_level === 'medium' && ' Monitor closely for trends.'}
                          {zone.risk_level === 'low' && ' Safe zone. Maintain current schedule.'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="section-title">System Settings</h2>
                
                <div className="settings-grid">
                  <div className="setting-card">
                    <h3 className="setting-title">Assignment Radius</h3>
                    <p className="setting-description">
                      Members within **{settings.radius_km}km** of an officer's assigned area will be auto-assigned.
                    </p>
                    <div className="setting-slider-group">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={settings.radius_km}
                        onChange={(e) => setSettings({ ...settings, radius_km: parseInt(e.target.value) })}
                        className="slider-input"
                      />
                      <span className="slider-value">{settings.radius_km} km</span>
                    </div>
                    <button
                      onClick={handleAutoAssign}
                      className="button button-blue"
                    >
                      Run Auto-Assignment
                    </button>
                  </div>

                  <div className="setting-card">
                    <h3 className="setting-title">Payment Schedule</h3>
                    <p className="setting-description">
                      Schedule for payment collection notices and officer deployment planning.
                    </p>
                    <select
                      value={settings.payday_frequency}
                      onChange={(e) => setSettings({ ...settings, payday_frequency: e.target.value })}
                      className="select-input"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div className="info-box">
                    <h3 className="setting-title">System Info</h3>
                    <ul className="info-list">
                      <li>• Officers: {officers.length}</li>
                      <li>• Members: {members.length}</li>
                      <li>• Active Zones: {riskZones.length}</li>
                      <li>• Assignment Radius: {settings.radius_km}km</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Officer Modal */}
      {showAddModal === 'officer' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Collection Officer</h3>
              <button onClick={() => setShowAddModal(null)} className="modal-close">
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Officer ID</label>
                <input
                  type="number"
                  value={officerForm.id}
                  onChange={(e) => setOfficerForm({ ...officerForm, id: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 4"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  value={officerForm.name}
                  onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Jane Doe"
                />
              </div>
              <div className="input-grid">
                <div className="input-group">
                  <label className="input-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={officerForm.latitude}
                    onChange={(e) => setOfficerForm({ ...officerForm, latitude: e.target.value })}
                    className="input-field"
                    placeholder="Click on Map"
                    readOnly 
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={officerForm.longitude}
                    onChange={(e) => setOfficerForm({ ...officerForm, longitude: e.target.value })}
                    className="input-field"
                    placeholder="Click on Map"
                    readOnly
                  />
                </div>
              </div>

              <button
                onClick={() => startLocationListener('officer')}
                className="button button-blue w-full-flex"
              >
                <MapPin size={20} />
                Select Location on Map
              </button>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(null)}
                className="button-flex button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOfficer}
                className="button-flex button-green"
                disabled={!officerForm.latitude || !officerForm.longitude}
              >
                <Save size={20} />
                Save Officer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal === 'member' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Member</h3>
              <button onClick={() => setShowAddModal(null)} className="modal-close">
                <X size={24} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="input-grid">
                <div className="input-group">
                  <label className="input-label">Member ID</label>
                  <input
                    type="number"
                    value={memberForm.id}
                    onChange={(e) => setMemberForm({ ...memberForm, id: e.target.value })}
                    className="input-field"
                    placeholder="5"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    value={memberForm.name}
                    onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                    className="input-field"
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="input-grid">
                <div className="input-group">
                  <label className="input-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={memberForm.latitude}
                    onChange={(e) => setMemberForm({ ...memberForm, latitude: e.target.value })}
                    className="input-field"
                    placeholder="Click on Map"
                    readOnly
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={memberForm.longitude}
                    onChange={(e) => setMemberForm({ ...memberForm, longitude: e.target.value })}
                    className="input-field"
                    placeholder="Click on Map"
                    readOnly
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Payment Amount (KES)</label>
                <input
                  type="number"
                  value={memberForm.amount}
                  onChange={(e) => setMemberForm({ ...memberForm, amount: e.target.value })}
                  className="input-field"
                  placeholder="1000"
                />
              </div>
              <div className="input-grid">
                <div className="input-group">
                  <label className="input-label">Status</label>
                  <select
                    value={memberForm.payment_status}
                    onChange={(e) => setMemberForm({ ...memberForm, payment_status: e.target.value })}
                    className="input-field select-input"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Officer ID (Optional)</label>
                  <input
                    type="number"
                    value={memberForm.officer_id}
                    onChange={(e) => setMemberForm({ ...memberForm, officer_id: e.target.value })}
                    className="input-field"
                    placeholder="Auto"
                  />
                </div>
              </div>
              <button
                onClick={() => startLocationListener('member')}
                className="button button-blue w-full-flex"
              >
                <MapPin size={20} />
                Select Location on Map
              </button>
            </div>
            
            <div className="modal-footer">
              <button
                onClick={() => setShowAddModal(null)}
                className="button-flex button-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                className="button-flex button-green"
                disabled={!memberForm.latitude || !memberForm.longitude}
              >
                <Save size={20} />
                Save Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisionPayComplete;