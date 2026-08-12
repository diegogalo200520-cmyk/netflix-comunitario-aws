const poolData = {
  UserPoolId: 'us-east-1_lbx7F1tkm',
  ClientId: '31bg4qeprqgdemjgo83favbvbv'
};

document.addEventListener("DOMContentLoaded", () => {
  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');
  const formConfirm = document.getElementById('form-confirm');
  const authMessage = document.getElementById('auth-message');
  const btnTabLogin = document.getElementById('btn-tab-login');
  const btnTabSignup = document.getElementById('btn-tab-signup');

  let registeredEmail = '';

  // Cambio manual de vistas en el DOM
  btnTabLogin.onclick = (e) => {
    e.preventDefault();
    authMessage.textContent = '';
    formLogin.style.display = 'flex';
    formSignup.style.display = 'none';
    formConfirm.style.display = 'none';
    btnTabLogin.classList.add('active');
    btnTabSignup.classList.remove('active');
  };

  btnTabSignup.onclick = (e) => {
    e.preventDefault();
    authMessage.textContent = '';
    formLogin.style.display = 'none';
    formSignup.style.display = 'flex';
    formConfirm.style.display = 'none';
    btnTabSignup.classList.add('active');
    btnTabLogin.classList.remove('active');
  };

  // REGISTRO
  formSignup.onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    authMessage.style.color = '#fff';
    authMessage.textContent = 'Registrando usuario...';

    const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

    cognito.signUp({
      ClientId: poolData.ClientId,
      Username: email,
      Password: password,
      UserAttributes: [{ Name: 'email', Value: email }]
    }, (err, data) => {
      if (err) {
        authMessage.style.color = '#f44336';
        authMessage.textContent = err.message || 'Error al registrarse';
      } else {
        registeredEmail = email;
        formSignup.style.display = 'none';
        formConfirm.style.display = 'flex';
        authMessage.style.color = '#4caf50';
        authMessage.textContent = 'Código enviado a tu correo. Verifícalo.';
      }
    });
  };

  // CONFIRMACIÓN
  formConfirm.onsubmit = (e) => {
    e.preventDefault();
    const code = document.getElementById('confirm-code').value;

    const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

    cognito.confirmSignUp({
      ClientId: poolData.ClientId,
      Username: registeredEmail,
      ConfirmationCode: code
    }, (err, data) => {
      if (err) {
        authMessage.style.color = '#f44336';
        authMessage.textContent = err.message;
      } else {
        authMessage.style.color = '#4caf50';
        authMessage.textContent = '¡Cuenta verificada! Redirigiendo a inicio...';
        setTimeout(() => btnTabLogin.click(), 1500);
      }
    });
  };

  // INICIO DE SESIÓN
  formLogin.onsubmit = (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    authMessage.style.color = '#fff';
    authMessage.textContent = 'Iniciando sesión...';

    const cognito = new AWS.CognitoIdentityServiceProvider({ region: 'us-east-1' });

    cognito.initiateAuth({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: poolData.ClientId,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    }, (err, data) => {
      if (err) {
        authMessage.style.color = '#f44336';
        authMessage.textContent = err.message;
      } else {
        const idToken = data.AuthenticationResult.IdToken;
        localStorage.setItem('jwtToken', idToken);

        authMessage.style.color = '#4caf50';
        authMessage.textContent = '¡Sesión iniciada! Redirigiendo...';

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      }
    });
  };
});
