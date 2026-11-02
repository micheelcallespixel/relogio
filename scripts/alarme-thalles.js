// Alarme do Thalles: manda notificação para os aparelhos dele de minuto em minuto até ele digitar a senha.
// Roda no GitHub Actions. Agendado (sem argumentos): acorda 7h40/19h40 e espera dar 8h/20h para começar.
// Manual: node alarme-thalles.js <manha|noite> [zerar]  ("zerar" apaga o registro de hoje, para testar de novo)
const admin = require('firebase-admin');

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

const UID_THALLES = 'PugI4dZqSjgQ2VZaZTvTaJe7lXy1';
const TEXTOS = {
  manha: { titulo: 'Bom dia, Thalles! ⏰', corpo: 'Primeira demanda: ofertas e jornalzinho. Abra para desligar o alarme.' },
  noite: { titulo: 'Demanda das 20h ⏰', corpo: 'Programar o PodePostar. Abra para desligar o alarme.' },
};
const HORA = { manha: 8 * 60, noite: 20 * 60 };   // minutos do dia, Brasília
const REPETICOES = 30;                              // até 30 min tocando
const esperar = ms => new Promise(r => setTimeout(r, ms));
const brt = () => new Date(Date.now() - 3 * 3600 * 1000);   // horário de Brasília

async function enviar(qual) {
  const snap = await db.collection('tokens').where('uid', '==', UID_THALLES).get();
  const tokens = snap.docs.map(d => d.id);
  if (!tokens.length) { console.log('nenhum aparelho com avisos ativados'); return 0; }
  const r = await admin.messaging().sendEachForMulticast({
    tokens,
    // só dados: o service worker do app monta o aviso que fica na tela e vibra
    data: { qual, ...TEXTOS[qual] },
    android: { priority: 'high' },
    webpush: { headers: { Urgency: 'high', TTL: '300' } },
  });
  // aparelho que desinstalou ou trocou de endereço: tira da lista
  await Promise.all(r.responses.map((res, i) => {
    const codigo = res.error && res.error.code;
    if (!res.success) console.log('falhou:', codigo);
    if (codigo === 'messaging/registration-token-not-registered' || codigo === 'messaging/invalid-argument') {
      return db.collection('tokens').doc(tokens[i]).delete();
    }
    return null;
  }));
  console.log(`${tokens.length} aparelho(s): enviadas ${r.successCount}, falharam ${r.failureCount}`);
  return r.successCount;
}

async function main() {
  const manual = !!process.argv[2];
  const qual = process.argv[2] || (brt().getUTCHours() < 12 ? 'manha' : 'noite');
  const dia = brt().toISOString().slice(0, 10);
  const ref = db.collection('dias').doc(dia);
  const campoSenha = qual === 'manha' ? 'm_senha' : 'n_senha';
  const campoPush = qual === 'manha' ? 'm_push' : 'n_push';

  if (process.argv[3] === 'zerar') {
    await ref.delete();
    console.log(`registro de ${dia} apagado (teste)`);
  }

  // agendado: espera dar o horário certo (o GitHub acorda 20 min antes por causa dos atrasos)
  if (!manual) {
    const agora = brt(), falta = HORA[qual] - (agora.getUTCHours() * 60 + agora.getUTCMinutes());
    if (falta > 0) {
      console.log(`esperando ${falta} min até ${qual === 'manha' ? '8h' : '20h'}`);
      await esperar(falta * 60000 - agora.getUTCSeconds() * 1000);
    }
  }

  for (let i = 1; i <= REPETICOES; i++) {
    const d = (await ref.get()).data() || {};
    if (d[campoSenha]) { console.log(`senha digitada: alarme desligado na ${i - 1}ª notificação`); return; }
    if (i === 1 && !d[campoPush]) await ref.set({ [campoPush]: Date.now() }, { merge: true });
    console.log(`notificação ${i}/${REPETICOES}`);
    await enviar(qual);
    await esperar(60000);
  }
  console.log('30 min sem a senha: parou de mandar (fica registrado no histórico)');
}

main().catch(e => { console.error(e); process.exit(1); });
