import { useState, useEffect } from 'react' // Añadimos useEffect aquí
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

const logoUrl = '/logo-ecotrack.png'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCompany, setHasCompany] = useState(false); 
  
  const [userData, setUserData] = useState({ nombre: '' });
  const [companyData, setCompanyData] = useState({ nombreComercial: '', rfc: '', ciudad: '' });
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '' });
  
  // Estado para el historial
  const [registros, setRegistros] = useState([]);

  // Estados para los inputs
  const [luz, setLuz] = useState({ actual: 0, anterior: 0 });
  const [agua, setAgua] = useState({ actual: 0, anterior: 0 });
  const [residuos, setResiduos] = useState({ organicos: 0, inorganicos: 0, otros: 0 });

  // --- FUNCIÓN PARA CARGAR DATOS ---
  const cargarDatos = async () => {
    try {
      const res = await fetch('https://ecotrack-server-v1.onrender.com/api/registros');
      const data = await res.json();
      setRegistros(data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    }
  };

  // Cargar datos automáticamente al iniciar sesión
  useEffect(() => {
    if (isLoggedIn) {
      cargarDatos();
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsRegistering(false);
    setHasCompany(false);
  };

  const cardStyle = { 
    backgroundColor: 'rgba(255, 255, 255, 0.7)', 
    backdropFilter: 'blur(10px)',
    padding: '25px', 
    borderRadius: '20px', 
    boxShadow: '0 8px 20px rgba(0,0,0,0.05)', 
    border: '1px solid #d1fae5'
  };

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
            
            <button onClick={() => {
              if (formData.correo && formData.password) {
                setIsLoggedIn(true); 
                setUserData({nombre: formData.nombre || 'David'});
              } else {
                alert("⚠️ Por favor ingresa tus datos");
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

  if (isLoggedIn && !hasCompany) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ecfdf5' }}>
        <div style={{ ...cardStyle, width: '450px', textAlign: 'center' }}>
          <h2 style={{ color: '#065f46', marginBottom: '10px' }}>Bienvenido, {userData.nombre}</h2>
          <p style={{ color: '#4b5563', marginBottom: '25px' }}>Selecciona una empresa para continuar.</p>
          <button 
            onClick={() => {
              setCompanyData({ nombreComercial: 'EcoTrack Principal', rfc: 'XAXX010101000', ciudad: 'Ciudad México' });
              setHasCompany(true);
            }} 
            style={{ width: '100%', padding: '15px', background: '#065f46', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            🏢 Entrar a: EcoTrack Principal
          </button>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Orgánicos', value: Number(residuos.organicos) || 0 },
    { name: 'Inorgánicos', value: Number(residuos.inorganicos) || 0 },
    { name: 'Otros', value: Number(residuos.otros) || 0 },
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
        <div style={{ ...cardStyle, marginBottom: '30px' }}>
          <h3 style={{marginTop:0, color:'#374151'}}>Nuevo Registro de Consumo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '15px', alignItems: 'flex-end' }}>
            <div>
              <label>⚡ Luz</label>
              <input type="number" value={luz.actual} onChange={(e) => setLuz({...luz, actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #fbbf24'}} />
            </div>
            <div>
              <label>💧 Agua</label>
              <input type="number" value={agua.actual} onChange={(e) => setAgua({...agua, actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #38bdf8'}} />
            </div>
            <div>
              <label>♻️ Org.</label>
              <input type="number" value={residuos.organicos} onChange={(e) => setResiduos({...residuos, organicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #4ade80'}} />
            </div>
            <div>
              <label>♻️ Inorg.</label>
              <input type="number" value={residuos.inorganicos} onChange={(e) => setResiduos({...residuos, inorganicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #10b981'}} />
            </div>
            <div>
              <label>♻️ Otros</label>
              <input type="number" value={residuos.otros} onChange={(e) => setResiduos({...residuos, otros: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #065f46'}} />
            </div>
            <button onClick={async () => {
              const datosConsumo = {luz: Number(luz.actual), agua: Number(agua.actual), organicos: Number(residuos.organicos), inorganicos: Number(residuos.inorganicos), otros: Number(residuos.otros)};
              try {
                const response = await fetch('https://ecotrack-server-v1.onrender.com/api/registros', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(datosConsumo)
                });
                if (response.ok) {
                  alert("✅ Datos guardados");
                  cargarDatos(); // Actualiza la tabla automáticamente
                }
              } catch (error) {
                alert("❌ Error de conexión");
              }
            }} style={{ padding: '12px 25px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor:'pointer', fontWeight:'bold' }}>
              GUARDAR
            </button>
          </div>
        </div>

        {/* --- TABLA DE HISTORIAL --- */}
        <div style={{ ...cardStyle, marginBottom: '30px' }}>
          <h3 style={{ color: '#065f46', marginTop: 0 }}>📋 Historial de Registros</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #10b981' }}>
                <th style={{padding:'10px'}}>Fecha</th>
                <th>Luz</th>
                <th>Agua</th>
                <th>Residuos</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #eee', textAlign:'center' }}>
                  <td style={{padding:'10px'}}>{new Date(r.fecha_registro).toLocaleDateString()}</td>
                  <td>{r.luz} kWh</td>
                  <td>{r.agua} m³</td>
                  <td>{Number(r.organicos) + Number(r.inorganicos) + Number(r.otros)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GRÁFICAS */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
          <div style={{...cardStyle, height:'300px'}}>
            <h3 style={{ color: '#b45309' }}>⚡ Luz</h3>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={registros.slice(0,5).reverse()}>
                <XAxis dataKey="fecha_registro" tickFormatter={(str) => new Date(str).toLocaleDateString()} />
                <YAxis /><Tooltip /><Bar dataKey="luz" fill="#fbbf24" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Aquí puedes repetir para Agua y Residuos usando la data de 'registros' */}
        </div>
      </main>
    </div>
  );
}

export default App;