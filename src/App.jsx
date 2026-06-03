import { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- DEFINICIÓN DE LOGOS SEGÚN LA VISTA ---
const loginLogoUrl = '/Logo-Ecotrack (2).png'; // Logo grande para la pantalla de Login
const dashboardHeaderLogoUrl = '/logo-ecotrack.png'; // Logo horizontal para el encabezado del Dashboard

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false); // Estado para vista de recuperación
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Estado para evitar doble clic
  
  const [hasCompany, setHasCompany] = useState(false);
  const [userRol, setUserRol] = useState('user');
  const [userData, setUserData] = useState({ nombre: '' });
  const [companyData, setCompanyData] = useState({ nombreComercial: '', rfc: '', ciudad: '' });
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '' });
  const [recoveryEmail, setRecoveryEmail] = useState('');
  
  const [registros, setRegistros] = useState([]);

  // Estados para nuevos registros
  const [luz, setLuz] = useState({ actual: '' });
  const [agua, setAgua] = useState({ actual: '' });
  const [residuos, setResiduos] = useState({ organicos: '', inorganicos: '', otros: '' });

  // Estados para Edición CRUD Inline (directo en la tabla)
  const [editingRowId, setEditingRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});

  // --- ESTADOS PARA EL CHATBOT ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: '¡Hola! Soy EcoBot 🍃. ¿En qué puedo ayudarte hoy?' }
  ]);

  const cargarDatos = async () => {
    try {
      const res = await fetch('https://ecotrack-server-v1.onrender.com/api/registros');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRegistros(data);
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

  const formatearFecha = (fechaRaw) => {
    if (!fechaRaw) return new Date().toLocaleDateString();
    const d = new Date(fechaRaw);
    return isNaN(d.getTime()) ? new Date().toLocaleDateString() : d.toLocaleDateString();
  };

  // --- LÓGICA DE RESPUESTAS DEL CHATBOT ---
  const gestionarEnvioMensaje = (textoDirecto = null) => {
    const textoAEnviar = textoDirecto || chatInput;
    if (!textoAEnviar.trim()) return;

    const nuevoMensajeUsuario = { sender: 'user', text: textoAEnviar };
    setChatMessages(prev => [...prev, nuevoMensajeUsuario]);
    const textoGuardado = textoAEnviar.toLowerCase();
    
    if (!textoDirecto) setChatInput('');

    // Simulamos respuesta del bot
    setTimeout(() => {
      let respuestaBot = 'Lo siento, sigo aprendiendo. Si tienes problemas técnicos o con tu cuenta, por favor contacta a soporte@ecotrack.com 📧';

      if (textoGuardado.includes('hola') || textoGuardado.includes('buenos') || textoGuardado.includes('buenas')) {
        respuestaBot = '¡Hola! Bienvenido a EcoTrack. Estoy aquí para resolver tus dudas de inicio de sesión o soporte básico. 🌍';
      } else if (textoGuardado.includes('contraseña') || textoGuardado.includes('password') || textoGuardado.includes('entrar')) {
        respuestaBot = 'Si olvidaste tu contraseña, haz clic en "Olvidé mi contraseña" debajo del formulario para iniciar la recuperación.';
      } else if (textoGuardado.includes('registro') || textoGuardado.includes('cuenta') || textoGuardado.includes('crear')) {
        respuestaBot = 'Puedes crear una cuenta personal haciendo clic en la opción "¿No tienes cuenta? Regístrate aquí" que está debajo del botón verde.';
      } else if (textoGuardado.includes('que es') || textoGuardado.includes('ecotrack') || textoGuardado.includes('funciona')) {
        respuestaBot = 'EcoTrack es una plataforma en la nube diseñada para auditar y controlar el impacto ecológico corporativo, monitoreando consumos de forma inteligente.';
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: respuestaBot }]);
    }, 700);
  };

  // --- FILTRO Y GENERACIÓN DEL PDF (SOLO MES ACTUAL) ---
  const generarReportePDF = () => {
    try {
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth();
      const anoActual = fechaActual.getFullYear();

      // Filtrar registros SOLO de este mes
      const registrosDelMes = registros.filter(r => {
        const d = new Date(r.fecha_registro);
        return d.getMonth() === mesActual && d.getFullYear() === anoActual;
      });

      if (registrosDelMes.length === 0) {
        return alert("No hay registros almacenados en el mes actual para exportar.");
      }

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setTextColor(6, 95, 70);
      doc.text("Reporte de Sostenibilidad Mensual - EcoTrack", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Empresa: ${companyData.nombreComercial || 'EcoTrack Principal'}`, 14, 32);
      doc.text(`Generado por: ${userData.nombre || 'Usuario'} (Rol: ${(userRol || 'user').toUpperCase()})`, 14, 38);
      doc.text(`Fecha de emisión: ${fechaActual.toLocaleDateString()}`, 14, 44);

      const tableColumn = ["Fecha", "Luz (kWh)", "Agua (m³)", "Residuos Totales (kg)"];
      const tableRows = [];

      registrosDelMes.forEach(r => {
        const totalResiduos = Number(r.organicos || 0) + Number(r.inorganicos || 0) + Number(r.otros || 0);
        const rowData = [
          formatearFecha(r.fecha_registro),
          r.luz || 0,
          r.agua || 0,
          totalResiduos
        ];
        tableRows.push(rowData);
      });

      const opcionesTabla = {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [16, 185, 129] },
        alternateRowStyles: { fillColor: [243, 244, 246] }
      };

      if (typeof autoTable === 'function') {
        autoTable(doc, opcionesTabla);
      } else if (typeof doc.autoTable === 'function') {
        doc.autoTable(opcionesTabla);
      } else {
        throw new Error("No se pudo vincular el generador de tablas jsPDF.");
      }

      doc.save(`Reporte_EcoTrack_${mesActual + 1}_${anoActual}.pdf`);
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

  // ==========================================
  // VISTA 1: LOGIN, REGISTRO Y RECUPERACIÓN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(135deg, #064e3b 0%, #16a34a 100%)', padding: '40px 20px', boxSizing: 'border-box', position: 'relative' }}>
        
        {/* LOGO GRANDE PEGAO AL CUADRO */}
        <div style={{ textAlign: 'center', marginBottom: '5px', width: '100%', maxWidth: '700px' }}>
          <img src={loginLogoUrl} alt="Logo Grande" style={{ height: '350px', width: 'auto', marginBottom: '0px', objectFit: 'contain' }} />
        </div>

        {/* TARJETA DE FORMULARIO */}
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '25px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', boxSizing: 'border-box' }}>
          
          {isRecovering ? (
            // INTERFAZ DE RECUPERACIÓN DE CONTRASEÑA
            <>
              <h2 style={{ color: '#065f46', marginBottom: '20px' }}>Recuperar Contraseña</h2>
              <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '20px' }}>Ingresa tu correo y te enviaremos las instrucciones.</p>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input type="email" placeholder="Correo electrónico" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} 
                  value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} />
                <button type="button" onClick={() => {
                  if(!recoveryEmail) return alert("Por favor ingresa tu correo.");
                  alert(`Las instrucciones han sido enviadas a ${recoveryEmail}`);
                  setIsRecovering(false);
                }} style={{ padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ENVIAR ENLACE
                </button>
              </form>
              <button onClick={() => setIsRecovering(false)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}>
                Volver al inicio de sesión
              </button>
            </>
          ) : (
            // INTERFAZ DE LOGIN Y REGISTRO
            <>
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
                
                <button disabled={isLoggingIn} onClick={async () => {
                  if (!formData.correo || !formData.password) return alert("Llena todos los campos.");
                  if (isRegistering && !formData.nombre) return alert("Por favor ingresa tu nombre.");
                  // Validación para no aceptar números en el nombre
                  if (isRegistering && /\d/.test(formData.nombre)) return alert("El nombre no puede contener números.");

                  setIsLoggingIn(true); // Bloquear botón
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
                  } finally {
                    setIsLoggingIn(false); // Desbloquear botón
                  }
                }} type="button" style={{ padding: '12px', background: isLoggingIn ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: isLoggingIn ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {isLoggingIn ? 'Cargando... (El servidor está despertando)' : (isRegistering ? 'REGISTRARME' : 'ENTRAR')}
                </button>
              </form>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', textDecoration: 'underline' }}>
                  {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
                </button>
                {!isRegistering && (
                  <button onClick={() => setIsRecovering(true)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* SECCIÓN DE LOS 4 BENEFICIOS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', marginTop: '60px', color: 'white', textAlign: 'center', maxWidth: '1000px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <img src="/ahorro.png" alt="Ahorro de recursos" style={{ width: '70px', height: '70px', marginBottom: '15px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>AHORRO DE RECURSOS</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.4', opacity: '0.9', margin: 0 }}>Identifica y reduce consumos innecesarios para disminuir costos.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <img src="/destaca.png" alt="Cumple y destaca" style={{ width: '70px', height: '70px', marginBottom: '15px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>CUMPLE Y DESTACA</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.4', opacity: '0.9', margin: 0 }}>Facilita el cumplimiento normativo y mejora tu imagen sostenible.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <img src="/decisiones.png" alt="Decisiones inteligentes" style={{ width: '70px', height: '70px', marginBottom: '15px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>DECISIONES INTELIGENTES</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.4', opacity: '0.9', margin: 0 }}>Datos claros y en tiempo real para mejores decisiones.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <img src="/nube.png" alt="Fácil y accesible" style={{ width: '70px', height: '70px', marginBottom: '15px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: 'bold', letterSpacing: '0.5px' }}>FÁCIL Y ACCESIBLE</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.4', opacity: '0.9', margin: 0 }}>Plataforma accesible y escalable.</p>
          </div>
        </div>

        {/* CHATBOT FLOTANTE POTENCIADO */}
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, fontFamily: 'sans-serif' }}>
          {isChatOpen ? (
            <div style={{ width: '320px', height: '460px', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #10b981' }}>
              <div style={{ backgroundColor: '#064e3b', color: '#fff', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🍃</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>EcoBot Soporte</div>
                    <div style={{ fontSize: '11px', opacity: 0.8 }}>En línea ahora</div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>✕</button>
              </div>

              <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f9fafb' }}>
                {chatMessages.map((msg, index) => (
                  <div key={index} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.4', textAlign: 'left',
                    backgroundColor: msg.sender === 'user' ? '#10b981' : '#e5e7eb',
                    color: msg.sender === 'user' ? '#fff' : '#1f2937'
                  }}>
                    {msg.text}
                  </div>
                ))}
              </div>

              {/* Botones de preguntas rápidas */}
              <div style={{ display: 'flex', gap: '5px', padding: '5px 10px', overflowX: 'auto', backgroundColor: '#f3f4f6', borderTop: '1px solid #e5e7eb' }}>
                <button onClick={() => gestionarEnvioMensaje('Olvidé mi contraseña')} style={{ whiteSpace: 'nowrap', padding: '5px 10px', borderRadius: '15px', border: '1px solid #10b981', background: '#fff', color: '#10b981', fontSize: '11px', cursor: 'pointer' }}>Contraseña</button>
                <button onClick={() => gestionarEnvioMensaje('¿Qué es EcoTrack?')} style={{ whiteSpace: 'nowrap', padding: '5px 10px', borderRadius: '15px', border: '1px solid #10b981', background: '#fff', color: '#10b981', fontSize: '11px', cursor: 'pointer' }}>¿Qué es?</button>
                <button onClick={() => gestionarEnvioMensaje('¿Cómo crear cuenta?')} style={{ whiteSpace: 'nowrap', padding: '5px 10px', borderRadius: '15px', border: '1px solid #10b981', background: '#fff', color: '#10b981', fontSize: '11px', cursor: 'pointer' }}>Crear cuenta</button>
              </div>

              <div style={{ padding: '10px', display: 'flex', gap: '8px', backgroundColor: '#fff' }}>
                <input type="text" placeholder="Escribe tu duda..." value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') gestionarEnvioMensaje(); }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }} 
                />
                <button onClick={() => gestionarEnvioMensaje()} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
                  Enviar
                </button>
              </div>
            </div>
          ) : (
            // === AQUÍ AGRANDAMOS EL ICONO DEL CHATBOT A 75px ===
            <button onClick={() => setIsChatOpen(true)} style={{ width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.5)', transition: 'transform 0.2s' }}>
              💬
            </button>
          )}
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

  const pieDataRaw = [
    { name: 'Orgánicos', value: Number(ultimoRegistro.organicos) || 0 },
    { name: 'Inorgánicos', value: Number(ultimoRegistro.inorganicos) || 0 },
    { name: 'Otros', value: Number(ultimoRegistro.otros) || 0 },
  ].filter(d => d.value > 0);

  const datosGraficoPastel = pieDataRaw.length > 0 ? pieDataRaw : [{ name: 'Sin datos', value: 1 }];
  const coloresPastel = pieDataRaw.length > 0 ? ['#4ade80', '#10b981', '#064e3b'] : ['#cbd5e1'];

  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#ecfdf5', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      <header style={{ padding: '15px 50px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #10b981' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={dashboardHeaderLogoUrl} alt="Logo Horizontal" style={{ height: '70px', objectFit: 'contain' }} />
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
        <div style={{ ...cardStyle, marginBottom: '30px', borderLeft: '6px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#065f46', marginTop: 0 }}>📊 Panel de Sostenibilidad</h2>
            <p style={{ color: '#4b5563', margin: 0 }}>Gestiona y visualiza tu impacto ambiental en tiempo real.</p>
          </div>
          {userRol === 'admin' && (
            <button onClick={generarReportePDF} style={{ padding: '12px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              🖨️ Descargar Reporte PDF (Mes Actual)
            </button>
          )}
        </div>

        <div style={{ ...cardStyle, marginBottom: '30px' }}>
          <h3 style={{marginTop:0, color:'#374151'}}>Nuevo Registro de Consumo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '15px', alignItems: 'flex-end' }}>
            {/* ETIQUETAS CON COLOR OSCURO PARA VISIBILIDAD */}
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>⚡ Luz</label><input type="number" value={luz.actual} onChange={(e) => setLuz({actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #fbbf24'}} /></div>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>💧 Agua</label><input type="number" value={agua.actual} onChange={(e) => setAgua({actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #38bdf8'}} /></div>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>♻️ Org.</label><input type="number" value={residuos.organicos} onChange={(e) => setResiduos({...residuos, organicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #4ade80'}} /></div>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>♻️ Inorg.</label><input type="number" value={residuos.inorganicos} onChange={(e) => setResiduos({...residuos, inorganicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #10b981'}} /></div>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>♻️ Otros</label><input type="number" value={residuos.otros} onChange={(e) => setResiduos({...residuos, otros: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #065f46'}} /></div>
            
            <button onClick={async () => {
                // VALIDACIÓN ESTRICTA: Sin vacíos ni negativos
                if (luz.actual === '' || agua.actual === '' || residuos.organicos === '' || residuos.inorganicos === '' || residuos.otros === '') {
                  return alert("❌ Error: No puedes dejar ningún campo vacío.");
                }
                const payload = { luz: Number(luz.actual), agua: Number(agua.actual), organicos: Number(residuos.organicos), inorganicos: Number(residuos.inorganicos), otros: Number(residuos.otros) };
                
                if (payload.luz < 0 || payload.agua < 0 || payload.organicos < 0 || payload.inorganicos < 0 || payload.otros < 0) {
                  return alert("❌ Error: Los consumos no pueden ser números negativos.");
                }

                const res = await fetch('https://ecotrack-server-v1.onrender.com/api/registros', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                
                if (res.ok) { 
                  alert("✅ Guardado en Neon (PostgreSQL)"); 
                  setLuz({actual: ''}); setAgua({actual: ''}); setResiduos({organicos: '', inorganicos: '', otros: ''});
                  cargarDatos(); 
                }
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
                <th>Orgánicos</th>
                <th>Inorgánicos</th>
                <th>Otros</th>
                {userRol === 'admin' && <th>Acciones CRUD</th>}
              </tr>
            </thead>
            <tbody style={{ color: '#1f2937' }}>
              {registros.map((r, i) => {
                const idRegistro = r.id || r.id_registro;
                const isEditing = editingRowId === idRegistro;

                return (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', color: '#1f2937' }}>{formatearFecha(r.fecha_registro)}</td>
                    
                    {/* SI ESTÁ EDITANDO, MUESTRA INPUTS. SI NO, MUESTRA EL TEXTO NORMAL */}
                    <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.luz} onChange={(e)=>setEditRowData({...editRowData, luz: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.luz}</span>}</td>
                    <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.agua} onChange={(e)=>setEditRowData({...editRowData, agua: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.agua}</span>}</td>
                    <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.organicos} onChange={(e)=>setEditRowData({...editRowData, organicos: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.organicos || 0}</span>}</td>
                    <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.inorganicos} onChange={(e)=>setEditRowData({...editRowData, inorganicos: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.inorganicos || 0}</span>}</td>
                    <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.otros} onChange={(e)=>setEditRowData({...editRowData, otros: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.otros || 0}</span>}</td>
                    
                    {userRol === 'admin' && (
                      <td>
                        {isEditing ? (
                          <>
                            {/* BOTONES DE GUARDAR O CANCELAR EDICIÓN INLINE */}
                            <button onClick={async () => {
                              const { luz, agua, organicos, inorganicos, otros } = editRowData;
                              if (luz === '' || agua === '' || organicos === '' || inorganicos === '' || otros === '') return alert("❌ Ningún campo puede quedar vacío.");
                              if (Number(luz) < 0 || Number(agua) < 0 || Number(organicos) < 0 || Number(inorganicos) < 0 || Number(otros) < 0) return alert("❌ No se permiten números negativos.");

                              try {
                                const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/registros/${idRegistro}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ 
                                    luz: Number(luz), agua: Number(agua), organicos: Number(organicos), inorganicos: Number(inorganicos), otros: Number(otros)
                                  })
                                });
                                if (res.ok) {
                                  alert("✅ Registro Actualizado");
                                  setEditingRowId(null);
                                  cargarDatos();
                                } else alert("Error al actualizar");
                              } catch (e) { alert("Error de red"); }
                            }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', marginRight: '5px', cursor: 'pointer' }}>Guardar</button>
                            <button onClick={() => setEditingRowId(null)} style={{ background: '#9ca3af', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Cancelar</button>
                          </>
                        ) : (
                          <>
                            {/* BOTONES DE INICIAR EDICIÓN O ELIMINAR */}
                            <button onClick={() => {
                              setEditingRowId(idRegistro);
                              setEditRowData({ luz: r.luz, agua: r.agua, organicos: r.organicos || 0, inorganicos: r.inorganicos || 0, otros: r.otros || 0 });
                            }} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', marginRight: '5px', cursor: 'pointer' }}>Editar</button>
                            
                            <button onClick={async () => {
                              if(window.confirm("⚠️ ¿Seguro que deseas ELIMINAR este registro?")) {
                                try {
                                  const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/registros/${idRegistro}`, { method: 'DELETE' });
                                  if (res.ok) { alert("🗑️ Eliminado"); cargarDatos(); } else { alert("Error al eliminar"); }
                                } catch (e) { alert("Error de red"); }
                              }
                            }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Eliminar</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px' }}>
          <div style={{...cardStyle, height:'400px'}}>
            <h3 style={{ color: '#b45309' }}>⚡ Luz (Histórico)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={registros.slice().reverse()}>
                <XAxis dataKey="fecha_registro" tickFormatter={(v) => formatearFecha(v)} />
                <YAxis />
                <Tooltip labelFormatter={(v) => formatearFecha(v)} />
                <Bar dataKey="luz" fill="#fbbf24" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{...cardStyle, height:'400px'}}>
            <h3 style={{ color: '#0369a1' }}>💧 Agua (Histórico)</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={registros.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="fecha_registro" tickFormatter={(v) => formatearFecha(v)} />
                <YAxis />
                <Tooltip labelFormatter={(v) => formatearFecha(v)} />
                <Line type="monotone" dataKey="agua" stroke="#0ea5e9" strokeWidth={4} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{...cardStyle, height:'400px'}}>
            <h3 style={{ color: '#15803d' }}>♻️ Residuos</h3>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie 
                  data={datosGraficoPastel} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={90} 
                  dataKey="value"
                >
                  {datosGraficoPastel.map((e, i) => (
                    <Cell key={i} fill={coloresPastel[i % coloresPastel.length]} />
                  ))}
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