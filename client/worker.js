self.addEventListener("push", e => {
  var data = e.data.json();
  var title = data.title
  delete data['title']
  self.registration.showNotification(title, data);
});
