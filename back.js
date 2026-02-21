// ================================
// 🔐 DEVICE ID (Fingerprint)
// ================================

let deviceID = null;


// ================================
// 🔥 FIREBASE CONFIG
// ================================

const firebaseConfig = {
  apiKey: "AIzaSyDJ2G3OYOGGn5XEINJiCmoN6UHocXfDJD8",
  authDomain: "sorteo-activaciones.firebaseapp.com",
  projectId: "sorteo-activaciones",
  storageBucket: "sorteo-activaciones.firebasestorage.app",
  messagingSenderId: "180448055243",
  appId: "1:180448055243:web:629bb44ca3aef30848b04e"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();



// ================================
// 📅 CLAVE MES ACTUAL
// ================================

function obtenerClaveMes(fecha = new Date()) {
  return `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
}


// ================================
// ⏳ CONTADOR DINÁMICO FIN DE MES
// ================================

function fechaFinMes() {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1).getTime();
}

const intervalo = setInterval(() => {

  const ahora = new Date().getTime();
  const diff = fechaFinMes() - ahora;

  if (diff <= 0) {
    document.getElementById("contador").innerHTML = "🎉 Sorteo finalizado";
    clearInterval(intervalo);
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("contador").innerHTML =
    `${d}d ${h}h ${m}m ${s}s`;

}, 1000);


// ================================
// 🚀 LOAD PRINCIPAL
// ================================

window.addEventListener("load", async () => {

  const btn = document.getElementById("btnParticipar");
  btn.disabled = true;

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    deviceID = result.visitorId;
  } catch (error) {

    deviceID = localStorage.getItem("deviceFallback");

    if (!deviceID) {
      deviceID = "fallback_" + crypto.randomUUID();
      localStorage.setItem("deviceFallback", deviceID);
    }
  }

  btn.disabled = false;

  if (window.location.hash === "#admin316") {
    document.getElementById("admin316").style.display = "block";
  }

  mostrarGanador();

});


// ================================
// 🎟 PARTICIPAR SORTEO (POR MES)
// ================================

async function participarSorteo() {

  const btn = document.getElementById("btnParticipar");
  btn.disabled = true;

  const nombre = document.getElementById("nombreInput").value.trim();
  const whatsapp = document.getElementById("whatsappInput").value.replace(/\D/g, "");
  const msg = document.getElementById("mensajeSorteo");

  if (!deviceID) {
    msg.innerHTML = "⏳ Cargando seguridad...";
    msg.style.color = "orange";
    btn.disabled = false;
    return;
  }

  if (nombre === "" || whatsapp === "") {
    msg.innerHTML = "❌ Completa todos los campos";
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  if (!/^[0-9]{10}$/.test(whatsapp)) {
    msg.innerHTML = "❌ WhatsApp inválido";
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  const clave = obtenerClaveMes();
  const participantesRef = db.collection("sorteos")
    .doc(clave)
    .collection("participantes");

  const existe = await participantesRef
    .where("deviceID", "==", deviceID)
    .get();

  if (!existe.empty) {
    msg.innerHTML = "⚠ Este dispositivo ya participó este mes";
    msg.style.color = "orange";
    btn.disabled = false;
    return;
  }

  await participantesRef.add({
    nombre,
    whatsapp,
    deviceID,
    fecha: firebase.firestore.FieldValue.serverTimestamp()
  });

  msg.innerHTML = "✅ Participación registrada";
  msg.style.color = "#25D366";

  document.getElementById("nombreInput").value = "";
  document.getElementById("whatsappInput").value = "";

  btn.disabled = false;
}


// ================================
// 🏆 MOSTRAR GANADOR (1-5 DEL MES)
// ================================

async function mostrarGanador() {

  const ahora = new Date();
  const dia = ahora.getDate();

  const claveMesAnterior = obtenerClaveMes(
    new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  );

  const ganadorEl = document.getElementById("ganador");

  if (dia > 5) {
    ganadorEl.innerHTML = "Aún no definido";
    return;
  }

  const doc = await db.collection("sorteos")
    .doc(claveMesAnterior)
    .get();

  if (doc.exists && doc.data().ganador) {
    ganadorEl.innerHTML = doc.data().ganador;
  } else {
    ganadorEl.innerHTML = "Aún no definido";
  }
}


// ================================
// 🔎 ADMIN VER GANADOR DEL MES ANTERIOR
// ================================

async function verGanadorAdmin() {

  const ahora = new Date();

  const claveMesAnterior = obtenerClaveMes(
    new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  );

  const doc = await db.collection("sorteos")
    .doc(claveMesAnterior)
    .get();

  if (!doc.exists || !doc.data().ganador) {
    alert("Aún no hay ganador");
    return;
  }

  const data = doc.data();

  document.getElementById("adminData").innerText =
`Nombre: ${data.ganador}
WhatsApp: ${data.whatsapp}`;
}
// ================================
// 📅 MOSTRAR MES ACTUAL EN TÍTULO
// ================================

function obtenerNombreMes(fecha = new Date()) {
  const meses = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL",
    "MAYO", "JUNIO", "JULIO", "AGOSTO",
    "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
  ];
  return meses[fecha.getMonth()];
}

const titulo = document.getElementById("tituloSorteo");
titulo.innerHTML = `SORTEO DE ${obtenerNombreMes()} 🎁`;
