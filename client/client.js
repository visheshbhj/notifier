var publicKey = ''
window.addEventListener('load', () => {
    fetch('/vapidPublic', {method: 'GET'})
    .then(response => response.json())
    .then((result) => publicKey=result.vapidPublicKey);
});


document.getElementById('subscribe').addEventListener('click',() =>send(publicKey));

function send(vapidPublicKey) {
      console.log('Permision = '+ Notification.permission)
      if (Notification.permission !== 'denied' || Notification.permission === "default") {
        Notification.requestPermission( (permission) => {if (permission === "granted") serviceWorker(vapidPublicKey); });
      }
}

function serviceWorker(vapidPublicKey){
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("worker.js", {scope: "/"})
        .then(
            (register) => 
            register.pushManager.subscribe({userVisibleOnly: true,applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)})
        )
        .then(
            (subscription) =>
            fetch("/subscribe", { method: "POST", body: JSON.stringify(subscription), headers: {'content-type':'application/json'}})
            )
        .catch(err => console.log(err));
}
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
