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

// INIT FIREBASE
firebase.initializeApp(firebaseConfig);

// DB
const db = firebase.firestore();


// ================================
// ⏳ FECHA FIN SORTEO
// ================================

const fechaFin = new Date("2026-01-31T23:59:59").getTime();


// ================================
// ⏱ CONTADOR OPTIMIZADO
// ================================

const intervalo = setInterval(() => {

  const ahora = new Date().getTime();
  const diff = fechaFin - ahora;

  if (diff <= 0) {

    document.getElementById("contador").innerHTML = "🎉 Sorteo finalizado";
    document.getElementById("btnParticipar").disabled = true;
    document.getElementById("btnParticipar").innerText = "Sorteo cerrado";

    clearInterval(intervalo);
    obtenerGanador();
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

  // Fingerprint load
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  deviceID = result.visitorId;

  console.log("DeviceID listo:", deviceID);

  btn.disabled = false;

  // Panel admin
  if (window.location.hash === "#admin316") {
    document.getElementById("admin316").style.display = "block";
  }

  // Ver ganador guardado
  const ganadorRef = db.collection("ganador").doc("actual");
  const doc = await ganadorRef.get();

  if (doc.exists) {
    document.getElementById("ganador").innerHTML = doc.data().nombre;
  }

});


// ================================
// 🎟 PARTICIPAR SORTEO
// ================================

async function participarSorteo() {

  const btn = document.getElementById("btnParticipar");
  btn.disabled = true;

  const nombre = document.getElementById("nombreInput").value.trim();

  const whatsapp = document.getElementById("whatsappInput")
    .value.replace(/\D/g, "");

  const msg = document.getElementById("mensajeSorteo");

  // Esperar fingerprint
  if (!deviceID) {
    msg.innerHTML = "⏳ Cargando seguridad, intenta de nuevo...";
    msg.style.color = "orange";
    btn.disabled = false;
    return;
  }

  // Campos vacíos
  if (nombre === "" || whatsapp === "") {
    msg.innerHTML = "❌ Completa todos los campos";
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  // Validar WhatsApp MX
  if (!/^[0-9]{10}$/.test(whatsapp)) {
    msg.innerHTML = "❌ WhatsApp inválido (10 dígitos)";
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  // LocalStorage protección
  if (localStorage.getItem("yaParticipaste")) {
    msg.innerHTML = "⚠ Ya participaste desde este dispositivo";
    msg.style.color = "orange";
    btn.disabled = false;
    return;
  }

  // Firebase protección por deviceID
  const existe = await db.collection("participantes")
    .where("deviceID", "==", deviceID)
    .get();

  if (!existe.empty) {
    msg.innerHTML = "⚠ Este dispositivo ya participó";
    msg.style.color = "orange";
    localStorage.setItem("yaParticipaste", "true");
    btn.disabled = false;
    return;
  }

  // Guardar participante
  await db.collection("participantes").add({
    nombre,
    whatsapp,
    deviceID,
    fecha: firebase.firestore.FieldValue.serverTimestamp()
  });

  localStorage.setItem("yaParticipaste", "true");

  msg.innerHTML = "✅ Participación registrada correctamente";
  msg.style.color = "#25D366";

  document.getElementById("nombreInput").value = "";
  document.getElementById("whatsappInput").value = "";

}


// ================================
// 🏆 GANADOR GLOBAL
// ================================

async function obtenerGanador() {

  const ganadorRef = db.collection("ganador").doc("actual");
  const yaExiste = await ganadorRef.get();

  if (yaExiste.exists) {
    document.getElementById("ganador").innerHTML = yaExiste.data().nombre;
    return;
  }

  const snap = await db.collection("participantes").get();

  if (snap.empty) {
    document.getElementById("ganador").innerHTML = "Sin participantes";
    return;
  }

  let lista = [];

  snap.forEach(doc => {
    lista.push({
      id: doc.id,
      ...doc.data()
    });
  });

  const random = Math.floor(Math.random() * lista.length);
  const ganador = lista[random];

  await ganadorRef.set({
    id: ganador.id,
    nombre: ganador.nombre,
    whatsapp: ganador.whatsapp,
    fecha: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById("ganador").innerHTML = ganador.nombre;

}


// ================================
// 🔎 ADMIN VER GANADOR
// ================================

async function verGanadorAdmin() {

  const doc = await db.collection("ganador").doc("actual").get();

  if (!doc.exists) {
    alert("Aún no hay ganador");
    return;
  }

  const data = doc.data();

  document.getElementById("adminData").innerText =
`ID: ${data.id}
Nombre: ${data.nombre}
WhatsApp: ${data.whatsapp}`;

}
