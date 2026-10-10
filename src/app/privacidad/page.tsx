export const metadata = {
  title: 'Aviso de Privacidad — Muscle Meals',
  description: 'Aviso de privacidad conforme a la LFPDPPP.',
}

export default function PrivacidadPage() {
  return (
    <main style={{ background: '#faf9f7', minHeight: '100vh', fontFamily: "'Barlow', system-ui, sans-serif", color: '#1a1714' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&display=swap');
        .priv-wrap { max-width: 700px; margin: 0 auto; padding: 48px 24px 80px; }
        .priv-wrap h1 { font-size: clamp(22px, 4vw, 30px); font-weight: 700; margin: 0 0 8px; }
        .priv-wrap h2 { font-size: 17px; font-weight: 700; margin: 40px 0 12px; display: flex; align-items: center; gap: 10px; }
        .priv-wrap h2::before { content: ''; display: block; width: 4px; height: 18px; background: #F79138; border-radius: 2px; flex-shrink: 0; }
        .priv-wrap p, .priv-wrap ul { color: #4a4540; margin: 0 0 14px; max-width: 65ch; line-height: 1.7; }
        .priv-wrap ul { padding-left: 20px; }
        .priv-wrap ul li { margin-bottom: 6px; }
        .info-card { background: #fff; border: 1px solid #e8e3dc; border-radius: 10px; padding: 20px 24px; margin: 20px 0; }
        .info-row { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #efe9e1; font-size: 14px; }
        .info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .info-row:first-child { padding-top: 0; }
        .info-label { font-weight: 600; min-width: 120px; flex-shrink: 0; }
        .info-value { color: #4a4540; }
        .placeholder { background: #fff3cd; border: 1px dashed #f79138; border-radius: 4px; padding: 1px 6px; font-weight: 700; color: #7a4800; font-style: normal; }
        .arco-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin: 16px 0; }
        .arco-item { background: #fff; border: 1px solid #e8e3dc; border-radius: 8px; padding: 14px 16px; }
        .arco-letter { font-size: 22px; font-weight: 700; color: #F79138; line-height: 1; margin-bottom: 4px; }
        .arco-word { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
        .arco-desc { font-size: 12px; color: #7a726b; }
        .contact-box { background: #fff; border: 1px solid #e8e3dc; border-left: 3px solid #F79138; border-radius: 8px; padding: 16px 20px; margin: 16px 0; font-size: 14px; color: #4a4540; }
        .contact-box strong { color: #1a1714; display: block; margin-bottom: 4px; }
        .doc-header { border-bottom: 2px solid #F79138; padding-bottom: 24px; margin-bottom: 40px; }
        .doc-meta { font-size: 13px; color: #7a726b; display: flex; gap: 20px; flex-wrap: wrap; }
        .logo { display: flex; align-items: center; gap: 10px; margin-bottom: 40px; }
        .logo-mark { width: 36px; height: 36px; background: #F79138; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-name { font-size: 18px; font-weight: 700; }
        .priv-footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #efe9e1; font-size: 12px; color: #7a726b; }
      `}</style>

      <div className="priv-wrap">
        <div className="logo">
          <div className="logo-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M4 6h12M4 14h8" stroke="#17140f" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="logo-name">Muscle Meals</span>
        </div>

        <div className="doc-header">
          <h1>Aviso de Privacidad</h1>
          <div className="doc-meta">
            <span>Última actualización: octubre 2026</span>
            <span>Versión 1.0</span>
          </div>
        </div>

        <h2>Responsable del tratamiento</h2>
        <p>
          MAVAR ALIMENTOS (en adelante &ldquo;nosotros&rdquo; o &ldquo;la empresa&rdquo;) es el responsable del tratamiento de sus datos personales conforme a lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP).
        </p>

        <div className="info-card">
          <div className="info-row"><span className="info-label">Razón social</span><span className="info-value">MAVAR ALIMENTOS</span></div>
          <div className="info-row"><span className="info-label">RFC</span><span className="info-value">MAL251014C36</span></div>
          <div className="info-row"><span className="info-label">Domicilio</span><span className="info-value">Milan 6317, Satélite Acueducto, Monterrey, Nuevo León, C.P. 64960</span></div>
          <div className="info-row"><span className="info-label">Sitio web</span><span className="info-value">musclemeals.com.mx</span></div>
          <div className="info-row"><span className="info-label">Correo</span><span className="info-value">carlosmadruga7@gmail.com</span></div>
        </div>

        <h2>Datos personales que recopilamos</h2>
        <p>Para brindar nuestros servicios de entrega de comida preparada, recopilamos los siguientes datos:</p>
        <ul>
          <li><strong>Identificación:</strong> nombre completo y correo electrónico</li>
          <li><strong>Contacto:</strong> número de teléfono celular</li>
          <li><strong>Entrega:</strong> dirección postal (calle, número, colonia, código postal)</li>
          <li><strong>Transaccionales:</strong> historial de pedidos, productos seleccionados, montos pagados</li>
          <li><strong>Técnicos:</strong> información del dispositivo y sesión al usar nuestra plataforma</li>
        </ul>
        <p>No recopilamos datos bancarios directamente; los pagos son procesados por proveedores certificados.</p>

        <h2>Finalidades del tratamiento</h2>
        <p>Utilizamos sus datos para las siguientes finalidades <strong>necesarias</strong> para la prestación del servicio:</p>
        <ul>
          <li>Procesar y entregar sus pedidos de comida</li>
          <li>Comunicarle el estado de su pedido por correo electrónico y/o WhatsApp</li>
          <li>Gestionar pagos y facturación</li>
          <li>Atender dudas, quejas o aclaraciones</li>
        </ul>
        <p>Y para las siguientes finalidades <strong>secundarias</strong>, de las cuales puede oponerse:</p>
        <ul>
          <li>Envío de información sobre nuevos productos o promociones</li>
          <li>Encuestas de satisfacción</li>
        </ul>

        <h2>Comunicaciones por WhatsApp</h2>
        <p>Con su consentimiento, utilizamos la plataforma WhatsApp Business API (Meta Platforms) para enviarle notificaciones de pedido, confirmaciones de pago y mensajes relacionados con su cuenta. Al proporcionar su número de teléfono y aceptar recibir comunicaciones, usted otorga su consentimiento para este canal.</p>
        <p>Puede solicitar en cualquier momento que dejemos de contactarle por WhatsApp escribiéndonos a carlosmadruga7@gmail.com.</p>

        <h2>Transferencia de datos a terceros</h2>
        <p>Sus datos pueden ser compartidos con los siguientes proveedores de servicios únicamente en la medida necesaria para operar la plataforma:</p>
        <ul>
          <li><strong>MercadoPago</strong> — procesamiento de pagos en línea</li>
          <li><strong>Meta Platforms (WhatsApp)</strong> — envío de notificaciones y comunicaciones</li>
          <li><strong>Supabase</strong> — alojamiento seguro de base de datos</li>
          <li><strong>Vercel</strong> — infraestructura de la plataforma web</li>
        </ul>
        <p>No vendemos, rentamos ni cedemos sus datos personales a terceros con fines comerciales propios.</p>

        <h2>Derechos ARCO</h2>
        <p>Usted tiene derecho a ejercer en cualquier momento los siguientes derechos sobre sus datos personales:</p>
        <div className="arco-grid">
          <div className="arco-item"><div className="arco-letter">A</div><div className="arco-word">Acceso</div><div className="arco-desc">Conocer qué datos tenemos sobre usted</div></div>
          <div className="arco-item"><div className="arco-letter">R</div><div className="arco-word">Rectificación</div><div className="arco-desc">Corregir datos incorrectos o incompletos</div></div>
          <div className="arco-item"><div className="arco-letter">C</div><div className="arco-word">Cancelación</div><div className="arco-desc">Solicitar la eliminación de sus datos</div></div>
          <div className="arco-item"><div className="arco-letter">O</div><div className="arco-word">Oposición</div><div className="arco-desc">Oponerse al uso de sus datos para ciertos fines</div></div>
        </div>
        <p>Para ejercer sus derechos ARCO, envíe su solicitud indicando: nombre completo, correo asociado a su cuenta y descripción del derecho que desea ejercer.</p>
        <div className="contact-box">
          <strong>Correo electrónico</strong>
          carlosmadruga7@gmail.com — responderemos en un plazo máximo de 20 días hábiles conforme a la LFPDPPP.
        </div>

        <h2>Conservación de datos</h2>
        <p>Sus datos se conservarán durante el tiempo que mantenga una relación activa con nosotros y durante los plazos que la legislación fiscal y comercial mexicana exija. Al término de esta relación, los datos serán eliminados o anonimizados.</p>

        <h2>Cambios a este aviso</h2>
        <p>Podemos actualizar este aviso de privacidad cuando sea necesario. Cualquier cambio sustancial será notificado por correo electrónico o mediante un aviso en nuestra plataforma. La versión vigente siempre estará disponible en musclemeals.com.mx/privacidad.</p>

        <div className="priv-footer">
          <p>© 2026 Muscle Meals · musclemeals.com.mx/privacidad · México</p>
          <p>Este aviso fue elaborado conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su Reglamento.</p>
        </div>
      </div>
    </main>
  )
}
