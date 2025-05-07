// Función para registrar un usuario
async function registrarUsuario(nombre, email, password) {
  try {
      const respuesta = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, password })
      });
      
      return await respuesta.json();
  } catch (error) {
      console.error('Error al registrar usuario:', error);
      return { success: false, msg: 'Error de conexión' };
  }
}

// Función para iniciar sesión
async function iniciarSesion(email, password) {
  try {
      const respuesta = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
      });
      
      return await respuesta.json();
  } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return { success: false, msg: 'Error de conexión' };
  }
}

// Función para cerrar sesión
async function cerrarSesion() {
  try {
      const respuesta = await fetch('/api/auth/logout');
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
      const respuesta = await fetch('/api/auth/user');
      
      if (respuesta.status === 401) {
          window.location.href = '/';
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
  
  // Añadir funcionalidad de cerrar sesión al botón de usuario
  const userBtn = document.querySelector('.user-btn');
  if (userBtn) {
      userBtn.addEventListener('click', function(e) {
          e.preventDefault();
          const confirmLogout = confirm('¿Deseas cerrar sesión?');
          if (confirmLogout) {
              cerrarSesion();
          }
      });
  }
}