// Configuração do Firebase do sistema de demandas (compartilhada pelo app do Thalles,
// pelo pomodoro do Michel e pelo service worker das notificações).
// Nada aqui é secreto: o acesso aos dados é travado pelas regras do Firestore (UIDs abaixo).
var FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBlbiE-mos4H_F8YhRVNGYeBVde0G3UeZI',
  authDomain: 'calleslab-demandas.firebaseapp.com',
  projectId: 'calleslab-demandas',
  storageBucket: 'calleslab-demandas.firebasestorage.app',
  messagingSenderId: '287187600971',
  appId: '1:287187600971:web:075d38f9448a29ba7fefce'
};
// Chave pública das notificações (Cloud Messaging → Certificados push da Web)
var VAPID_KEY = 'BFYI4VJ2FwbtUosdmN7KHsGEqO997yxeuc_jr8taBytR6TVf7Suk5d-A7q8wVZPnkJMos_3GcY82ZswP3Tl08xE';
var UID_THALLES = 'PugI4dZqSjgQ2VZaZTvTaJe7lXy1';
var UID_MICHEL = '8TWvR5cnsMPiXmgo4Q7pWaipEzi2';

// As demandas do dia, na ordem
var DEMANDAS = {
  d1: 'Produzir as ofertas e o jornalzinho',
  d2: 'Enviar os arquivos nos grupos de cada cliente',
  d3: 'Programar as ofertas e os conteúdos no PodePostar'
};
