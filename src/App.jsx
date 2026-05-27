import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const logoUrl = '/logo-ecotrack.png'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCompany, setHasCompany] = useState(false);
  const [userRol, setUserRol] = useState('user');
  const [userData, setUserData] = useState({ nombre: '' });
  const [companyData, setCompanyData] = useState({ nombreComercial: '', rfc: '', ciudad: '' });
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '' });
  const [registros, setRegistros] = useState([]);

  const [luz, setLuz] = useState({ actual: 0, anterior: 0 });
  const [agua, setAgua] = useState({ actual: 0, anterior: 0 });
  const [residuos, setResiduos] = useState({ organicos: 0, inorganicos: 0, otros: 0 });

  const cargarDatos = async () => {
    try {
      const res = await fetch('https://ecotrack-server-v1.onrender.com/api/registros');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRegistros(data);
        if (data.length > 0) {
          setLuz(prev => ({ ...prev, anterior: data[0].luz }));
          setAgua(prev => ({ ...prev, anterior: data[0].agua }));
        }
      }
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  };

  useEffect(() => {
    if (isLoggedIn && hasCompany) {
      cargarDatos();
    }
  }, [isLoggedIn, hasCompany]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setHasCompany(false);
    setUserRol('user');
  };

  // --- FUNCIÓN PARA GENERAR EL PDF CORREGIDA Y PROTEGIDA ---
  const generarReportePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Título principal
      doc.setFontSize(20);
      doc.setTextColor(6, 95, 70); // Verde EcoTrack
      doc.text("Reporte de Sostenibilidad - EcoTrack", 14, 22);
      
      // Información del reporte y usuario
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Empresa: ${companyData.nombreComercial || 'EcoTrack Principal'}`, 14, 32);
      doc.text(`Generado por: ${userData.nombre || 'Usuario'} (Rol: ${(userRol || 'user').toUpperCase()})`, 14, 38);
      doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 44);

      // Preparar los datos para la tabla
      const tableColumn = ["Fecha", "Luz (kWh)", "Agua (m³)", "Residuos Totales (kg)"];
      const tableRows = [];

      // Validar si hay registros
      if (registros && registros.length > 0) {
        registros.forEach(r => {
          const totalResiduos = Number(r.organicos || 0) + Number(r.inorganicos || 0) + Number(r.otros || 0);
          const fecha = r.fecha_registro ? new Date(r.fecha_registro).toLocaleDateString() : new Date().toLocaleDateString();
          const rowData = [
            fecha,
            r.luz || 0,
            r.agua || 0,
            totalResiduos
          ];
          tableRows.push(rowData);
        });
      } else {
        tableRows.push(["Sin datos", "0", "0", "0"]);
      }

      // Dibujar la tabla en el PDF
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129] }, // Color verde del header
        alternateRowStyles: { fillColor: [243, 244, 246] } // Color gris para filas alternas
      });

      // Guardar el documento
      doc.save("Reporte_EcoTrack.pdf");
    } catch (error) {
      console.error("Error completo del PDF:", error);
      alert("Error al generar el PDF: " + error.message);
    }
  };

  const cardStyle = { 
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    backdropFilter: 'blur(10px)',
    padding: '25px', 
    borderRadius: '20px', 
    boxShadow: '0 8px 20px rgba(0,0,0,0.05)', 
    border: '1px solid #d1fae5'
  };

  // --- VISTA 1: LOGIN ---
  if (!isLoggedIn) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #064e3b 0%, #16a34a 100%)' }}>
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '25px', width: '400px', textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' }}>
          <h2 style={{ color: '#065f46', marginBottom: '20px' }}>{isRegistering ? 'Crear Cuenta Personal' : 'EcoTrack Login'}</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isRegistering && (
              <input type="text" placeholder="Tu nombre" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
            )}
            <input type="email" placeholder="Correo electrónico" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} 
              onChange={(e) => setFormData({...formData, correo: e.target.value})} />
            <input type="password" placeholder="Contraseña" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} />
            
            <button onClick={async () => {
              if (!formData.correo || !formData.password) return alert("Llena los campos");

              const url = isRegistering ? 'registro' : 'login';
              
              try {
                const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/${url}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(formData)
                });
                
                const data = await res.json();

                if (res.ok) {
                  if (isRegistering) {
                    alert("✅ Registro exitoso. ¡Inicia sesión!");
                    setIsRegistering(false);
                  } else {
                    const correoIngresado = formData.correo.trim().toLowerCase();
                    
                    if (
                      correoIngresado === 'lopezperezdavidantonio8@gmail.com' || 
                      correoIngresado === '230i0030@martineztorre.tecnm.mx' ||
                      correoIngresado === 'solecitocortes75@gmail.com'
                    ) {
                      setUserRol('admin');
                    } else {
                      setUserRol('user');
                    }
                    
                    setIsLoggedIn(true); 
                    setUserData({ nombre: data.nombre || 'Usuario' });
                  }
                } else {
                  alert(data.message || "Error en el acceso");
                }
              } catch (error) {
                alert("Error de conexión con el servidor");
              }
            }} type="button" style={{ padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isRegistering ? 'REGISTRARME' : 'ENTRAR'}
            </button>
          </form>
          <button onClick={() => setIsRegistering(!isRegistering)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}>
            {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA 2: EMPRESA ---
  if (isLoggedIn && !hasCompany) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ecfdf5' }}>
        <div style={{ ...cardStyle, width: '450px', textAlign: 'center' }}>
          <h2 style={{ color: '#065f46' }}>Bienvenido, {userData.nombre}</h2>
          <div style={{ marginBottom: '15px', fontWeight: 'bold', color: userRol === 'admin' ? '#ef4444' : '#3b82f6', fontSize: '14px' }}>
            Nivel de Acceso Asignado: {userRol.toUpperCase()}
          </div>
          <button onClick={() => {
              setCompanyData({ nombreComercial: 'EcoTrack Principal' });
              setHasCompany(true);
            }} style={{ padding: '15px', background: '#065f46', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            🏢 Entrar a: EcoTrack Principal
          </button>
        </div>
      </div>
    );
  }

  // --- VISTA 3: DASHBOARD ---
  const ultimoRegistro = registros[0] || {};

  const pieData = [
    { name: 'Orgánicos', value: Number(ultimoRegistro.organicos) || 0 },
    { name: 'Inorgánicos', value: Number(ultimoRegistro.inorganicos) || 0 },
    { name: 'Otros', value: Number(ultimoRegistro.otros) || 0 },
  ].filter(d => d.value > 0);
  
  const COLORS = ['#4ade80', '#10b981', '#064e3b'];

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#ecfdf5', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px 50px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #10b981' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={logoUrl} alt="Logo" style={{ height: '50px' }} />
          <h1 style={{ color: '#065f46', margin: 0 }}>EcoTrack</h1>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: '20px'}}>
            <div style={{textAlign: 'right'}}>
              <div style={{ fontWeight: 'bold', color: '#374151' }}>{userData.nombre}</div>
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>📍 {companyData.nombreComercial}</div>
            </div>
            <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>
      </header>

      <main style={{ padding: '40px' }}>
        {/* EL BOTÓN AHORA ES VISIBLE PARA TODOS (RESPETANDO LOS PERMISOS) */}
        <div style={{ ...cardStyle, marginBottom: '30px', borderLeft: '6px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#065f46', marginTop: 0 }}>📊 Panel de Sostenibilidad</h2>
            <p style={{ color: '#4b5563', margin: 0 }}>Gestiona y visualiza tu impacto ambiental en tiempo real.</p>
          </div>
          <button onClick={generarReportePDF} style={{ padding: '12px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            🖨️ Descargar Reporte PDF
          </button>
        </div>

        <div style={{ ...cardStyle, marginBottom: '30px' }}>
          <h3 style={{marginTop:0, color:'#374151'}}>Nuevo Registro de Consumo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '15px', alignItems: 'flex-end' }}>
            <div><label style={{fontWeight:'bold'}}>⚡ Luz</label><input type="number" onChange={(e) => setLuz({...luz, actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #fbbf24'}} /></div>
            <div><label style={{fontWeight:'bold'}}>💧 Agua</label><input type="number" onChange={(e) => setAgua({...agua, actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #38bdf8'}} /></div>
            <div><label style={{fontWeight:'bold'}}>♻️ Org.</label><input type="number" onChange={(e) => setResiduos({...residuos, organicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #4ade80'}} /></div>
            <div><label style={{fontWeight:'bold'}}>♻️ Inorg.</label><input type="number" onChange={(e) => setResiduos({...residuos, inorganicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #10b981'}} /></div>
            <div><label style={{fontWeight:'bold'}}>♻️ Otros</label><input type="number" onChange={(e) => setResiduos({...residuos, otros: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #065f46'}} /></div>
            <button onClick={async () => {
                const payload = {luz: Number(luz.actual), agua: Number(agua.actual), organicos: Number(residuos.organicos), inorganicos: Number(residuos.inorganicos), otros: Number(residuos.otros)};
                const res = await fetch('https://ecotrack-server-v1.onrender.com/api/registros', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                if (res.ok) { alert("✅ Guardado en Neon (PostgreSQL)"); cargarDatos(); }
              }} style={{ padding: '12px 25px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor:'pointer', fontWeight:'bold' }}>GUARDAR</button>
          </div>
        </div>

        <div style={{ ...cardStyle, marginBottom: '30px' }}>
          <h3 style={{ color: '#065f46', marginTop: 0 }}>📋 Últimos Registros en la Nube (PostgreSQL)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #10b981', color: '#374151' }}>
                <th style={{ padding: '10px' }}>Fecha</th>
                <th>Luz (kWh)</th>
                <th>Agua (m³)</th>
                <th>Residuos (kg)</th>
                {userRol === 'admin' && <th>Acciones CRUD</th>}
              </tr>
            </thead>
            <tbody style={{ color: '#1f2937' }}>
              {registros.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', color: '#1f2937' }}>{new Date(r.fecha_registro).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold', color: '#1f2937' }}>{r.luz}</td>
                  <td style={{ fontWeight: 'bold', color: '#1f2937' }}>{r.agua}</td>
                  <td style={{ fontWeight: 'bold', color: '#1f2937' }}>
                    {Number(r.organicos || 0) + Number(r.inorganicos || 0) + Number(r.otros || 0)}
                  </td>
                  {userRol === 'admin' && (
                    <td>
                      <button onClick={async () => {
                        const nuevaLuz = prompt("Nuevo valor de LUZ (kWh):", r.luz);
                        if (nuevaLuz === null) return;
                        
                        const nuevaAgua = prompt("Nuevo valor de AGUA (m³):", r.agua);
                        if (nuevaAgua === null) return;

                        const nuevosOrg = prompt("Nuevo valor de ORGÁNICOS (kg):", r.organicos || 0);
                        if (nuevosOrg === null) return;

                        const nuevosInorg = prompt("Nuevo valor de INORGÁNICOS (kg):", r.inorganicos || 0);
                        if (nuevosInorg === null) return;

                        const nuevosOtros = prompt("Nuevo valor de OTROS (kg):", r.otros || 0);
                        if (nuevosOtros === null) return;

                        const idRegistro = r.id || r.id_registro; 
                        try {
                          const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/registros/${idRegistro}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                              luz: Number(nuevaLuz), 
                              agua: Number(nuevaAgua),
                              organicos: Number(nuevosOrg),
                              inorganicos: Number(nuevosInorg),
                              otros: Number(nuevosOtros)
                            })
                          });
                          
                          if (res.ok) {
                            alert("✅ Actualizado en Neon (PostgreSQL)");
                            cargarDatos();
                          } else {
                            alert("Error al actualizar (Verifica que Render se haya actualizado)");
                          }
                        } catch (e) {
                          alert("Error de red");
                        }
                      }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', marginRight: '5px', cursor: 'pointer' }}>Editar</button>
                      
                      <button onClick={async () => {
                        if(window.confirm("⚠️ ¿Estás completamente seguro de ELIMINAR este registro de PostgreSQL?")) {
                          const idRegistro = r.id || r.id_registro;
                          try {
                            const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/registros/${idRegistro}`, {
                              method: 'DELETE'
                            });
                            if (res.ok) {
                              alert("🗑️ Eliminado de Neon (PostgreSQL)");
                              cargarDatos();
                            } else {
                              alert("Error al eliminar (Verifica que Render se haya actualizado)");
                            }
                          } catch (e) {
                            alert("Error de red");
                          }
                        }
                      }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Eliminar</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
          <div style={{...cardStyle, height:'400px'}}><h3 style={{ color: '#b45309' }}>⚡ Luz (Histórico)</h3><ResponsiveContainer width="100%" height="85%"><BarChart data={registros.slice().reverse()}><XAxis dataKey="fecha_registro" tickFormatter={(v) => new Date(v).toLocaleDateString()} /><YAxis /><Tooltip /><Bar dataKey="luz" fill="#fbbf24" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div>
          <div style={{...cardStyle, height:'400px'}}><h3 style={{ color: '#0369a1' }}>💧 Agua (Histórico)</h3><ResponsiveContainer width="100%" height="85%"><LineChart data={registros.slice().reverse()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="fecha_registro" tickFormatter={(v) => new Date(v).toLocaleDateString()} /><YAxis /><Tooltip /><Line type="monotone" dataKey="agua" stroke="#0ea5e9" strokeWidth={4} /></LineChart></ResponsiveContainer></div>
          <div style={{...cardStyle, height:'400px'}}><h3 style={{ color: '#15803d' }}>♻️ Residuos</h3><ResponsiveContainer width="100%" height="85%"><PieChart><Pie data={pieData.length ? pieData : [{name:'Vacío', value:1}]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">{pieData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div>
        </div>
      </main>
    </div>
  );
}

export default App;