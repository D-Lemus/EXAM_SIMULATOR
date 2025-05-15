// Función para registrar un usuario
async function registrarUsuario(nombre, email, password) {
  try {
      const respuesta = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, password })
      });
      
      const data = await respuesta.json();
      
      // Mostrar mensaje específico para usuario existente
      if (respuesta.status === 400 && data.msg === 'El usuario ya existe') {
          return { success: false, msg: 'El correo ya está registrado. Por favor usa otro correo o inicia sesión.' };
      }
      
      return data;
  } catch (error) {
      console.error('Error al registrar usuario:', error);
      return { success: false, msg: 'Error de conexión' };
  }
}

// Función para iniciar sesión con mejor manejo de errores
async function iniciarSesion(email, password) {
    try {
        console.log('Intentando iniciar sesión con:', { email });
        
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include' // Importante para incluir cookies
        });
        
        console.log('Respuesta recibida:', respuesta.status);
        
        // Verificar si la respuesta es exitosa
        if (!respuesta.ok) {
            const errorData = await respuesta.json();
            return { success: false, msg: errorData.msg || `Error: ${respuesta.status}` };
        }
        
        // Intentar procesar la respuesta como JSON
        const datos = await respuesta.json();
        return datos;
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        return { success: false, msg: 'Error de conexión o formato de respuesta inválido' };
    }
}

// Función para cerrar sesión
async function cerrarSesion() {
  try {
      const respuesta = await fetch('/api/auth/logout', {
          method: 'POST',  // Cambiado a POST para mayor seguridad
          credentials: 'include'  // Importante para incluir cookies
      });
      const resultado = await respuesta.json();
      
      if (resultado.success) {
          window.location.href = '/';
      }
      
      return resultado;
  } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { success: false };
  }
}

// Función para obtener información del usuario actual
async function obtenerUsuario() {
  try {
      const respuesta = await fetch('/api/auth/user', {
          credentials: 'include'  // Importante para incluir cookies
      });
      
      if (respuesta.status === 401) {
          return { success: false, msg: 'No autenticado' };
      }
      
      const datos = await respuesta.json();
      return { success: true, user: datos };
  } catch (error) {
      console.error('Error al obtener usuario:', error);
      return { success: false, msg: 'Error de conexión' };
  }
}

// Verificar si hay un usuario autenticado al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
  // No verificar en la página de login
  if (window.location.pathname === '/login.html') return;
  
  const resultado = await obtenerUsuario();
  
  if (resultado.success) {
      // Actualizar UI con la información del usuario
      actualizarUIUsuario(resultado.user);
  } else if (window.location.pathname !== '/' && window.location.pathname !== '/home.html') {
      // Redirigir a home si no está autenticado y no está en la página principal
      window.location.href = '/';
  }
});

// Función para actualizar la UI con los datos del usuario
function actualizarUIUsuario(user) {
  // Actualizar el nombre y email en la interfaz
  const userNameElement = document.querySelector('.user-name');
  const userEmailElement = document.querySelector('.user-email');
  
  if (userNameElement) {
      userNameElement.textContent = user.nombre || 'Usuario';
  }
  
  if (userEmailElement) {
      userEmailElement.textContent = user.email || 'usuario@ejemplo.com';
  }
  
  // Añadir funcionalidad de cerrar sesión a elementos relevantes
  const userBtns = document.querySelectorAll('#userProfileBtn, #logoutBtn, #logoutBtnSidebar');
  userBtns.forEach(btn => {
      if (btn) {
          btn.addEventListener('click', function(e) {
              e.preventDefault();
              const confirmLogout = confirm('¿Deseas cerrar sesión?');
              if (confirmLogout) {
                  cerrarSesion();
              }
          });
      }
  });
}