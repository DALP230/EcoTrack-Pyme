import { useState } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';

const logoUrl = '/logo-ecotrack.png'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [hasCompany, setHasCompany] = useState(false); // Nuevo: Controla si la empresa ya existe
  
  const [userData, setUserData] = useState({ nombre: '' });
  const [companyData, setCompanyData] = useState({ nombreComercial: '', rfc: '', ciudad: '' });
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '' });
  
  // Estados para los datos (Todos inician en 0)
  const [luz, setLuz] = useState({ actual: 0, anterior: 0 });
  const [agua, setAgua] = useState({ actual: 0, anterior: 0 });
  const [residuos, setResiduos] = useState({ organicos: 0, inorganicos: 0, otros: 0 });

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

  // --- VISTA 1: LOGIN Y REGISTRO DE USUARIO ---
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
            <input type="email" placeholder="Correo electrónico" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <input type="password" placeholder="Contraseña" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} />
            <button onClick={() => {setIsLoggedIn(true); setUserData({nombre: formData.nombre || 'David'})}} type="button" style={{ padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
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

  // --- VISTA 2: SELECCIÓN O REGISTRO DE EMPRESA ---
  if (isLoggedIn && !hasCompany) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ecfdf5' }}>
        <div style={{ ...cardStyle, width: '450px', textAlign: 'center' }}>
          <h2 style={{ color: '#065f46', marginBottom: '10px' }}>Bienvenido, {userData.nombre}</h2>
          <p style={{ color: '#4b5563', marginBottom: '25px' }}>Selecciona una empresa para continuar o registra una nueva.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* OPCIÓN 1: ENTRAR A LA EMPRESA EXISTENTE */}
            <button 
              onClick={() => {
                setCompanyData({ nombreComercial: 'EcoTrack Principal', rfc: 'XAXX010101000', ciudad: 'Ciudad México' });
                setHasCompany(true);
              }} 
              style={{ padding: '15px', background: '#065f46', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🏢 Entrar a: EcoTrack Principal</span>
              <span style={{fontSize: '12px', opacity: 0.8}}>ID: 1</span>
            </button>

            <div style={{margin: '10px 0', color: '#9ca3af', fontSize: '14px'}}>— o —</div>

            {/* OPCIÓN 2: REGISTRAR NUEVA (Se abre el formulario que ya tenías) */}
            <button 
              onClick={() => setIsRegisteringCompany(true)} // Necesitarías un nuevo estado simple para mostrar el form
              style={{ padding: '12px', background: 'transparent', color: '#059669', border: '2px solid #10b981', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              + REGISTRAR NUEVA EMPRESA
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA 3: DASHBOARD PRINCIPAL ---
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
              <div style={{ fontSize: '11px', color: '#059669', fontWeight: 'bold' }}>📍 {companyData.nombreComercial || 'Empresa Local'}</div>
            </div>
            <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Salir</button>
        </div>
      </header>

      <main style={{ padding: '40px' }}>
        
        <div style={{ ...cardStyle, marginBottom: '30px', borderLeft: '6px solid #10b981' }}>
          <h2 style={{ color: '#065f46', marginTop: 0 }}>📊 Panel de Sostenibilidad</h2>
          <p style={{ color: '#4b5563', fontSize: '16px', lineHeight: '1.6', margin: 0 }}>
            Bienvenido a EcoTrack. Registra tu consumo de energía, agua y la generación de residuos para visualizar tendencias y tomar decisiones informadas para un futuro más verde.
          </p>
        </div>

        <div style={{ ...cardStyle, marginBottom: '30px' }}>
          <h3 style={{marginTop:0, color:'#374151'}}>Nuevo Registro de Consumo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '15px', alignItems: 'flex-end' }}>
            <div>
              <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color: '#b45309'}}>⚡ Luz (kWh)</label>
              <input type="number" value={luz.actual} onChange={(e) => setLuz({...luz, actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #fbbf24', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color: '#0284c7'}}>💧 Agua (m³)</label>
              <input type="number" value={agua.actual} onChange={(e) => setAgua({...agua, actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #38bdf8', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color: '#16a34a'}}>♻️ Org. (kg)</label>
              <input type="number" value={residuos.organicos} onChange={(e) => setResiduos({...residuos, organicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #4ade80', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color: '#059669'}}>♻️ Inorg. (kg)</label>
              <input type="number" value={residuos.inorganicos} onChange={(e) => setResiduos({...residuos, inorganicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #10b981', boxSizing:'border-box'}} />
            </div>
            <div>
              <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color: '#064e3b'}}>♻️ Otros (kg)</label>
              <input type="number" value={residuos.otros} onChange={(e) => setResiduos({...residuos, otros: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #065f46', boxSizing:'border-box'}} />
            </div>
            <button onClick={async () => {const datosConsumo = {luz: Number(luz.actual), agua: Number(agua.actual), organicos: Number(residuos.organicos), inorganicos: Number(residuos.inorganicos), otros: Number(residuos.otros)};
    try {
      const response = await fetch('https://ecotrack-server-v1.onrender.com/api/registros', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosConsumo)
      });

      const resultado = await response.json();

      if (response.ok) {
        alert("✅ Datos guardados en la nube (Neon)");
        if (resultado.alerta) {
          alert("⚠️ ATENCIÓN: " + resultado.alerta);
        }
      } else {
        alert("❌ Error al guardar");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ No se pudo conectar con el servidor de Render");
    }
  }} 
  style={{ padding: '12px 25px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor:'pointer', fontWeight:'bold', height:'42px' }}
>
  GUARDAR
</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
          <div style={{...cardStyle, height:'400px'}}>
            <h3 style={{ color: '#b45309', marginTop:0 }}>⚡ Consumo Eléctrico</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={[{n: 'Anterior', v: luz.anterior}, {n: 'Actual', v: Number(luz.actual)}]}>
                <XAxis dataKey="n" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="v" fill="#fbbf24" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{...cardStyle, height:'400px'}}>
            <h3 style={{ color: '#0369a1', marginTop:0 }}>💧 Tendencia de Agua</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={[{n: 'Anterior', v: agua.anterior}, {n: 'Actual', v: Number(agua.actual)}]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="n" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="#0ea5e9" strokeWidth={4} dot={{r:6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{...cardStyle, height:'400px'}}>
            <h3 style={{ color: '#15803d', marginTop:0 }}>♻️ Distribución de Residuos</h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={pieData.length ? pieData : [{name:'Vacío', value:1}]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  {!pieData.length && <Cell fill="#f3f4f6" />}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;