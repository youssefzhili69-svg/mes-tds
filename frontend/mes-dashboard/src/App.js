import { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const API = "http://localhost:8000/api";

const STATUS_MAP = {
  "1": { label: "En attente", color: "#f59e0b" },
  "3": { label: "En cours",   color: "#3b82f6" },
  "9": { label: "Terminé",    color: "#10b981" },
};

export default function App() {
  const [orders, setOrders]   = useState([]);
  const [stats, setStats]     = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/stats`),
      ]);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setStats(statsRes.data);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (e) {
      setError("Impossible de contacter le backend MES");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh 10s
    return () => clearInterval(interval);
  }, []);

  const chartData = [
    { name: "En attente", value: stats.en_attente || 0, color: "#f59e0b" },
    { name: "En cours",   value: stats.en_cours   || 0, color: "#3b82f6" },
    { name: "Terminés",   value: stats.termines   || 0, color: "#10b981" },
  ];

  return (
    <div style={styles.app}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>⚙️ MES — TDS Industry 4.0</h1>
          <p style={styles.subtitle}>Manufacturing Execution System</p>
        </div>
        <div style={styles.headerRight}>
          {lastUpdate && (
            <span style={styles.updateBadge}>🔄 {lastUpdate}</span>
          )}
          <button onClick={fetchData} style={styles.refreshBtn}>
            Actualiser
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>⚠️ {error}</div>}

      {/* KPI CARDS */}
      <div style={styles.kpiRow}>
        {[
          { label: "Total OF",    value: stats.total      || 0, color: "#6366f1" },
          { label: "En attente",  value: stats.en_attente || 0, color: "#f59e0b" },
          { label: "En cours",    value: stats.en_cours   || 0, color: "#3b82f6" },
          { label: "Terminés",    value: stats.termines   || 0, color: "#10b981" },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...styles.kpiCard, borderTop: `4px solid ${kpi.color}` }}>
            <div style={{ ...styles.kpiValue, color: kpi.color }}>{kpi.value}</div>
            <div style={styles.kpiLabel}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={styles.mainGrid}>
        {/* CHART */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📊 Répartition des Ordres</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "none", color: "#fff" }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MACHINES STATUS (simulé) */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>🏭 État des Postes</h2>
          {[
            { nom: "Poste Préparation",   statut: "actif",   color: "#10b981" },
            { nom: "Cellule Robotique",   statut: "actif",   color: "#10b981" },
            { nom: "Assemblage",          statut: "attente", color: "#f59e0b" },
            { nom: "Contrôle Qualité",    statut: "arrêt",   color: "#ef4444" },
            { nom: "Magasin",             statut: "actif",   color: "#10b981" },
          ].map((m) => (
            <div key={m.nom} style={styles.machineRow}>
              <span style={{ ...styles.dot, background: m.color }} />
              <span style={styles.machineName}>{m.nom}</span>
              <span style={{ ...styles.machineBadge, color: m.color }}>
                {m.statut}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ORDERS TABLE */}
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>📋 Ordres de Fabrication — Dolibarr</h2>
        {loading ? (
          <p style={{ color: "#94a3b8" }}>Chargement...</p>
        ) : orders.length === 0 ? (
          <p style={{ color: "#94a3b8" }}>Aucun ordre trouvé.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {["Réf.", "Produit", "Qté", "Statut", "Date"].map((h) => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 20).map((o, i) => {
                  const s = STATUS_MAP[String(o.status)] || { label: o.status, color: "#94a3b8" };
                  return (
                    <tr key={i} style={i % 2 === 0 ? styles.trEven : {}}>
                      <td style={styles.td}>{o.ref || o.rowid}</td>
                      <td style={styles.td}>{o.product_label || o.label || "—"}</td>
                      <td style={styles.td}>{o.qty || o.quantity || "—"}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, background: s.color + "22", color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {o.date_creation
                          ? new Date(o.date_creation * 1000).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  app:          { minHeight: "100vh", background: "#0f172a", color: "#e2e8f0", fontFamily: "Inter, sans-serif", padding: "24px" },
  header:       { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  title:        { fontSize: "24px", fontWeight: "700", margin: 0 },
  subtitle:     { color: "#64748b", margin: "4px 0 0", fontSize: "14px" },
  headerRight:  { display: "flex", alignItems: "center", gap: "12px" },
  updateBadge:  { background: "#1e293b", padding: "6px 12px", borderRadius: "20px", fontSize: "13px", color: "#94a3b8" },
  refreshBtn:   { background: "#3b82f6", color: "#fff", border: "none", padding: "8px 18px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" },
  error:        { background: "#7f1d1d", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" },
  kpiRow:       { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
  kpiCard:      { background: "#1e293b", borderRadius: "12px", padding: "20px", textAlign: "center" },
  kpiValue:     { fontSize: "36px", fontWeight: "800" },
  kpiLabel:     { color: "#94a3b8", fontSize: "13px", marginTop: "4px" },
  mainGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" },
  card:         { background: "#1e293b", borderRadius: "12px", padding: "20px", marginBottom: "0" },
  cardTitle:    { fontSize: "16px", fontWeight: "700", marginBottom: "16px", marginTop: 0 },
  machineRow:   { display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #334155" },
  dot:          { width: "10px", height: "10px", borderRadius: "50%", flexShrink: 0 },
  machineName:  { flex: 1, fontSize: "14px" },
  machineBadge: { fontSize: "12px", fontWeight: "600", textTransform: "uppercase" },
  table:        { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th:           { textAlign: "left", padding: "10px 14px", color: "#64748b", borderBottom: "1px solid #334155", fontWeight: "600" },
  td:           { padding: "10px 14px", borderBottom: "1px solid #1e293b22" },
  trEven:       { background: "#ffffff08" },
  statusBadge:  { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
};