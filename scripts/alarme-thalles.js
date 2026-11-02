// Dispara o alarme do Thalles: manda a notificação para os aparelhos dele e anota o horário no dia.
// Roda no GitHub Actions (7h40 e 19h40 de Brasília, seg a sex). Uso: node alarme-thalles.js [manha|noite]
const admin = require('firebase-admin');

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

const UID_THALLES = 'PugI4dZqSjgQ2VZaZTvTaJe7lXy1';
const TEXTOS = {
  manha: { titulo: 'Bom dia, Thalles! ⏰', corpo: 'Primeira demanda: ofertas e jornalzinho. Abra para desligar o alarme.' },
  noite: { titulo: 'Demanda das 20h ⏰', corpo: 'Programar o PodePostar. Abra para desligar o alarme.' },
};

async function main() {
  const brt = new Date(Date.now() - 3 * 3600 * 1000);          // horário de Brasília
  // sem argumento (agendado): antes do meio-dia é o da manhã
  const qual = process.argv[2] || (brt.getUTCHours() < 12 ? 'manha' : 'noite');
  const dia = brt.toISOString().slice(0, 10);

  const snap = await db.collection('tokens').where('uid', '==', UID_THALLES).get();
  const tokens = snap.docs.map(d => d.id);
  console.log(`${dia} ${qual}: ${tokens.length} aparelho(s)`);

  if (tokens.length) {
    const r = await admin.messaging().sendEachForMulticast({
      tokens,
      // só dados: o service worker do app monta o aviso que fica na tela e vibra
      data: { qual, ...TEXTOS[qual] },
      android: { priority: 'high' },
      webpush: { headers: { Urgency: 'high', TTL: '3600' } },
    });
    // aparelho que desinstalou ou trocou de endereço: tira da lista
    await Promise.all(r.responses.map((res, i) => {
      if (res.success) return null;
      console.log('falhou:', res.error && res.error.code);
      const codigo = res.error && res.error.code;
      if (codigo === 'messaging/registration-token-not-registered' || codigo === 'messaging/invalid-argument') {
        return db.collection('tokens').doc(tokens[i]).delete();
      }
      return null;
    }));
    console.log(`enviadas: ${r.successCount}, falharam: ${r.failureCount}`);
  }

  // o app também começa a tocar quando vê esse horário no dia (mesmo antes das 8h/20h)
  await db.collection('dias').doc(dia).set({ [qual === 'manha' ? 'm_push' : 'n_push']: Date.now() }, { merge: true });
}

main().catch(e => { console.error(e); process.exit(1); });
