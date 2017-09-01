function Get(url, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.onload = () => {
    if (xhr.status === 200) {
      callback('OK', JSON.parse(xhr.responseText));
    } else {
      console.log(`Request failed.  Returned status of ${xhr.status}`);
      callback('ERROR', JSON.parse(xhr.status));
    }
  };
  xhr.send();
}
module.exports.Get = Get;

function Post(url, obj, callback) {
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url);
  xhr.setRequestHeader('Content-type', 'application/json');
  xhr.onload = () => {
    if (xhr.status === 200) {
      callback('OK', JSON.parse(xhr.responseText));
    } else {
      console.log(`Request failed.  Returned status of ${xhr.status}`);
      callback('ERROR', JSON.parse(xhr.status));
    }
  };
  console.log(`POST: ${url}, ${JSON.stringify(obj)}`);
  xhr.send(JSON.stringify(obj));
}
module.exports.Post = Post;
