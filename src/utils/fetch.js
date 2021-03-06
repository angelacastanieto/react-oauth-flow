const defineStaticProp = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    enumerable: false,
    configurable: false,
    writable: false,
    value,
  });

  return obj;
};

export function fetch2(url, opts) {
  alert('url', url);
  alert('opts', opts);
  const request = fetch(url, opts);
  alert('req', request);
  return request
    .then(response => {
      alert(response);
      if (!response.ok) throw response;
      return response.json();
    })
    .catch(err => {
      if (!err.json) {
        throw err;
      }
      err.json().then(errJSON => {
        const error = new Error(err.statusText);
        defineStaticProp(error, 'response', err);
        defineStaticProp(error.response, 'data', errJSON);
        defineStaticProp(error, 'request', request);

        throw error;
      });
    });
}
