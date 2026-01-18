
let deviceID = null;

window.addEventListener("load", () => {

  const btn = document.getElementById("btnParticipar");
  btn.disabled = true;

  FingerprintJS.load().then(fp => {
    fp.get().then(result => {

      deviceID = result.visitorId;
      btn.disabled = false;

      console.log("DeviceID listo:", deviceID);

    });
  });

});


// CONFIG TUYA


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


// ⏳ FECHA FIN SORTEO
const fechaFin = new Date("2026-01-31T23:59:59").getTime();


// CONTADOR
setInterval(() => {

  const ahora = new Date().getTime();
  const diff = fechaFin - ahora;

  if (diff <= 0) {
  document.getElementById("contador").innerHTML = "🎉 Sorteo finalizado";
  document.getElementById("btnParticipar").disabled = true;
document.getElementById("btnParticipar").innerText = "Sorteo cerrado";

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


// PARTICIPAR
async function participarSorteo() {

  const btn = document.getElementById("btnParticipar");
  btn.disabled = true;

  const nombre = document.getElementById("nombreInput").value.trim();
  const whatsapp = document.getElementById("whatsappInput").value.trim();
  const msg = document.getElementById("mensajeSorteo");

  // Esperar fingerprint
  if (!deviceID) {
    msg.innerHTML = "⏳ Espera un segundo...";
    btn.disabled = false;
    return;
  }

  // Ya participó
  if (localStorage.getItem("yaParticipaste")) {
    msg.innerHTML = "⚠ Ya participaste desde este dispositivo";
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

  // Teléfono inválido
  if (!/^[0-9]{10}$/.test(whatsapp)) {
    msg.innerHTML = "❌ Ingresa un WhatsApp válido (10 dígitos)";
    msg.style.color = "red";
    btn.disabled = false;
    return;
  }

  // Validar dispositivo duplicado
  const existe = await db.collection("participantes")
    .where("deviceID", "==", deviceID)
    .get();

  if (!existe.empty) {
    msg.innerHTML = "⚠ Ya participaste desde este dispositivo";
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

  msg.innerHTML = "✅ Participación registrada";
  msg.style.color = "#25D366";

  document.getElementById("nombreInput").value = "";
  document.getElementById("whatsappInput").value = "";

}





// GANADOR AUTOMÁTICO GLOBAL
async function obtenerGanador() {

  const ganadorRef = db.collection("ganador").doc("actual");
  const yaExiste = await ganadorRef.get();

  // Si ya existe ganador no vuelve a sortear
  if (yaExiste.exists) {
    const data = yaExiste.data();
    document.getElementById("ganador").innerHTML = data.nombre;
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

  // Guardar ganador definitivo
  await ganadorRef.set({
    id: ganador.id,
    nombre: ganador.nombre,
    whatsapp: ganador.whatsapp,
    fecha: firebase.firestore.FieldValue.serverTimestamp()
  });

  document.getElementById("ganador").innerHTML = ganador.nombre;
}


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


window.addEventListener("load", async () => {

  if (window.location.hash === "#admin316") {
    document.getElementById("admin316").style.display = "block";
  }

  // Ver si ya hay ganador guardado
  const ganadorRef = db.collection("ganador").doc("actual");
  const doc = await ganadorRef.get();

  if (doc.exists) {
    document.getElementById("ganador").innerHTML = doc.data().nombre;
  }

});



