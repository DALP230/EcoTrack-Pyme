import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, CartesianGrid, Legend, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- DEFINICIÓN DE LOGOS SEGÚN LA VISTA ---
// Se agregó %20 para evitar que los espacios rompan las imágenes en la nube
const loginLogoUrl = '/Logo-Ecotrack%20(2).png';
const dashboardHeaderLogoUrl = '/logo-ecotrack.png'; 

// ==========================================
// PALETA DE COLORES
// ==========================================
const colors = {
  luz: '#f59e0b',       
  luzText: '#b45309',
  agua: '#0ea5e9',      
  aguaText: '#0369a1',
  organicos: '#10b981', 
  organicosText: '#15803d',
  inorganicos: '#14b8a6',
  inorganicosText: '#0f766e',
  otros: '#f97316',     
  otrosText: '#b91c1c',
  primary: '#16a34a',   
  loginInputBg: '#f0f9ff', 
  loginInputBlue: '#0369a1' 
};

// ==========================================
// COMPONENTES DE GRÁFICAS
// ==========================================

function GraficaLuz({ datos }) {
  const datosCronologicos = [...datos].reverse();
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', border: `2px solid ${colors.luz}`, flex: '1 1 300px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: colors.luzText, fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}>⚡ Consumo de Luz</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={datosCronologicos}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha_registro" tickFormatter={(t) => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, {month:'short', day:'numeric'}); }} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#374151' }} />
            <YAxis style={{ fontSize: '12px', fontWeight: 'bold', fill: '#374151' }} />
            <Tooltip contentStyle={{fontWeight: 'bold', borderRadius: '8px'}}/>
            <Legend wrapperStyle={{fontWeight: 'bold'}}/>
            <Bar dataKey="luz" name="Luz (kWh)" fill={colors.luz} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GraficaAgua({ datos }) {
  const datosCronologicos = [...datos].reverse();
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', border: `2px solid ${colors.agua}`, flex: '1 1 300px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: colors.aguaText, fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}>💧 Consumo de Agua</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <LineChart data={datosCronologicos}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="fecha_registro" tickFormatter={(t) => { const d = new Date(t); return isNaN(d) ? '' : d.toLocaleDateString(undefined, {month:'short', day:'numeric'}); }} style={{ fontSize: '12px', fontWeight: 'bold', fill: '#374151' }} />
            <YAxis style={{ fontSize: '12px', fontWeight: 'bold', fill: '#374151' }} />
            <Tooltip contentStyle={{fontWeight: 'bold', borderRadius: '8px'}}/>
            <Legend wrapperStyle={{fontWeight: 'bold'}}/>
            <Line type="monotone" dataKey="agua" name="Agua (m³)" stroke={colors.agua} strokeWidth={4} activeDot={{ r: 10, strokeWidth: 2, stroke: '#fff' }} dot={{strokeWidth: 3}} />
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
  const coloresPastel = pieDataRaw.length > 0 ? [colors.organicos, colors.inorganicos, colors.otros] : ['#d1d5db'];
  return (
    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', border: `2px solid ${colors.organicos}`, flex: '1 1 300px' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: colors.organicosText, fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}>♻️ Distribución de Residuos</h3>
      <div style={{ width: '100%', height: 250, display: 'flex', justifyContent: 'center' }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={datosGraficoPastel} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
              {datosGraficoPastel.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={coloresPastel[index % coloresPastel.length]} style={{outline: 'none'}}/>
              ))}
            </Pie>
            <Tooltip contentStyle={{fontWeight: 'bold', borderRadius: '8px'}} formatter={(value) => pieDataRaw.length > 0 ? `${value} kg` : '0 kg'} />
            <Legend wrapperStyle={{fontWeight: 'bold'}}/>
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
  const [isLoggingIn, setIsLoggingIn] = useState(false); 
  
  const [hasCompany, setHasCompany] = useState(false);
  const [userRol, setUserRol] = useState('user');
  const [userData, setUserData] = useState({ nombre: '' });
  const [companyData, setCompanyData] = useState({ nombreComercial: '', rfc: '', ciudad: '' });
  const [formData, setFormData] = useState({ nombre: '', correo: '', password: '' });
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
    { sender: 'bot', text: '¡Hola! Soy el Asistente Virtual de EcoTrack. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [alerta, setAlerta] = useState({ mostrar: false, mensaje: '', tipo: 'error' });

  const mostrarAlerta = (mensaje, tipo = 'error') => {
    setAlerta({ mostrar: true, mensaje, tipo });
    setTimeout(() => {
      setAlerta(prev => prev.mensaje === mensaje ? { ...prev, mostrar: false } : prev);
    }, 4500);
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
    setEditingRowId(null);
    setEditRowData({});
    setLuz({ actual: '' });
    setAgua({ actual: '' });
    setResiduos({ organicos: '', inorganicos: '', otros: '' });
    setFormData({ nombre: '', correo: '', password: '' });
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
      let respuestaBot = 'Si presentas problemas técnicos avanzados, por favor escribe a asistencia.ecotrack@gmail.com 📧';

      if (textoGuardado.includes('hola') || textoGuardado.includes('buenos') || textoGuardado.includes('buenas')) {
        respuestaBot = '¡Hola! Bienvenido al soporte de EcoTrack. Estoy aquí para resolver tus dudas sobre el acceso o el uso básico del sistema.';
      } else if (textoGuardado.includes('contraseña') || textoGuardado.includes('password') || textoGuardado.includes('entrar')) {
        respuestaBot = 'Si olvidaste tu contraseña, utiliza el botón "Contactar al Administrador" en la pantalla de inicio de sesión para solicitar el restablecimiento.';
      } else if (textoGuardado.includes('registro') || textoGuardado.includes('cuenta') || textoGuardado.includes('crear')) {
        respuestaBot = 'Puedes crear una cuenta personal haciendo clic en el enlace "¿No tienes cuenta? Regístrate aquí" debajo del botón de Entrar.';
      } else if (textoGuardado.includes('qué es') || textoGuardado.includes('ecotrack') || textoGuardado.includes('funciona')) {
        respuestaBot = 'EcoTrack es una plataforma diseñada para auditar y gestionar el impacto ecológico corporativo mediante el monitoreo de consumos y residuos.';
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: respuestaBot }]);
    }, 800);
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
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(colors.organicosText);
      doc.text("Reporte de Sostenibilidad - EcoTrack", 14, 25);
      
      doc.setLineWidth(1);
      doc.setDrawColor(colors.primary); 
      doc.line(14, 30, 196, 30);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(55, 65, 81);
      doc.text(`Empresa: ${companyData.nombreComercial || 'EcoTrack Principal'}`, 14, 40);
      doc.text(`Periodo: ${subTituloPeriodo}`, 14, 47);
      doc.text(`Generado por: ${userData.nombre || 'Usuario'} (Rol: ${(userRol || 'user').toUpperCase()})`, 14, 54);
      doc.text(`Fecha de emisión: ${fechaActual.toLocaleDateString()}`, 14, 61);

      const tableColumn = ["Fecha", "Luz (kWh)", "Agua (m³)", "Residuos Totales (kg)"];
      const tableRows = [];

      registrosAExportar.forEach(r => {
        const totalResiduos = Number(r.organicos || 0) + Number(r.inorganicos || 0) + Number(r.otros || 0);
        const rowData = [
          formatearFecha(r.fecha_registro),
          { content: `${r.luz} kWh`, styles: { textColor: colors.luzText, fontStyle: 'bold' } },
          { content: `${r.agua} m³`, styles: { textColor: colors.aguaText, fontStyle: 'bold' } },
          { content: `${totalResiduos} kg`, styles: { textColor: colors.organicosText, fontStyle: 'bold' } }
        ];
        tableRows.push(rowData);
      });

      const opcionesTabla = {
        head: [tableColumn],
        body: tableRows,
        startY: 68,
        theme: 'grid',
        styles: { 
          fontSize: 11, 
          cellPadding: 5, 
          textColor: [31, 41, 55],
          font: 'helvetica',
          halign: 'center',
          lineColor: [209, 213, 219] 
        },
        headStyles: { 
          fillColor: colors.primary, 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 12
        },
        alternateRowStyles: { 
          fillColor: '#f9fafb' 
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
        : `Reporte_EcoTrack_Historial.pdf`;

      doc.save(nombreArchivo);
    } catch (error) {
      console.error("Error completo del PDF:", error);
      mostrarAlerta("Error al generar el PDF: " + error.message, 'error');
    }
  };

  const cardStyle = { 
    backgroundColor: 'rgba(255, 255, 255, 0.85)', 
    backdropFilter: 'blur(12px)',
    padding: '25px', 
    borderRadius: '25px', 
    boxShadow: '0 10px 25px rgba(0,0,0,0.06)', 
    border: '1px solid #e5e7eb'
  };

  const renderEcoAlerta = () => {
    if (!alerta.mostrar) return null;
    return (
      <div style={{
        position: 'fixed',
        top: '25px',
        right: '25px',
        zIndex: 9999,
        padding: '18px 26px',
        borderRadius: '16px',
        backgroundColor: alerta.tipo === 'success' ? '#def7ec' : '#fde8e8',
        color: alerta.tipo === 'success' ? '#03543f' : '#9b1c1c',
        border: `3px solid ${alerta.tipo === 'success' ? colors.organicos : '#f8b4b4'}`, 
        boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        fontWeight: 'bold',
        fontSize: '15px',
        maxWidth: '400px',
        fontFamily: 'sans-serif',
        animation: 'slideInRight 0.5s ease-out'
      }}>
        <span style={{ fontSize: '20px' }}>{alerta.tipo === 'success' ? '✅ ÉXITO:' : '⚠️ ERROR:'}</span>
        <div style={{ flex: 1, textAlign: 'left', lineHeight: '1.4' }}>{alerta.mensaje}</div>
        <button onClick={() => setAlerta({ ...alerta, mostrar: false })} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>✕</button>
      </div>
    );
  };

  const baseInputStyle = {
    padding: '14px',
    borderRadius: '10px',
    backgroundColor: colors.loginInputBg, 
    color: colors.loginInputBlue, 
    fontWeight: 'bold',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
    border: '2px solid #bae6fd' 
  };

  const loginInputStyle = {
    ...baseInputStyle,
    width: '100%'
  };

  // ==========================================
  // VISTA 1: LOGIN Y REGISTRO
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div style={{ 
        minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', 
        justifyContent: 'center', alignItems: 'center', 
        background: 'linear-gradient(180deg, #7dd3fc 0%, #f0f9ff 70%, #ffffff 100%)',
        padding: '20px', boxSizing: 'border-box', position: 'relative', overflowX: 'hidden'
      }}>
        
        {/* SISTEMA DE ESCANEO DE PANTALLA (MEDIA QUERIES) Y REPARACIÓN DE TEXTOS INVISIBLES */}
        <style>{`
          /* Previene el texto invisible provocado por el autocompletado del navegador */
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus {
            -webkit-text-fill-color: #0369a1 !important;
            box-shadow: 0 0 0px 1000px #f0f9ff inset !important;
            transition: background-color 5000s ease-in-out 0s;
          }
          
          .beneficios-row {
            display: flex; flex-wrap: nowrap; justify-content: center; gap: 40px; margin-top: 60px; color: #1e293b; text-align: center; max-width: 1000px; padding-bottom: 40px;
          }

          /* Responsividad: Transforma filas a columnas cuando detecta celular/tablet */
          @media (max-width: 900px) {
            .beneficios-row { flex-wrap: wrap; gap: 20px; }
            .beneficios-row > div { width: 45% !important; }
          }
          @media (max-width: 600px) {
            .beneficios-row > div { width: 100% !important; }
          }
        `}</style>

        {renderEcoAlerta()}
        
        <div style={{ textAlign: 'center', marginBottom: '-15px', marginTop: '-20px', width: '100%', maxWidth: '840px', zIndex: 1 }}>
          <img src={loginLogoUrl} alt="Logo Grande EcoTrack" style={{ height: '420px', maxWidth: '100%', display: 'block', margin: '0 auto', objectFit: 'contain' }} />
        </div>

        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '25px', width: '100%', maxWidth: '400px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0,100,200,0.1)', boxSizing: 'border-box', zIndex: 2 }}>
          <h2 style={{ color: colors.aguaText, marginBottom: '20px', fontWeight: 'bold', fontSize: '24px' }}>{isRegistering ? 'Crear Cuenta Personal' : 'Acceso al Sistema'}</h2>
  
          <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {isRegistering && (
              <input type="text" placeholder="Tu nombre completo" style={loginInputStyle} 
                onChange={(e) => setFormData({...formData, nombre: e.target.value})} />
            )}
            <input type="email" placeholder="Correo electrónico" style={loginInputStyle} 
              onChange={(e) => setFormData({...formData, correo: e.target.value})} />
            <input type="password" placeholder="Contraseña (mínimo 6 caracteres)" style={loginInputStyle} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} />
            
            <button disabled={isLoggingIn} onClick={async () => {
              const correoValido = formData.correo.trim();
              const passwordValida = formData.password.trim();

              if (!correoValido || !passwordValida) {
                return mostrarAlerta("Por favor, llena todos los campos obligatorios.", 'error');
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
                  return mostrarAlerta("Por favor, ingresa tu nombre.", 'error');
                }
                if (nombreValido.length < 3) {
                  return mostrarAlerta("El nombre debe tener por lo menos 3 caracteres.", 'error');
                }
                if (!/^[a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1\s]+$/.test(nombreValido)) {
                  return mostrarAlerta("El nombre únicamente acepta letras y espacios.", 'error');
                }
              }

              setIsLoggingIn(true);
              const url = isRegistering ? 'registro' : 'login';
              
              try {
                const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/${url}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  // VALIDACIÓN: Se envía el payload depurado
                  body: JSON.stringify({
                    nombre: formData.nombre.trim(),
                    correo: correoValido.toLowerCase(),
                    password: passwordValida
                  })
                });
                const data = await res.json();

                if (res.ok) {
                  if (isRegistering) {
                    mostrarAlerta("Cuenta creada con éxito. Ya puedes iniciar sesión.", 'success');
                    setIsRegistering(false);
                  } else {
                    const correoIngresado = correoValido.toLowerCase();
                    if (
                      correoIngresado === 'lopezperezdavidantonio8@gmail.com' || 
                      correoIngresado === 'asistencia.ecotrack@gmail.com' ||
                      correoIngresado === '230i0030@martineztorre.tecnm.mx' ||
                      correoIngresado === 'solecitocortes75@gmail.com'
                    ) {
                      setUserRol('admin');
                    } else {
                      setUserRol('user');
                    }
                    setIsLoggedIn(true);
                    setUserData({ nombre: data.nombre || 'Usuario' });
                    mostrarAlerta(`Bienvenido, ${data.nombre || 'Usuario'}. Sesión iniciada correctamente.`, 'success');
                  }
                } else {
                  mostrarAlerta(data.message || "Credenciales incorrectas o error de acceso.", 'error');
                }
              } catch (error) {
                mostrarAlerta("Error de comunicación con el servidor.", 'error');
              } finally {
                setIsLoggingIn(false);
              }
            }} type="button" style={{ padding: '14px', background: isLoggingIn ? '#9ca3af' : colors.primary, color: '#fff', border: 'none', borderRadius: '10px', cursor: isLoggingIn ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginTop: '10px', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              {isLoggingIn ? 'Procesando...' : (isRegistering ? 'REGISTRARSE' : 'INICIAR SESIÓN')}
            </button>
          </form>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '25px' }}>
            <button onClick={() => setIsRegistering(!isRegistering)} style={{ background: 'none', border: 'none', color: colors.loginInputBlue, cursor: 'pointer', textDecoration: 'underline', fontSize: '15px', fontWeight: 'bold' }}>
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
            
            {!isRegistering && (
              <div style={{ 
                marginTop: '15px', padding: '20px', borderRadius: '16px', 
                backgroundColor: '#f8fafc', border: '2px solid #e2e8f0', textAlign: 'center' 
              }}>
                <p style={{ color: '#1e293b', fontSize: '15px', fontWeight: 'bold', margin: '0 0 6px 0' }}>¿Olvidaste tu contraseña?</p>
                <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                  Por seguridad, solicita el restablecimiento directamente al administrador del sistema.
                </p>
                <a href="mailto:asistencia.ecotrack@gmail.com?subject=Restablecer%20Contraseña%20-%20EcoTrack" style={{ color: colors.primary, fontWeight: 'bold', fontSize: '14px', textDecoration: 'underline', display: 'inline-block', padding: '5px' }}>
                  Contactar al Administrador
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="beneficios-row">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <img src="/ahorro.png" alt="Ahorro de recursos" style={{ width: '70px', height: '70px', marginBottom: '15px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: 'bold', color: colors.aguaText, letterSpacing: '0.5px' }}>AHORRO DE RECURSOS</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.4', opacity: '0.9', margin: 0 }}>Identifica y reduce consumos innecesarios para disminuir costos operativos.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <img src="/destaca.png" alt="Cumplimiento Normativo" style={{ width: '70px', height: '70px', marginBottom: '15px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: 'bold', color: colors.aguaText, letterSpacing: '0.5px' }}>CUMPLE Y DESTACA</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.4', opacity: '0.9', margin: 0 }}>Facilita el cumplimiento normativo y mejora drásticamente tu imagen sostenible.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <img src="/decisiones.png" alt="Decisiones Estratégicas" style={{ width: '70px', height: '70px', marginBottom: '15px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: 'bold', color: colors.aguaText, letterSpacing: '0.5px' }}>DECISIONES INTELIGENTES</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.4', opacity: '0.9', margin: 0 }}>Datos claros y en tiempo real para mejores decisiones gerenciales.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '200px' }}>
            <img src="/nube.png" alt="Acceso Centralizado" style={{ width: '70px', height: '70px', marginBottom: '15px', objectFit: 'contain' }} />
            <h3 style={{ fontSize: '15px', marginBottom: '10px', fontWeight: 'bold', color: colors.aguaText, letterSpacing: '0.5px' }}>FÁCIL Y ACCESIBLE</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.4', opacity: '0.9', margin: 0 }}>Plataforma en la nube moderna, accesible desde cualquier lugar y escalable.</p>
          </div>
        </div>

        {/* Chatbot flotante */}
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000, fontFamily: 'sans-serif' }}>
          {isChatOpen ? (
            <div style={{ width: '340px', height: '480px', backgroundColor: '#fff', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `2px solid ${colors.primary}` }}>
              <div style={{ backgroundColor: '#064e3b', color: '#fff', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🍃</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>Asistente de Soporte</div>
                    <div style={{ fontSize: '12px', opacity: 0.85 }}>En línea ahora</div>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '20px', fontWeight: 'bold' }}>✕</button>
              </div>

              <div style={{ flex: 1, padding: '18px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f9fafb' }}>
                {chatMessages.map((msg, index) => (
                  <div key={index} style={{ alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '12px 16px', borderRadius: '14px', fontSize: '14px', lineHeight: '1.5', textAlign: 'left', backgroundColor: msg.sender === 'user' ? colors.primary : '#e5e7eb', color: msg.sender === 'user' ? '#fff' : '#1f2937', fontWeight: msg.sender === 'user' ? 'bold' : 'normal', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    {msg.text}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '6px', padding: '8px 12px', overflowX: 'auto', backgroundColor: '#f3f4f6', borderTop: '1px solid #e5e7eb' }}>
                {['Olvidé mi contraseña', '¿Qué es EcoTrack?', 'Crear cuenta'].map(text => (
                  <button key={text} onClick={() => gestionarEnvioMensaje(text)} style={{ whiteSpace: 'nowrap', padding: '7px 12px', borderRadius: '20px', border: `2px solid ${colors.primary}`, background: '#fff', color: colors.primary, fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>{text}</button>
                ))}
              </div>

              <div style={{ padding: '12px', display: 'flex', gap: '10px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}>
                <input type="text" placeholder="Escribe tu consulta..." value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') gestionarEnvioMensaje(); }} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '2px solid #ddd', fontSize: '14px', outline: 'none', color: '#1f2937', fontWeight: 'bold' }} />
                <button onClick={() => gestionarEnvioMensaje()} style={{ backgroundColor: colors.primary, color: '#fff', border: 'none', padding: '0 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>Enviar</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setIsChatOpen(true)} style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: colors.primary, color: '#fff', border: 'none', cursor: 'pointer', fontSize: '36px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 6px 20px rgba(22, 163, 74, 0.5)' }}>💬</button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 2: SELECCIÓN DE EMPRESA
  // ==========================================
  if (isLoggedIn && !hasCompany) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#ecfdf5', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' }}>
        {renderEcoAlerta()}
        <div style={{ ...cardStyle, width: '480px', textAlign: 'center', padding: '40px', border: `3px solid ${colors.primary}` }}>
          <h2 style={{ color: colors.organicosText, fontWeight: 'bold', fontSize: '28px', marginBottom: '15px' }}>Bienvenido al Panel, {userData.nombre}</h2>
          <div style={{ marginBottom: '25px', fontWeight: 'bold', color: userRol === 'admin' ? '#ef4444' : colors.aguaText, fontSize: '16px', backgroundColor: userRol === 'admin' ? '#fee2e2' : '#e0f2fe', padding: '10px', borderRadius: '10px', display: 'inline-block' }}>
            Nivel de Acceso Asignado: {userRol.toUpperCase()}
          </div>
          <p style={{color: '#4b5563', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px'}}>Selecciona la entidad o sucursal correspondiente para comenzar a gestionar los datos de consumo.</p>
          <button onClick={() => { setCompanyData({ nombreComercial: 'EcoTrack Principal' }); setHasCompany(true); }} style={{ padding: '18px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%', fontSize: '18px', boxShadow: '0 5px 10px rgba(0,0,0,0.1)' }}>
            🏢 Ingresar a EcoTrack Principal
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VISTA 3: DASHBOARD PRINCIPAL
  // ==========================================
  const ultimoRegistro = registros[0] || {};
  return (
    <div style={{ width: '100vw', minHeight: '100vh', backgroundColor: '#f3f4f6', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif', color: '#1f2937', overflowX: 'hidden' }}>
      
      {/* SISTEMA DE ESCANEO DE PANTALLA PARA EL DASHBOARD */}
      <style>{`
        .header-box { display: flex; justify-content: space-between; align-items: center; padding: 15px 50px; background-color: #fff; border-bottom: 5px solid ${colors.primary}; }
        .data-inputs-row { display: grid; grid-template-columns: repeat(6, 1fr); gap: 15px; align-items: flex-end; width: 100%; }
        
        @media (max-width: 950px) {
          .header-box { flex-direction: column; gap: 15px; text-align: center; padding: 15px 20px; }
          .header-box > div { justify-content: center; text-align: center !important; }
          .data-inputs-row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 600px) {
          .data-inputs-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {renderEcoAlerta()}

      <header className="header-box" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <img src={dashboardHeaderLogoUrl} alt="Logo Horizontal EcoTrack" style={{ height: '75px', objectFit: 'contain' }} />
          <h1 style={{ color: colors.organicosText, margin: 0, fontWeight: 'bold', fontSize: '28px' }}>Plataforma EcoTrack</h1>
        </div>
        <div style={{display:'flex', alignItems:'center', gap: '25px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <div>
            <div style={{ fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>{userData.nombre}</div>
            <div style={{ fontSize: '13px', color: colors.primary, fontWeight: 'bold' }}>📍 {companyData.nombreComercial} (Panel de Control)</div>
          </div>
          <button onClick={handleLogout} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 3px 5px rgba(239, 68, 68, 0.3)' }}>Cerrar Sesión</button>
        </div>
      </header>

      <main style={{ padding: '20px 40px', flex: 1, boxSizing: 'border-box' }}>
        
        <div className="header-box" style={{ ...cardStyle, marginBottom: '35px', borderBottom: 'none', borderLeft: `8px solid ${colors.primary}` }}>
          <div>
            <h2 style={{ color: colors.organicosText, marginTop: 0, fontWeight: 'bold', fontSize: '26px' }}>📊 Dashboard de Gestión Ambiental</h2>
            <p style={{ color: '#4b5563', margin: 0, fontSize: '16px', lineHeight: '1.5' }}>Supervisa y administra el impacto ecológico con estadísticas en tiempo real.</p>
          </div>
          {/* SEGURIDAD: BOTONES DE REPORTE BLOQUEADOS PARA USUARIO COMÚN */}
          {userRol === 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '10px' }}>
              <select 
                value={tipoReporte} 
                onChange={(e) => setTipoReporte(e.target.value)} 
                style={{ padding: '13px', borderRadius: '10px', border: `3px solid ${colors.primary}`, backgroundColor: '#fff', color: colors.organicosText, fontWeight: 'bold', outline: 'none', fontSize: '14px', cursor: 'pointer' }}
              >
                <option value="actual">Reporte: Mes Actual</option>
                <option value="todos">Reporte: Historial Completo</option>
              </select>
              <button onClick={generarReportePDF} style={{ padding: '14px 24px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', fontSize: '14px' }}>
                🖨️ Descargar Reporte PDF
              </button>
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, marginBottom: '35px', backgroundColor: '#fff', border: '1px solid #e5e7eb' }}>
          <h3 style={{marginTop:0, color:'#111827', fontWeight: 'bold', fontSize: '20px', marginBottom: '20px'}}>⚡ Captura de Nuevos Consumos</h3>
          
          <div className="data-inputs-row">
            {[
              { label: '⚡ Luz (kWh)', value: luz.actual, setter: (val) => setLuz({actual: val}), color: colors.luz, colorText: colors.luzText },
              { label: '💧 Agua (m³)', value: agua.actual, setter: (val) => setAgua({actual: val}), color: colors.agua, colorText: colors.aguaText },
              { label: '♻️ Orgánicos (kg)', value: residuos.organicos, setter: (val) => setResiduos({...residuos, organicos: val}), color: colors.organicos, colorText: colors.organicosText },
              { label: '🗑️ Inorgánicos (kg)', value: residuos.inorganicos, setter: (val) => setResiduos({...residuos, inorganicos: val}), color: colors.inorganicos, colorText: colors.inorganicosText },
              { label: '⚠️ Otros (kg)', value: residuos.otros, setter: (val) => setResiduos({...residuos, otros: val}), color: colors.otros, colorText: colors.otrosText },
            ].map((item, idx) => (
              <div key={idx}>
                <label style={{fontWeight:'bold', color: item.colorText, fontSize: '14px', marginBottom: '8px', display: 'block'}}>{item.label}</label>
                <input 
                  type="number" 
                  value={item.value} 
                  onChange={(e) => item.setter(e.target.value)} 
                  style={{...baseInputStyle, width: '100%', borderColor: item.color, borderSize: '3px', fontSize: '15px', padding: '12px'}} 
                  placeholder="0.00"
                />
              </div>
            ))}
            
            <div>
              <button onClick={async () => {
                const lStr = String(luz.actual).trim();
                const aStr = String(agua.actual).trim();
                const oStr = String(residuos.organicos).trim();
                const iStr = String(residuos.inorganicos).trim();
                const otStr = String(residuos.otros).trim();

                // VALIDACIÓN: Blindaje absoluto (Ningún campo vacío, cero o negativo)
                if (!lStr || !aStr || !oStr || !iStr || !otStr) {
                  return mostrarAlerta("Error: Todos los campos son obligatorios. No dejes ninguno vacío.", 'error');
                }
                if (Number(lStr) <= 0 || Number(aStr) <= 0 || Number(oStr) <= 0 || Number(iStr) <= 0 || Number(otStr) <= 0) {
                  return mostrarAlerta("Error: Todos los consumos registrados deben ser estrictamente mayores a 0.", 'error');
                }
                
                try {
                  const res = await fetch('https://ecotrack-server-v1.onrender.com/api/registros', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      luz: Number(lStr), 
                      agua: Number(aStr), 
                      organicos: Number(oStr), 
                      inorganicos: Number(iStr), 
                      otros: Number(otStr) 
                    })
                  });
                  if (res.ok) {
                    mostrarAlerta("Registro de consumo guardado exitosamente.", 'success');
                    setLuz({ actual: '' }); setAgua({ actual: '' }); setResiduos({ organicos: '', inorganicos: '', otros: '' });
                    cargarDatos();
                  } else {
                    mostrarAlerta("Ocurrió un error al intentar guardar el registro en la base de datos.", 'error');
                  }
                } catch (error) {
                  mostrarAlerta("Error de conexión al servidor.", 'error');
                }
              }} style={{ width: '100%', padding: '14px 20px', background: colors.primary, color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>GUARDAR DATOS</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', marginBottom: '35px' }}>
          <GraficaLuz datos={registros} />
          <GraficaAgua datos={registros} />
          <GraficaResiduos ultimoRegistro={ultimoRegistro} />
        </div>

        <div style={{ ...cardStyle, backgroundColor: '#fff', border: `3px solid ${colors.agua}`, padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#111827', fontWeight: 'bold', fontSize: '20px', borderBottom: '3px solid #e5e7eb', paddingBottom: '15px', marginBottom: '20px' }}>📅 Historial de Registros</h3>
          
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', color: '#1f2937', fontSize: '14px', borderBottom: '3px solid #d1d5db' }}>
                  <th style={{ padding: '15px', fontWeight: 'bold' }}>Fecha</th>
                  <th style={{ padding: '15px', fontWeight: 'bold', color: colors.luzText }}>Luz (kWh)</th>
                  <th style={{ padding: '15px', fontWeight: 'bold', color: colors.aguaText }}>Agua (m³)</th>
                  <th style={{ padding: '15px', fontWeight: 'bold', color: colors.organicosText }}>Orgánicos (kg)</th>
                  <th style={{ padding: '15px', fontWeight: 'bold', color: colors.inorganicosText }}>Inorgánicos (kg)</th>
                  <th style={{ padding: '15px', fontWeight: 'bold', color: colors.otrosText }}>Otros (kg)</th>
                  {userRol === 'admin' && <th style={{ padding: '15px', fontWeight: 'bold' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr><td colSpan={userRol === 'admin' ? 7 : 6} style={{ padding: '30px', color: '#6b7280', fontSize: '16px', fontWeight: 'bold' }}>No hay registros disponibles en la base de datos.</td></tr>
                ) : (
                  registros.map((row) => {
                    const isEditing = userRol === 'admin' && editingRowId === row.id;
                    const idRegistro = row.id;
                    
                    return (
                      <tr key={idRegistro} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: isEditing ? '#f0f9ff' : 'transparent', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '15px', fontSize: '14px', color: '#4b5563', fontWeight: 'bold' }}>{formatearFecha(row.fecha_registro)}</td>
                        
                        {[
                          { key: 'luz', value: row.luz, color: colors.luzText, border: colors.luz },
                          { key: 'agua', value: row.agua, color: colors.aguaText, border: colors.agua },
                          { key: 'organicos', value: row.organicos, color: colors.organicosText, border: colors.organicos },
                          { key: 'inorganicos', value: row.inorganicos, color: colors.inorganicosText, border: colors.inorganicos },
                          { key: 'otros', value: row.otros, color: colors.otrosText, border: colors.otros }
                        ].map(cell => (
                          <td key={cell.key} style={{ padding: '15px', fontWeight: 'bold', color: cell.color, fontSize: '15px' }}>
                            {isEditing ? (
                              <input 
                                type="number" 
                                style={{...baseInputStyle, width: '90px', padding: '8px', fontSize: '14px', textAlign: 'center', borderColor: cell.border}} 
                                value={editRowData[cell.key]} 
                                onChange={(e) => setEditRowData({...editRowData, [cell.key]: e.target.value})} 
                              />
                            ) : (
                              `${cell.value} ${cell.key === 'luz' ? 'kWh' : cell.key === 'agua' ? 'm³' : 'kg'}`
                            )}
                          </td>
                        ))}
                        
                        {userRol === 'admin' && (
                          <td style={{ padding: '15px', display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
                            {isEditing ? (
                              <>
                                <button onClick={async () => {
                                  const elStr = editRowData.luz !== undefined && editRowData.luz !== null ? String(editRowData.luz).trim() : '';
                                  const eaStr = editRowData.agua !== undefined && editRowData.agua !== null ? String(editRowData.agua).trim() : '';
                                  const eoStr = editRowData.organicos !== undefined && editRowData.organicos !== null ? String(editRowData.organicos).trim() : '';
                                  const eiStr = editRowData.inorganicos !== undefined && editRowData.inorganicos !== null ? String(editRowData.inorganicos).trim() : '';
                                  const eotStr = editRowData.otros !== undefined && editRowData.otros !== null ? String(editRowData.otros).trim() : '';

                                  // VALIDACIÓN ABSOLUTA EN EDICIÓN
                                  if (!elStr || !eaStr || !eoStr || !eiStr || !eotStr) {
                                    return mostrarAlerta("Error: No puedes dejar campos en blanco durante la edición.", 'error');
                                  }
                                  if (Number(elStr) <= 0 || Number(eaStr) <= 0 || Number(eoStr) <= 0 || Number(eiStr) <= 0 || Number(eotStr) <= 0) {
                                    return mostrarAlerta("Error: Todos los valores ingresados deben ser mayores a 0.", 'error');
                                  }

                                  try {
                                    const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/registros/${idRegistro}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        luz: Number(elStr),
                                        agua: Number(eaStr),
                                        organicos: Number(eoStr),
                                        inorganicos: Number(eiStr),
                                        otros: Number(eotStr)
                                      })
                                    });
                                    if (res.ok) {
                                      mostrarAlerta("Registro histórico actualizado correctamente.", 'success');
                                      setEditingRowId(null);
                                      cargarDatos();
                                    } else {
                                      mostrarAlerta("Ocurrió un error al intentar actualizar el registro.", 'error');
                                    }
                                  } catch (error) {
                                    mostrarAlerta("Error de conexión al intentar actualizar los datos.", 'error');
                                  }
                                }} style={{ background: colors.primary, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>✔️ Guardar</button>
                                <button onClick={() => setEditingRowId(null)} style={{ background: '#9ca3af', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>❌ Cancelar</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => {
                                  setEditingRowId(idRegistro);
                                  setEditRowData({ luz: row.luz, agua: row.agua, organicos: row.organicos, inorganicos: row.inorganicos, otros: row.otros });
                                }} style={{ background: colors.agua, color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>✏️ Editar</button>
                                
                                <button onClick={async () => {
                                  if (window.confirm("¿Estás seguro de eliminar este registro histórico? Esta acción es irreversible.")) {
                                    try {
                                      const res = await fetch(`https://ecotrack-server-v1.onrender.com/api/registros/${idRegistro}`, { method: 'DELETE' });
                                      if (res.ok) {
                                        mostrarAlerta("Registro eliminado de la base de datos.", 'success');
                                        cargarDatos();
                                      } else {
                                        mostrarAlerta("No se pudo eliminar el registro histórico.", 'error');
                                      }
                                    } catch (error) {
                                      mostrarAlerta("Error de conexión al intentar eliminar el registro.", 'error');
                                    }
                                  }
                                }} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>🗑️ Eliminar</button>
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
        </div>
      </main>
      
      <footer style={{ textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
        © 2026 Plataforma EcoTrack. Todos los derechos reservados.
      </footer>
    </div>
  );
}

export default App;