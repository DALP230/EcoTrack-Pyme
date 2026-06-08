import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- DEFINICIÓN DE LOGOS SEGÚN LA VISTA ---
const loginLogoUrl = '/Logo-Ecotrack (2).png';
const dashboardHeaderLogoUrl = '/logo-ecotrack.png'; 

// ==========================================
// COMPONENTES DE GRÁFICAS (SEPARADOS Y ESPECÍFICOS)
// ==========================================

function GraficaLuz({ datos }) {
  const datosCronologicos = [...datos].reverse();
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1px solid #d1fae5', flex: '1 1 300px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#b45309', fontSize: '16px', textAlign: 'center' }}>⚡ Consumo de Luz</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={datosCronologicos}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="fecha_registro" tickFormatter={(t) => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, {month:'short', day:'numeric'}); }} style={{ fontSize: '11px' }} />
            <YAxis style={{ fontSize: '11px' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="luz" name="Luz (kWh)" fill="#fbbf24" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GraficaAgua({ datos }) {
  const datosCronologicos = [...datos].reverse();
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1px solid #d1fae5', flex: '1 1 300px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0369a1', fontSize: '16px', textAlign: 'center' }}>💧 Consumo de Agua</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <LineChart data={datosCronologicos}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="fecha_registro" tickFormatter={(t) => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, {month:'short', day:'numeric'}); }} style={{ fontSize: '11px' }} />
            <YAxis style={{ fontSize: '11px' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="agua" name="Agua (m³)" stroke="#38bdf8" strokeWidth={3} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GraficaResiduos({ ultimoRegistro }) {
  const pieDataRaw = [
    { name: 'Orgánicos', value: Number(ultimoRegistro.organicos) || 0 },
    { name: 'Inorgánicos', value: Number(ultimoRegistro.inorganicos) || 0 },
    { name: 'Otros', value: Number(ultimoRegistro.otros) || 0 },
  ].filter(d => d.value > 0);
  const datosGraficoPastel = pieDataRaw.length > 0 ? pieDataRaw : [{ name: 'Sin datos', value: 1 }];
  const coloresPastel = pieDataRaw.length > 0 ? ['#4ade80', '#10b981', '#064e3b'] : ['#cbd5e1'];
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.05)', border: '1px solid #d1fae5', flex: '1 1 300px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#15803d', fontSize: '16px', textAlign: 'center' }}>♻️ Distribución de Residuos</h3>
      <div style={{ width: '100%', height: 250, display: 'flex', justifyContent: 'center' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={datosGraficoPastel} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
              {datosGraficoPastel.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={coloresPastel[index % coloresPastel.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => pieDataRaw.length > 0 ? `${value} kg` : '0 kg'} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL (APP)
// ==========================================
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false); 
  const [isLoggingIn, setIsLoggingIn] = useState(false); 
  
  const [hasCompany, setHasCompany] = useState(false);
  const [userRol, setUserRol] = useState('user');
  const [userData, setUserData] = useState({ nombre: '' });
  const [companyData, setCompanyData] = useState({ nombreComercial: '', rfc: '', ciudad: '' });
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '' });
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [registros, setRegistros] = useState([]);
  
  const [tipoReporte, setTipoReporte] = useState('actual');

  const [luz, setLuz] = useState({ actual: '' });
  const [agua, setAgua] = useState({ actual: '' });
  const [residuos, setResiduos] = useState({ organicos: '', inorganicos: '', otros: '' });
  const [editingRowId, setEditingRowId] = useState(null);
  const [editRowData, setEditRowData] = useState({});

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: '¡Hola! Soy EcoBot 🍃. ¿En qué puedo ayudarte hoy?' }
  ]);
  
  // --- NUEVO ESTADO PARA ALERTAS PROPIAS Y BONITAS ---
  const [alerta, setAlerta] = useState({ mostrar: false, mensaje: '', tipo: 'error' });
  const mostrarAlerta = (mensaje, tipo = 'error') => {
    setAlerta({ mostrar: true, mensaje, tipo });
    setTimeout(() => {
      setAlerta(prev => prev.mensaje === mensaje ? { ...prev, mostrar: false } : prev);
    }, 4000);
  };

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

  const gestionarEnvioMensaje = (textoDirecto = null) => {
    const textoAEnviar = textoDirecto || chatInput;
    if (!textoAEnviar.trim()) return;

    const nuevoMensajeUsuario = { sender: 'user', text: textoAEnviar };
    setChatMessages(prev => [...prev, nuevoMensajeUsuario]);
    const textoGuardado = textoAEnviar.toLowerCase();
    
    if (!textoDirecto) setChatInput('');

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
  const generarReportePDF = () => {
    try {
      const fechaActual = new Date();
      const mesActual = fechaActual.getMonth();
      const anoActual = fechaActual.getFullYear();

      let registrosAExportar = registros;
      let subTituloPeriodo = "Historial Completo";
      if (tipoReporte === 'actual') {
        registrosAExportar = registros.filter(r => {
          const d = new Date(r.fecha_registro);
          return d.getMonth() === mesActual && d.getFullYear() === anoActual;
        });
        subTituloPeriodo = `Mes Actual (${fechaActual.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})`;
      }

      if (registrosAExportar.length === 0) {
        return mostrarAlerta("No hay registros almacenados en el periodo seleccionado para exportar.", 'error');
      }

      const doc = new jsPDF();
      // ESTILO PROFESIONAL DEL PDF
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(6, 95, 70);
      // Verde oscuro corporativo
      doc.text("Reporte de Sostenibilidad - EcoTrack", 14, 25);
      // Línea divisoria elegante
      doc.setLineWidth(0.5);
      doc.setDrawColor(16, 185, 129); 
      doc.line(14, 30, 196, 30);
      // Información del encabezado
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(75, 85, 99);
      // Texto gris oscuro para fácil lectura
      doc.text(`Empresa: ${companyData.nombreComercial || 'EcoTrack Principal'}`, 14, 40);
      doc.text(`Periodo: ${subTituloPeriodo}`, 14, 46);
      doc.text(`Generado por: ${userData.nombre || 'Usuario'} (Rol: ${(userRol || 'user').toUpperCase()})`, 14, 52);
      doc.text(`Fecha de emisión: ${fechaActual.toLocaleDateString()}`, 14, 58);

      const tableColumn = ["Fecha", "Luz (kWh)", "Agua (m³)", "Residuos Totales (kg)"];
      const tableRows = [];

      registrosAExportar.forEach(r => {
        const totalResiduos = Number(r.organicos || 0) + Number(r.inorganicos || 0) + Number(r.otros || 0);
        const rowData = [
          formatearFecha(r.fecha_registro),
          r.luz || 0,
          r.agua || 0,
          totalResiduos
        ];
        tableRows.push(rowData);
      });

      // Configuración estética de la tabla
      const opcionesTabla = {
        head: [tableColumn],
        body: tableRows,
        startY: 65,
        theme: 'grid',
        styles: { 
          fontSize: 10, 
          cellPadding: 4, 
          textColor: [55, 65, 81],
          font: 'helvetica',
          halign: 'center'
        },
        headStyles: { 
          fillColor: [6, 95, 70], // Verde oscuro Ecotrack
          textColor: [255, 255, 255], 
          fontStyle: 'bold' 
        },
        alternateRowStyles: { 
          fillColor: [236, 253, 245] // Verde clarito pastel para intercalar
        }
      };
      if (typeof autoTable === 'function') {
        autoTable(doc, opcionesTabla);
      } else if (typeof doc.autoTable === 'function') {
        doc.autoTable(opcionesTabla);
      } else {
        throw new Error("No se pudo vincular el generador de tablas jsPDF.");
      }

      const nombreArchivo = tipoReporte === 'actual' 
        ? `Reporte_EcoTrack_${mesActual + 1}_${anoActual}.pdf`
        : `Reporte_EcoTrack_Historial_Completo.pdf`;

      doc.save(nombreArchivo);
    } catch (error) {
      console.error("Error completo del PDF:", error);
      mostrarAlerta("Error al generar el PDF: " + error.message, 'error');
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
  // --- DISEÑO DE TARJETA FLOTANTE DE ALERTA ---
  const renderEcoAlerta = () => {
    if (!alerta.mostrar) return null;
    return (
      <div style={{
        position: 'fixed',
        top: '25px',
        right: '25px',
        zIndex: 9999,
        padding: '16px 24px',
        borderRadius: '14px',
        backgroundColor: alerta.tipo === 'success' ? '#def7ec' : '#fde8e8',
        color: alerta.tipo === 'success' ? '#03543f' : '#9b1c1c',
        border: `2px solid ${alerta.tipo === 'success' ? '#31c48d' : '#f8b4b4'}`,
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: 'bold',
        fontSize: '14px',
        maxWidth: '380px',
        fontFamily: 'sans-serif'
      }}>
        <span style={{ fontSize: '18px' }}>{alerta.tipo === 'success' ? '🍃' : '⚠️'}</span>
        <div style={{ flex: 1, textAlign: 'left' }}>{alerta.mensaje}</div>
        <button onClick={() => setAlerta({ ...alerta, mostrar: false })} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>✕</button>
      </div>
    );
  };

  // ==========================================
  // VISTA 1: LOGIN, REGISTRO Y RECUPERACIÓN
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div style={{ 
        minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', 
        background: 'linear-gradient(180deg, #7dd3fc 0%, #f0f9ff 70%, #ffffff 100%)',
        padding: '40px 20px', boxSizing: 'border-box', position: 'relative' 
      }}>
      
        {renderEcoAlerta()}
        
        <div style={{ textAlign: 'center', marginBottom: '5px', width: '100%', maxWidth: '700px' }}>
          <img src={loginLogoUrl} alt="Logo Grande" style={{ height: '350px', width: 'auto', marginBottom: '0px', objectFit: 'contain' }} />
        </div>

        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '25px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,100,200,0.1)', boxSizing: 'border-box' }}>
          {isRecovering ? (
            <>
              <h2 style={{ color: '#0369a1', marginBottom: '20px' }}>Recuperar Contraseña</h2>
              <p style={{ fontSize: '14px', color: '#4b5563', marginBottom: '20px' }}>Ingresa tu correo y te enviaremos las instrucciones.</p>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
               
                <input type="email" placeholder="Correo electrónico" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} 
                  value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} />
                
                <button type="button" onClick={async () => {
                  const correo = recoveryEmail.trim();
                  if (!correo) {
                    return mostrarAlerta("Por favor ingresa tu correo.", 'error');
                  }
                  
                  // VALIDACIÓN ESTRICTA DEL CORREO PARA RECUPERAR
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(correo)) {
                    return mostrarAlerta("Ingresa un correo electrónico válido.", 'error');
                  }

                  // --- AQUÍ EMPIEZA LA MAGIA REAL CONECTADA AL BACKEND ---
                  try {
                    const res = await fetch('https://ecotrack-server-v1.onrender.com/api/recuperar-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ correo })
                    });
                    
                    const data = await res.json();

                    if (res.ok) {
                      mostrarAlerta(`Las instrucciones han sido enviadas a ${correo}`, 'success');
                      setIsRecovering(false);
                    } else {
                      mostrarAlerta(data.message || "No se pudo enviar el enlace.", 'error');
                    }
                  } catch (error) {
                    mostrarAlerta("Error conectando con el servidor.", 'error');
                  }
                  // --- FIN DE LA MAGIA ---

                }} style={{ padding: '12px', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  ENVIAR ENLACE
                </button>
              </form>
              <button onClick={() => setIsRecovering(false)} style={{ marginTop: '20px', background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', textDecoration: 'underline' }}>
                Volver al inicio de sesión
              </button>
            </>
          ) : (
            <>
              <h2 style={{ color: '#0369a1', marginBottom: '20px' }}>{isRegistering ? 'Crear Cuenta Personal' : 'EcoTrack Login'}</h2>
      
              <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {isRegistering && (
                  <input type="text" placeholder="Tu nombre completo" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} 
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
                )}
                <input type="email" placeholder="Correo electrónico" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} 
                  onChange={(e) => setFormData({...formData, correo: e.target.value})} />
                <input type="password" placeholder="Contraseña (mínimo 6 caracteres)" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} />
                
                <button disabled={isLoggingIn} onClick={async () => {
                  
                  const correoValido = formData.correo.trim();
                  const passwordValida = formData.password.trim();

                  if (!correoValido || !passwordValida) {
                    return mostrarAlerta("Por favor, llena todos los campos de acceso.", 'error');
                  }

                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (!emailRegex.test(correoValido)) {
                    return mostrarAlerta("Correo electrónico inválido (ejemplo: usuario@correo.com).", 'error');
                  }

                  if (passwordValida.length < 6) {
                    return mostrarAlerta("La contraseña debe tener un mínimo de 6 caracteres.", 'error');
                  }
                  
                  if (isRegistering) {
                    const nombreValido = formData.nombre.trim();
                    if (!nombreValido) {
                      return mostrarAlerta("Por favor ingresa tu nombre.", 'error');
                    }
                    if (nombreValido.length < 3) {
                      return mostrarAlerta("El nombre debe tener por lo menos 3 letras.", 'error');
                    }
                    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombreValido)) {
                      return mostrarAlerta("El nombre únicamente acepta letras y espacios.", 'error');
                    }
                  }

                  setIsLoggingIn(true);
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
                        mostrarAlerta("¡Cuenta creada con éxito! Ya puedes iniciar sesión 🍃", 'success');
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
                        mostrarAlerta(`¡Bienvenido de nuevo, ${data.nombre || 'Usuario'}!`, 'success');
                      }
                    } else {
                      mostrarAlerta(data.message || "Credenciales incorrectas o error de acceso.", 'error');
                    }
                  } catch (error) {
                    mostrarAlerta("Error de comunicación con el servidor.", 'error');
                  } finally {
                    setIsLoggingIn(false);
                  }
                }} type="button" style={{ padding: '12px', background: isLoggingIn ? '#9ca3af' : '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor: isLoggingIn ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {isLoggingIn ? 'Verificando credenciales...' : (isRegistering ? 'REGISTRARME' : 'ENTRAR')}
                </button>
              </form>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: '#0369a1', cursor: 'pointer', textDecoration: 'underline' }}>
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

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', marginTop: '60px', color: '#1e293b', textAlign: 'center', maxWidth: '1000px' }}>
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
                  <div key={index} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', lineHeight: '1.4', textAlign: 'left', backgroundColor: msg.sender === 'user' ? '#10b981' : '#e5e7eb', color: msg.sender === 'user' ? '#fff' : '#1f2937' }}>
                    {msg.text}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '5px', padding: '5px 10px', overflowX: 'auto', backgroundColor: '#f3f4f6', borderTop: '1px solid #e5e7eb' }}>
                <button onClick={() => gestionarEnvioMensaje('Olvidé mi contraseña')} style={{ whiteSpace: 'nowrap', padding: '5px 10px', borderRadius: '15px', border: '1px solid #10b981', background: '#fff', color: '#10b981', fontSize: '11px', cursor: 'pointer' }}>Contraseña</button>
                <button onClick={() => gestionarEnvioMensaje('¿Qué es EcoTrack?')} style={{ whiteSpace: 'nowrap', padding: '5px 10px', borderRadius: '15px', border: '1px solid #10b981', background: '#fff', color: '#10b981', fontSize: '11px', cursor: 'pointer' }}>¿Qué es?</button>
                <button onClick={() => gestionarEnvioMensaje('¿Cómo crear cuenta?')} style={{ whiteSpace: 'nowrap', padding: '5px 10px', borderRadius: '15px', border: '1px solid #10b981', background: '#fff', color: '#10b981', fontSize: '11px', cursor: 'pointer' }}>Crear cuenta</button>
              </div>

              <div style={{ padding: '10px', display: 'flex', gap: '8px', backgroundColor: '#fff' }}>
                <input type="text" placeholder="Escribe tu duda..." value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') gestionarEnvioMensaje(); }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px', outline: 'none' }} 
                />
                <button onClick={() => gestionarEnvioMensaje()} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '0 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Enviar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsChatOpen(true)} style={{ width: '75px', height: '75px', borderRadius: '50%', backgroundColor: '#10b981', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.5)', transition: 'transform 0.2s' }}>💬</button>
          )}
        </div>
      </div>
    );
  }

  if (isLoggedIn && !hasCompany) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ecfdf5' }}>
        {renderEcoAlerta()}
        <div style={{ ...cardStyle, width: '450px', textAlign: 'center' }}>
          <h2 style={{ color: '#065f46' }}>Bienvenido, {userData.nombre}</h2>
          <div style={{ marginBottom: '15px', fontWeight: 'bold', color: userRol === 'admin' ? '#ef4444' : '#3b82f6', fontSize: '14px' }}>
            Nivel de Acceso Asignado: {userRol.toUpperCase()}
          </div>
          <button onClick={() => { setCompanyData({ nombreComercial: 'EcoTrack Principal' }); setHasCompany(true); }} style={{ padding: '15px', background: '#065f46', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            🏢 Entrar a: EcoTrack Principal
          </button>
        </div>
      </div>
    );
  }

  const ultimoRegistro = registros[0] || {};
  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#ecfdf5', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      {renderEcoAlerta()}
      
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select 
                value={tipoReporte} 
                onChange={(e) => setTipoReporte(e.target.value)}
                style={{ padding: '11px', borderRadius: '8px', border: '2px solid #10b981', backgroundColor: '#fff', color: '#065f46', fontWeight: 'bold', outline: 'none' }}
              >
                <option value="actual">Mes Actual</option>
                <option value="todos">Historial Completo</option>
              </select>
              <button onClick={generarReportePDF} style={{ padding: '12px 20px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                🖨️ Descargar Reporte PDF
              </button>
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, marginBottom: '30px' }}>
          <h3 style={{marginTop:0, color:'#374151'}}>Nuevo Registro de Consumo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '15px', alignItems: 'flex-end' }}>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>⚡ Luz</label><input type="number" value={luz.actual} onChange={(e) => setLuz({actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #fbbf24'}} /></div>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>💧 Agua</label><input type="number" value={agua.actual} onChange={(e) => setAgua({actual: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #38bdf8'}} /></div>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>♻️ Org.</label><input type="number" value={residuos.organicos} onChange={(e) => setResiduos({...residuos, organicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #4ade80'}} /></div>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>♻️ Inorg.</label><input type="number" value={residuos.inorganicos} onChange={(e) => setResiduos({...residuos, inorganicos: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #10b981'}} /></div>
            <div><label style={{fontWeight:'bold', color: '#1f2937'}}>♻️ Otros</label><input type="number" value={residuos.otros} onChange={(e) => setResiduos({...residuos, otros: e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'2px solid #065f46'}} /></div>
            
            <button onClick={async () => {
                if (luz.actual === '' || agua.actual === '' || residuos.organicos === '' || residuos.inorganicos === '' || residuos.otros === '') {
                  return mostrarAlerta("No puedes dejar ningún campo de consumo vacío.", 'error');
                }
                
                if (Number(luz.actual) <= 0 || Number(agua.actual) <= 0 || Number(residuos.organicos) <= 0 || Number(residuos.inorganicos) <= 0 || Number(residuos.otros) <= 0) {
                  return mostrarAlerta("Todos los consumos deben ser mayores a 0. No se permiten ceros ni negativos.", 'error');
                }

                const payload = { luz: Number(luz.actual), agua: Number(agua.actual), organicos: Number(residuos.organicos), inorganicos: Number(residuos.inorganicos), otros: Number(residuos.otros) };
                try {
                  const res = await fetch('https://ecotrack-server-v1.onrender.com/api/registros', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                  });
                  
                  if (res.ok) { 
                    mostrarAlerta("¡Datos ecológicos guardados con éxito! 💾", 'success');
                    setLuz({actual: ''}); setAgua({actual: ''}); setResiduos({organicos: '', inorganicos: '', otros: ''});
                    cargarDatos();
                  } else {
                    mostrarAlerta("Hubo un problema al almacenar el registro.", 'error');
                  }
                } catch(e) {
                  mostrarAlerta("Error en los servicios en la nube.", 'error');
                }
              }} style={{ padding: '12px 25px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', cursor:'pointer', fontWeight:'bold' }}>GUARDAR</button>
          </div>
        </div>

        {/* --- SECCIÓN DE GRÁFICAS SEPARADAS --- */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '30px' }}>
          <GraficaLuz datos={registros} />
          <GraficaAgua datos={registros} />
          <GraficaResiduos ultimoRegistro={ultimoRegistro} />
        </div>

        <div style={{ ...cardStyle, marginBottom: '30px' }}>
          <h3 style={{ color: '#065f46', marginTop: 0 }}>📋 Últimos Registros en la Nube (PostgreSQL)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
            <thead>
               <tr style={{ borderBottom: '2px solid #10b981', color: '#374151' }}>
                <th style={{ padding: '10px' }}>Fecha</th>
                <th>Luz (kWh)</th>
                <th>Agua (m³)</th>
                <th>Orgánicos (kg)</th>
                <th>Inorgánicos (kg)</th>
                <th>Otros (kg)</th>
                {userRol === 'admin' && <th>Acciones CRUD</th>}
              </tr>
            </thead>
            <tbody style={{ color: '#1f2937' }}>
              {registros.length === 0 ? (
                <tr>
                  <td colSpan={userRol === 'admin' ? 7 : 6} style={{ padding: '20px', color: '#6b7280' }}>
                    No hay registros disponibles.
                  </td>
                </tr>
              ) : (
                registros.map((r) => {
                  const idRegistro = r.id || r.id_registro;
                  const isEditing = editingRowId === idRegistro;

                  return (
                    <tr key={idRegistro} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', color: '#1f2937' }}>{formatearFecha(r.fecha_registro)}</td>
                      
                      <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.luz} onChange={(e)=>setEditRowData({...editRowData, luz: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.luz}</span>}</td>
                      <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.agua} onChange={(e)=>setEditRowData({...editRowData, agua: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.agua}</span>}</td>
                      <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.organicos} onChange={(e)=>setEditRowData({...editRowData, organicos: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.organicos || 0}</span>}</td>
                      <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.inorganicos} onChange={(e)=>setEditRowData({...editRowData, inorganicos: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.inorganicos || 0}</span>}</td>
                      <td>{isEditing ? <input type="number" style={{ width: '60px' }} value={editRowData.otros} onChange={(e)=>setEditRowData({...editRowData, otros: e.target.value})} /> : <span style={{ fontWeight: 'bold' }}>{r.otros || 0}</span>}</td>
                      
                      {userRol === 'admin' && (
                        <td style={{ padding: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          {isEditing ? (
                            <>
                              <button onClick={async () => {
                                const { luz, agua, organicos, inorganicos, otros } = editRowData;
                                
                                if (luz === '' || agua === '' || organicos === '' || inorganicos === '' || otros === '') {
                                  return mostrarAlerta("Ningún campo puede quedar vacío al editar.", 'error');
                                }
                                if (Number(luz) <= 0 || Number(agua) <= 0 || Number(organicos) <= 0 || Number(inorganicos) <= 0 || Number(otros) <= 0) {
                                  return mostrarAlerta("Todos los valores editados deben ser mayores a 0.", 'error');
                                }

                                try {
                                  const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/registros/${idRegistro}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ luz: Number(luz), agua: Number(agua), organicos: Number(organicos), inorganicos: Number(inorganicos), otros: Number(otros) })
                                  });
                                  if (res.ok) {
                                    mostrarAlerta("Cambios guardados exitosamente 👍", 'success');
                                    setEditingRowId(null);
                                    cargarDatos();
                                  } else {
                                    mostrarAlerta("Error al guardar las modificaciones en la nube.", 'error');
                                  }
                                } catch (error) {
                                  mostrarAlerta("Error de conexión con el servidor.", 'error');
                                }
                              }} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>💾</button>
                              
                              <button onClick={() => setEditingRowId(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>❌</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => {
                                setEditingRowId(idRegistro);
                                setEditRowData({ luz: r.luz, agua: r.agua, organicos: r.organicos || 0, inorganicos: r.inorganicos || 0, otros: r.otros || 0 });
                              }} style={{ background: '#fbbf24', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>✏️</button>
                              
                              <button onClick={async () => {
                                if (window.confirm("¿Estás completamente seguro de eliminar este registro histórico?")) {
                                  try {
                                    const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/registros/${idRegistro}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      mostrarAlerta("Registro eliminado de la base de datos permanentemente.", 'success');
                                      cargarDatos();
                                    } else {
                                      mostrarAlerta("No se pudo eliminar el registro histórico.", 'error');
                                    }
                                  } catch (error) {
                                    mostrarAlerta("Error de comunicación con el servidor.", 'error');
                                  }
                                }
                              }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>🗑️</button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;