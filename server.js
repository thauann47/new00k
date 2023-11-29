const {
  Client,
  GatewayIntentBits
} = require("discord.js");
const express = require('express');
const config = require('./config.json');
const app = express();
const cors = require('cors');
const moment = require('moment');
moment.locale('pt-BR')
const port = process.env.port || 80

//INICIANDO TODAS AS INTENTS
const client = new Client({
  intents: Object.keys(GatewayIntentBits).map((a) => {
      return GatewayIntentBits[a]
  }),
});

//SETANDO OS MIDDLEWARES
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(cors());
app.use(require('express-session')({
  "secret": require('crypto').randomBytes(64).toString('hex'),
  "cookie": {
      "maxAge": 7200000
  },
  "resave": true,
  "saveUninitialized": false
}));


//MIDDLEWARE PRA FORÇAR O USUÁRIO ESTAR LOGADO PRA ACESSAR ALGUMA PAGINA ESPECIFICA
function autorizacao(req, res, next) {
  if (!req.session.user) return res.redirect('/login')
  next();
}


//ROTA PRINCIPAL
app.get('/', async (req, res) => {
  const equipe = config.equipe
  try {
      const users_data = [];

      for (const user_id in equipe) {
          const member = await client.users.fetch(user_id).catch((error) => {
              console.error(`Erro ao buscar usuário ${user_id}: ${error.message}`);
              return null;
          });

          if (member) {
              const userData = {
                  id: member.id,
                  name: member.globalName || member.username,
                  photo: member.displayAvatarURL({
                      dynamic: true,
                      extension: "png",
                      size: 2048
                  }),
                  role: equipe[user_id],
              };

              users_data.push(userData);
          }
      }

      const user = req.session.user;
      res.render('index', {
          users_data,
          user
      });
  } catch (error) {
      console.error(`Erro na rota /: ${error.message}`);
      res.status(500).send('Erro interno do servidor');
  }
});


//REDERIZA A PAGINA DE COMANDOS
app.get('/comandos', autorizacao, async (req, res) => {
  var user = req.session.user
  res.render('comandos', {
      user
  })
})


//REDIRECIONA PARA O LINK DO SERVIDOR DE SUPORTE
app.get('/servidor', async (req, res) => {
  res.redirect(config.server_link)
})


//CALLBACK DE LOGIN
app.get('/login/callback', async (req, res) => {
  const codigo = req.query.code;
  if (!codigo) return res.send(`<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>

@import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300&family=Roboto:wght@100&display=swap');

          body {
              background-color: black;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
          }
  
          p {
              color: white;
              text-align: center;
              font-size: 24px;
          }
  
          strong {
              font-weight: bold;
          }
      </style>
  </head>
  <body>
      <p style="font-family: 'Roboto', sans-serif; font-family: 'Roboto Condensed', sans-serif;">Código inválido<br>
     retornando em <span id="counter">3</span> segundos...
      </p>
  </body>
  <script>

  var counter = 3;
  var countdown = setInterval(() => {
    document.getElementById("counter").innerText = counter;
    counter--;
    if (counter < 0) {
      clearInterval(countdown);
      history.back();
    }
  }, 1000);

  </script>
  </html>
`);

  const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
  };

  const requ = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: headers,
      body: `client_id=${config.oauth.client_id}&client_secret=${config.oauth.secret}&grant_type=authorization_code&redirect_uri=${config.oauth.redirect_uri}&scope=identify&code=${codigo}`
  });

  if (!requ.ok) {
      return res.send(`<!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
    
    @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300&family=Roboto:wght@100&display=swap');
  
              body {
                  background-color: black;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  height: 100vh;
                  margin: 0;
              }
      
              p {
                  color: white;
                  text-align: center;
                  font-size: 24px;
              }
      
              strong {
                  font-weight: bold;
              }
          </style>
      </head>
      <body>
          <p style="font-family: 'Roboto', sans-serif; font-family: 'Roboto Condensed', sans-serif;">Erro referente ao token de acesso da API do oauth2<br>
         retornando em <span id="counter">3</span> segundos...
          </p>
      </body>
      <script>
  
      var counter = 3;
      var countdown = setInterval(() => {
        document.getElementById("counter").innerText = counter;
        counter--;
        if (counter < 0) {
          clearInterval(countdown);
          history.back();
        }
      }, 1000);
  
      </script>
      </html>
  `);
  }

  const acc = await requ.json();
  const user_req = await fetch(`https://discord.com/api/users/@me`, {
      headers: {
          Authorization: `Bearer ${acc.access_token}`
      }
  });

  if (!user_req.ok) {
      return res.send(`<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>

@import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300&family=Roboto:wght@100&display=swap');

          body {
              background-color: black;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
          }
  
          p {
              color: white;
              text-align: center;
              font-size: 24px;
          }
  
          strong {
              font-weight: bold;
          }
      </style>
  </head>
  <body>
      <p style="font-family: 'Roboto', sans-serif; font-family: 'Roboto Condensed', sans-serif;">Não foi possivel pegar informações, reinicie a página<br>
     retornando em <span id="counter">3</span> segundos...
      </p>
  </body>
  <script>

  var counter = 3;
  var countdown = setInterval(() => {
    document.getElementById("counter").innerText = counter;
    counter--;
    if (counter < 0) {
      clearInterval(countdown);
      history.back();
    }
  }, 1000);

  </script>
  </html>
`);
  }

  const user_json = await user_req.json();


  var usrjs = await client.users.fetch(user_json.id).catch(err => {})

  req.session.user = {
      id: usrjs.id,
      nome: usrjs.globalName || usrjs.username,
      avatar: `${usrjs.displayAvatarURL({ dynamic: true, extension: 'png', size: 2048 })}`
  }
  res.redirect('/');
});

//ROTA DE MANUTENÇÃO
app.get('/manu', async (req, res) => {
  return res.send(`<!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>

@import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300&family=Roboto:wght@100&display=swap');

          body {
              background-color: black;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
          }
  
          p {
              color: white;
              text-align: center;
              font-size: 24px;
          }
  
          strong {
              font-weight: bold;
          }
      </style>
  </head>
  <body>
      <p style="font-family: 'Roboto', sans-serif; font-family: 'Roboto Condensed', sans-serif;">Em desenvolvimento<br>
     retornando em <span id="counter">3</span> segundos...
      </p>
  </body>
  <script>

  var counter = 3;
  var countdown = setInterval(() => {
    document.getElementById("counter").innerText = counter;
    counter--;
    if (counter < 0) {
      clearInterval(countdown);
      history.back();
    }
  }, 1000);

  </script>
  </html>
`);
})

//REDIRECT PARA O BOTÃO DE LOGIN
app.get('/login', (req, res) => {
  res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${config.oauth.client_id}&redirect_uri=${encodeURIComponent(config.oauth.redirect_uri)}&response_type=code&scope=${encodeURIComponent(config.oauth.scopes.join(" "))}`)
})

//ROTA QUE DESTROI A SESSÃO E ENCERRA O LOGIN DO USUÁRIO
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
      res.redirect('/');
  })
})

client.login(require('./config.json').token)

//INICIA O SERVIDOR EXPRESS
app.listen(port, () => {
  console.log(`[+] Servidor iniciado e rodando na porta: ${port}`);
});